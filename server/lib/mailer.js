import nodemailer from "nodemailer";

// Lazily create a single transporter. If SMTP_HOST is set we use real SMTP
// (e.g. Gmail with an app password). Otherwise we spin up a free Ethereal test
// inbox so the whole OTP/magic-link flow is testable with zero credentials --
// a clickable preview URL is printed to the console for every email sent.
let _t;
async function transporter() {
  if (_t) return _t;
  if (process.env.SMTP_HOST) {
    _t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/STARTTLS
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  } else {
    const test = await nodemailer.createTestAccount();
    console.log("[mailer] No SMTP_HOST set \u2014 using Ethereal dev inbox:", test.user);
    _t = nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, secure: false, auth: { user: test.user, pass: test.pass } });
  }
  return _t;
}

export async function sendMail({ to, subject, html }) {
  const t = await transporter();
  const from = process.env.FROM_EMAIL || "SoulScythe <no-reply@soulscythe.dev>";
  const info = await t.sendMail({ from, to, subject, html });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log("[mailer] Preview (" + to + "): " + preview);
  return { id: info.messageId, preview };
}

// Shared dark, anime-styled HTML email shell
const shell = (inner) => `<div style="background:#08080b;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#f4f4f6">
  <div style="max-width:480px;margin:0 auto;background:#14141d;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(120deg,#8d0f17,#e01e2b);padding:20px 28px;font-size:22px;font-weight:bold;letter-spacing:2px">&#9876; SOULSCYTHE</div>
    <div style="padding:28px">${inner}</div>
    <div style="padding:16px 28px;color:#9a9aa6;font-size:12px;border-top:1px solid rgba(255,255,255,.08)">If you didn't request this, you can safely ignore this email.</div>
  </div></div>`;

export function otpEmail({ otp, magicLink, minutes }) {
  return shell(`
    <h2 style="margin:0 0 8px">Verify your account</h2>
    <p style="color:#cfcfd8">Use the code below to finish creating your SoulScythe account. It expires in <strong>${minutes} minutes</strong>.</p>
    <div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;color:#39e6ff;background:#0e0e14;border:1px solid rgba(57,230,255,.3);border-radius:12px;padding:18px;margin:20px 0">${otp}</div>
    <p style="color:#cfcfd8;text-align:center">\u2014 or \u2014</p>
    <p style="text-align:center;margin:18px 0"><a href="${magicLink}" style="display:inline-block;background:linear-gradient(120deg,#19a9ff,#0a6fcc);color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:bold">Sign up with one click</a></p>
    <p style="color:#9a9aa6;font-size:12px;word-break:break-all">Or paste this link: ${magicLink}</p>`);
}

export function resetEmail({ otp, link, minutes }) {
  return shell(`
    <h2 style="margin:0 0 8px">Reset your password</h2>
    <p style="color:#cfcfd8">Use this code (valid ${minutes} minutes) or the button below to set a new password.</p>
    <div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;color:#e8b923;background:#0e0e14;border:1px solid rgba(232,185,35,.3);border-radius:12px;padding:18px;margin:20px 0">${otp}</div>
    <p style="text-align:center;margin:18px 0"><a href="${link}" style="display:inline-block;background:linear-gradient(120deg,#e01e2b,#8d0f17);color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:bold">Reset password</a></p>
    <p style="color:#9a9aa6;font-size:12px;word-break:break-all">Or paste this link: ${link}</p>`);
}
