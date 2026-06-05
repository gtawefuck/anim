# SoulScythe — Anime E-Commerce

A dark, cinematic anime storefront with an immersive crossfading video background and a full email-based authentication system.

## Project layout

```
.
├─ index.html shop.html product.html cart.html checkout.html   # storefront
├─ login.html register.html verify.html forgot.html reset.html  # auth (video bg + glass UI)
├─ admin.html                                                    # admin dashboard
├─ css/style.css        # base theme
├─ css/enhance.css      # video background + glassmorphism + glow + OTP styles
├─ js/data.js           # seed products / reviews / orders
├─ js/main.js           # cursor, header/footer, cart, storefront logic
├─ js/config.js         # API_BASE + background video playlist  <-- edit me
├─ js/video-bg.js       # crossfading full-screen video background
├─ js/auth.js           # register / verify / login / forgot / reset (calls the API)
├─ js/admin.js          # admin CRUD + dashboard
└─ server/              # Node/Express auth backend (OTP + magic link + reset + JWT)
```

## 1) Run the frontend

Serve the root over HTTP (not file://, because of localStorage + relative paths):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

In **Codespaces**: create a codespace, run the command above, then open the forwarded port 8000.

## 2) Run the auth backend

```bash
cd server
npm install
cp .env.example .env
npm run dev        # http://localhost:4000
```

Then make sure `API_BASE` in `js/config.js` points at the server (default `http://localhost:4000`).

### Email (SMTP)
- Leave `SMTP_HOST` blank to use a free **Ethereal** dev inbox — a clickable preview URL is printed in the server console for every email (great for testing OTP + magic links).
- For real delivery with **Gmail**: enable 2FA, create an **App Password**, and fill `SMTP_USER` / `SMTP_PASS` in `server/.env`.

## Authentication flow

1. **Register** (email + password) → backend emails a **5-digit OTP** *and* a **magic link**, both valid **30 minutes**.
2. **Verify** by typing the OTP **or** clicking the magic link → account is created and a **JWT session** is stored.
3. **Login** with email + password.
4. **Forgot password** → emailed code/link → **reset** to a new password.

Sessions are kept in `localStorage` under `ss_session`; passwords are bcrypt-hashed server-side.

## Immersive video background

`js/video-bg.js` renders a fixed, full-screen background with two stacked `<video>` layers that **crossfade** between clips, behind a legibility overlay. It lazy-loads after page load, respects reduced-motion / Save-Data, and falls back to an animated gradient on small screens.

> The default clips in `js/config.js` are **royalty-free placeholders**. Real anime footage is copyrighted and not available on free CDNs — replace the `VIDEO_SOURCES` list with your own **licensed 4K clips** for the full effect.

To add the video background + glass polish to any other page, include these on it:
```html
<link rel="stylesheet" href="css/enhance.css">
<script src="js/config.js"></script>
<script src="js/video-bg.js"></script>
```
and add `class="has-video-bg"` to the `<body>`.

## Admin

`admin.html` → demo login `admin@soulscythe.com` / `admin123` (hardcoded client-side demo).

## Deploy

- **Frontend:** GitHub Pages (Settings → Pages → deploy from `main`).
- **Backend:** Render / Railway / Fly.io. Set the env vars there, point `FRONTEND_URL` at your live site (so magic/reset links resolve), and update `API_BASE` in `js/config.js` to the deployed API URL.
