# SoulScythe Auth Server

A small Express backend that powers SoulScythe's authentication:

- **Register** with email + password → emails a **5-digit OTP** *and* a **magic link** (both valid 30 min)
- **Verify** via OTP **or** one-click magic link → activates account + returns a JWT session
- **Login** (email + password)
- **Forgot / reset password** via emailed code or link
- Passwords hashed with **bcrypt**; sessions are **JWT** (7-day expiry)

> The store is in-memory (see `lib/store.js`). Restarting the server clears users. For production, swap the Maps for Redis (OTPs) + Postgres/Mongo (users).

## Run locally

```bash
cd server
npm install
cp .env.example .env   # then edit .env
npm run dev            # or: npm start
```

The API runs on `http://localhost:4000`.

### Email setup
- **Easiest (no setup):** leave `SMTP_HOST` blank. The server creates a free Ethereal test inbox and prints a clickable **preview URL** in the console for every email.
- **Gmail:** enable 2FA, create an **App Password**, and set `SMTP_USER` / `SMTP_PASS` in `.env`.
- **Any SMTP:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`.

### Connect the frontend
Set `API_BASE` in `js/config.js` to this server's URL (default `http://localhost:4000`).
Set `FRONTEND_URL` in `.env` to wherever the site is served so magic/reset links point back correctly.

## Endpoints

| Method | Path | Body |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/verify-otp` | `{ email, otp }` |
| GET  | `/api/auth/verify-magic?token=` | — |
| POST | `/api/auth/resend-otp` | `{ email }` |
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/forgot` | `{ email }` |
| POST | `/api/auth/reset` | `{ email, otp, newPassword }` or `{ token, newPassword }` |
| GET  | `/api/auth/me` | `Authorization: Bearer <jwt>` |
| GET  | `/api/health` | — |

## Deploy
Deploy to Render, Railway, Fly.io, or any Node host. Set the same env vars there, point `FRONTEND_URL` at your live site, and update `API_BASE` in `js/config.js` to the deployed API URL.
