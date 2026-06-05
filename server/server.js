import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { users, pending, resets } from "./lib/store.js";
import { sendMail, otpEmail, resetEmail } from "./lib/mailer.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

const JWT_SECRET = process.env.JWT_SECRET || "dev-soulscythe-secret-change-me";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:8000").replace(/\/$/, "");
const OTP_TTL_MIN = 30; // OTP + magic link validity
const isDev = process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genOtp = () => String(Math.floor(10000 + Math.random() * 90000)); // 5-digit numeric
const sessionToken = (u) => jwt.sign({ sub: u.email, name: u.name }, JWT_SECRET, { expiresIn: "7d" });
const bad = (res, code, error) => res.status(code).json({ error });

// ---- Register: stage a pending account, email a 5-digit OTP + magic link ----
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !emailRe.test(email)) return bad(res, 400, "Enter a valid email.");
    if (!password || password.length < 8) return bad(res, 400, "Password must be at least 8 characters.");
    const key = email.toLowerCase();
    if (users.has(key)) return bad(res, 409, "An account with that email already exists.");
    const otp = genOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const passHash = await bcrypt.hash(password, 10);
    const otpExpires = Date.now() + OTP_TTL_MIN * 60 * 1000;
    const magic = jwt.sign({ email: key, purpose: "magic" }, JWT_SECRET, { expiresIn: OTP_TTL_MIN + "m" });
    pending.set(key, { name: name || "Hunter", email: key, passHash, otpHash, otpExpires });
    const magicLink = FRONTEND_URL + "/verify.html?token=" + encodeURIComponent(magic) + "&email=" + encodeURIComponent(key);
    await sendMail({ to: key, subject: "Verify your SoulScythe account", html: otpEmail({ otp, magicLink, minutes: OTP_TTL_MIN }) });
    res.json({ ok: true, message: "Verification email sent.", ...(isDev ? { devOtp: otp, devMagicLink: magicLink } : {}) });
  } catch (e) { console.error(e); bad(res, 500, "Failed to start registration."); }
});

// ---- Resend OTP ----
app.post("/api/auth/resend-otp", async (req, res) => {
  const key = (req.body?.email || "").toLowerCase();
  const p = pending.get(key);
  if (!p) return bad(res, 404, "No pending registration for that email.");
  const otp = genOtp();
  p.otpHash = await bcrypt.hash(otp, 10);
  p.otpExpires = Date.now() + OTP_TTL_MIN * 60 * 1000;
  const magic = jwt.sign({ email: key, purpose: "magic" }, JWT_SECRET, { expiresIn: OTP_TTL_MIN + "m" });
  const magicLink = FRONTEND_URL + "/verify.html?token=" + encodeURIComponent(magic) + "&email=" + encodeURIComponent(key);
  await sendMail({ to: key, subject: "Your new SoulScythe code", html: otpEmail({ otp, magicLink, minutes: OTP_TTL_MIN }) });
  res.json({ ok: true, ...(isDev ? { devOtp: otp } : {}) });
});

// ---- Verify OTP -> activate account + issue session ----
app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body || {};
  const key = (email || "").toLowerCase();
  const p = pending.get(key);
  if (!p) return bad(res, 404, "No pending registration. Please register again.");
  if (Date.now() > p.otpExpires) { pending.delete(key); return bad(res, 410, "Code expired. Please request a new one."); }
  const ok = await bcrypt.compare(String(otp || ""), p.otpHash);
  if (!ok) return bad(res, 401, "Incorrect code. Try again.");
  const user = { name: p.name, email: p.email, passHash: p.passHash, createdAt: Date.now() };
  users.set(key, user); pending.delete(key);
  res.json({ token: sessionToken(user), user: { name: user.name, email: user.email } });
});

// ---- Verify magic link -> activate account + issue session ----
app.get("/api/auth/verify-magic", async (req, res) => {
  try {
    const payload = jwt.verify(req.query.token, JWT_SECRET);
    if (payload.purpose !== "magic") return bad(res, 400, "Invalid link.");
    const key = payload.email;
    let user = users.get(key);
    if (!user) {
      const p = pending.get(key);
      if (!p) return bad(res, 404, "No pending registration. Please register again.");
      user = { name: p.name, email: p.email, passHash: p.passHash, createdAt: Date.now() };
      users.set(key, user); pending.delete(key);
    }
    res.json({ token: sessionToken(user), user: { name: user.name, email: user.email } });
  } catch (e) { bad(res, 401, "This link is invalid or has expired."); }
});

// ---- Login ----
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const key = (email || "").toLowerCase();
  const user = users.get(key);
  if (!user) return bad(res, 401, "Invalid email or password.");
  const ok = await bcrypt.compare(String(password || ""), user.passHash);
  if (!ok) return bad(res, 401, "Invalid email or password.");
  res.json({ token: sessionToken(user), user: { name: user.name, email: user.email } });
});

// ---- Forgot password: email a reset OTP + reset link ----
app.post("/api/auth/forgot", async (req, res) => {
  const key = (req.body?.email || "").toLowerCase();
  // Always respond ok so we don't leak which emails are registered.
  if (users.has(key)) {
    const otp = genOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const token = jwt.sign({ email: key, purpose: "reset" }, JWT_SECRET, { expiresIn: OTP_TTL_MIN + "m" });
    resets.set(key, { otpHash, expires: Date.now() + OTP_TTL_MIN * 60 * 1000 });
    const link = FRONTEND_URL + "/reset.html?token=" + encodeURIComponent(token) + "&email=" + encodeURIComponent(key);
    await sendMail({ to: key, subject: "Reset your SoulScythe password", html: resetEmail({ otp, link, minutes: OTP_TTL_MIN }) });
    return res.json({ ok: true, ...(isDev ? { devOtp: otp, devLink: link } : {}) });
  }
  res.json({ ok: true });
});

// ---- Reset password (via OTP or via token from the email link) ----
app.post("/api/auth/reset", async (req, res) => {
  const { email, otp, token, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) return bad(res, 400, "Password must be at least 8 characters.");
  let key = (email || "").toLowerCase();
  if (token) {
    try { const payload = jwt.verify(token, JWT_SECRET); if (payload.purpose !== "reset") throw 0; key = payload.email; }
    catch (e) { return bad(res, 401, "Reset link is invalid or expired."); }
  } else {
    const r = resets.get(key);
    if (!r) return bad(res, 404, "No reset request found.");
    if (Date.now() > r.expires) { resets.delete(key); return bad(res, 410, "Code expired."); }
    const ok = await bcrypt.compare(String(otp || ""), r.otpHash);
    if (!ok) return bad(res, 401, "Incorrect code.");
  }
  const user = users.get(key);
  if (!user) return bad(res, 404, "Account not found.");
  user.passHash = await bcrypt.hash(newPassword, 10);
  resets.delete(key);
  res.json({ ok: true, message: "Password updated. You can now sign in." });
});

// ---- Session check ----
app.get("/api/auth/me", (req, res) => {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return bad(res, 401, "Missing token.");
  try { const p = jwt.verify(t, JWT_SECRET); res.json({ user: { email: p.sub, name: p.name } }); }
  catch (e) { bad(res, 401, "Invalid or expired session."); }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "soulscythe-auth" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("SoulScythe auth server running on http://localhost:" + PORT));
