/* SoulScythe frontend auth controller.
 * Drives register / verify (OTP + magic link) / login / forgot / reset pages
 * against the backend in /server. Pages opt in via body[data-auth="..."].
 */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var cfg = window.SS_CONFIG || {};
    var API = (cfg.API_BASE || "").replace(/\/+$/, "");
    var mode = document.body.dataset.auth;
    if (!mode) return;

    function $(s) { return document.querySelector(s); }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function param(k) { return new URLSearchParams(location.search).get(k); }

    function api(path, body, method) {
      return fetch(API + path, {
        method: method || "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d.error || "Something went wrong. Is the auth server running?");
          return d;
        });
      }).catch(function (err) {
        if (err instanceof TypeError) throw new Error("Can't reach the auth server. Start it in /server (npm run dev).");
        throw err;
      });
    }

    function msg(type, text) { var m = $("#form-msg"); if (!m) return; m.className = "form-msg " + type; m.textContent = text; }
    function clearMsg() { var m = $("#form-msg"); if (m) { m.className = "form-msg"; m.textContent = ""; } }
    function loading(btn, on, label) {
      if (!btn) return;
      if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> ' + (label || "Please wait..."); }
      else { btn.disabled = false; btn.innerHTML = btn.dataset.label || label; }
    }
    function saveSession(d) {
      localStorage.setItem("ss_session", JSON.stringify({ name: d.user.name, email: d.user.email, token: d.token }));
    }

    // ---- OTP boxes: auto-advance, backspace, paste ----
    function wireOtp(container, onComplete) {
      var boxes = Array.prototype.slice.call(container.querySelectorAll(".otp-box"));
      function value() { return boxes.map(function (b) { return b.value; }).join(""); }
      boxes.forEach(function (box, i) {
        box.addEventListener("input", function () {
          box.value = box.value.replace(/\D/g, "").slice(0, 1);
          box.classList.toggle("filled", !!box.value);
          if (box.value && boxes[i + 1]) boxes[i + 1].focus();
          if (onComplete && boxes.every(function (b) { return b.value; })) onComplete(value());
        });
        box.addEventListener("keydown", function (e) {
          if (e.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus();
        });
        box.addEventListener("paste", function (e) {
          e.preventDefault();
          var txt = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, boxes.length);
          txt.split("").forEach(function (ch, j) { if (boxes[j]) { boxes[j].value = ch; boxes[j].classList.add("filled"); } });
          var nextEmpty = boxes[txt.length] || boxes[boxes.length - 1];
          nextEmpty.focus();
          if (onComplete && txt.length === boxes.length) onComplete(txt);
        });
      });
      return { value: value, focus: function () { if (boxes[0]) boxes[0].focus(); } };
    }

    var cdTimer;
    function startCountdown() {
      var el = $("#countdown"); if (!el) return;
      var end = Date.now() + 30 * 60 * 1000;
      clearInterval(cdTimer);
      (function tick() {
        var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
        el.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
        if (s <= 0) clearInterval(cdTimer);
      })();
      cdTimer = setInterval(arguments.callee ? function(){var s=Math.max(0,Math.floor((end-Date.now())/1000));el.textContent=Math.floor(s/60)+":"+("0"+(s%60)).slice(-2);if(s<=0)clearInterval(cdTimer);} : null, 1000);
    }

    var routes = { register: initRegister, verify: initVerify, login: initLogin, forgot: initForgot, reset: initReset };
    (routes[mode] || function () {})();

    function initRegister() {
      var f = $("#reg-form");
      f.addEventListener("submit", function (e) {
        e.preventDefault(); clearMsg();
        var name = $("#r-name").value.trim(), email = $("#r-email").value.trim();
        var pass = $("#r-pass").value, conf = $("#r-conf").value;
        if (!name) return msg("error", "Please enter your name.");
        if (!emailRe.test(email)) return msg("error", "Enter a valid email address.");
        if (pass.length < 8) return msg("error", "Password must be at least 8 characters.");
        if (pass !== conf) return msg("error", "Passwords do not match.");
        var btn = f.querySelector("button[type=submit]"); loading(btn, true, "Sending code...");
        api("/api/auth/register", { name: name, email: email, password: pass }).then(function (d) {
          if (d.devOtp) console.log("[dev] OTP:", d.devOtp, "| magic:", d.devMagicLink);
          location.href = "verify.html?email=" + encodeURIComponent(email);
        }).catch(function (err) { loading(btn, false); msg("error", err.message); });
      });
    }

    function initLogin() {
      var f = $("#login-form");
      f.addEventListener("submit", function (e) {
        e.preventDefault(); clearMsg();
        var email = $("#l-email").value.trim(), pass = $("#l-pass").value;
        if (!emailRe.test(email)) return msg("error", "Enter a valid email.");
        if (!pass) return msg("error", "Enter your password.");
        var btn = f.querySelector("button[type=submit]"); loading(btn, true, "Signing in...");
        api("/api/auth/login", { email: email, password: pass }).then(function (d) {
          saveSession(d); msg("success", "Welcome back, " + d.user.name + "!");
          setTimeout(function () { location.href = "index.html"; }, 700);
        }).catch(function (err) { loading(btn, false); msg("error", err.message); });
      });
    }

    function initForgot() {
      var f = $("#forgot-form");
      f.addEventListener("submit", function (e) {
        e.preventDefault(); clearMsg();
        var email = $("#fp-email").value.trim();
        if (!emailRe.test(email)) return msg("error", "Enter a valid email.");
        var btn = f.querySelector("button[type=submit]"); loading(btn, true, "Sending...");
        api("/api/auth/forgot", { email: email }).then(function (d) {
          if (d.devOtp) console.log("[dev] reset OTP:", d.devOtp, "| link:", d.devLink);
          msg("success", "If that email exists, a reset code is on its way.");
          setTimeout(function () { location.href = "reset.html?email=" + encodeURIComponent(email); }, 1100);
        }).catch(function (err) { loading(btn, false); msg("error", err.message); });
      });
    }

    function initVerify() {
      var email = param("email") || "";
      var token = param("token");
      var label = $("#verify-email"); if (label) label.textContent = email;

      if (token) { // magic-link path: one-click sign-up
        msg("success", "Verifying your magic link...");
        api("/api/auth/verify-magic?token=" + encodeURIComponent(token), null, "GET").then(function (d) {
          saveSession(d); msg("success", "Verified! Entering the realm...");
          setTimeout(function () { location.href = "index.html"; }, 800);
        }).catch(function (err) { msg("error", err.message); });
        return;
      }

      var otp = wireOtp($("#otp"), function (code) { submit(code); });
      otp.focus();
      startCountdown();
      function submit(code) {
        clearMsg();
        var btn = $("#verify-btn"); loading(btn, true, "Verifying...");
        api("/api/auth/verify-otp", { email: email, otp: code || otp.value() }).then(function (d) {
          saveSession(d); msg("success", "Verified! Entering the realm...");
          setTimeout(function () { location.href = "index.html"; }, 800);
        }).catch(function (err) { loading(btn, false); msg("error", err.message); });
      }
      $("#verify-btn").addEventListener("click", function () {
        if (otp.value().length < 5) return msg("error", "Enter the 5-digit code.");
        submit();
      });
      $("#resend").addEventListener("click", function (e) {
        e.preventDefault();
        api("/api/auth/resend-otp", { email: email }).then(function (d) {
          if (d.devOtp) console.log("[dev] OTP:", d.devOtp);
          msg("success", "A new code has been sent."); startCountdown();
        }).catch(function (err) { msg("error", err.message); });
      });
    }

    function initReset() {
      var email = param("email") || "";
      var token = param("token");
      var label = $("#reset-email"); if (label) label.textContent = email || "your account";
      var otpApi = null;
      if (token) { var w = $("#otp-wrap"); if (w) w.style.display = "none"; }
      else { otpApi = wireOtp($("#otp"), function () {}); }
      var f = $("#reset-form");
      f.addEventListener("submit", function (e) {
        e.preventDefault(); clearMsg();
        var np = $("#np").value, cf = $("#np-conf").value;
        if (np.length < 8) return msg("error", "Password must be at least 8 characters.");
        if (np !== cf) return msg("error", "Passwords do not match.");
        var payload = { newPassword: np };
        if (token) { payload.token = token; }
        else {
          payload.email = email; payload.otp = otpApi ? otpApi.value() : "";
          if (payload.otp.length < 5) return msg("error", "Enter the 5-digit code.");
        }
        var btn = f.querySelector("button[type=submit]"); loading(btn, true, "Updating...");
        api("/api/auth/reset", payload).then(function () {
          msg("success", "Password updated! Redirecting to login...");
          setTimeout(function () { location.href = "login.html"; }, 1100);
        }).catch(function (err) { loading(btn, false); msg("error", err.message); });
      });
    }
  });
})();
