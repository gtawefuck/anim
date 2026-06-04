# ⚔️ SoulScythe

An immersive, dark-fantasy **anime e-commerce** experience. Built as a self-contained static site (HTML / CSS / vanilla JS) with all state persisted in `localStorage` — no backend required.

## ✨ Features

- **Cinematic dark theme** — deep blacks, blood reds, electric blues & gold accents.
- **Full-screen video carousel hero** that auto-cycles through background clips.
- **Sharingan custom cursor** that trails the mouse with a spinning/pulsing animation on every page.
- **Looping video backgrounds** on every section (drop your own clips into `assets/`).
- **Bold typography everywhere** using Cinzel + Rajdhani.
- **Shop** with category filters, price sorting & search.
- **Product detail** pages with variant/size selectors and related products.
- **Cart + full checkout flow** (shipping → payment → animated confirmation).
- **Authentication** — register, login & forgot-password pages.
- **Admin panel** at `/admin.html` with product CRUD, order list & dashboard stats.

## 🔑 Admin access

- URL: `admin.html`
- Email: `admin@soulscythe.com`
- Password: `admin123`

## 🚀 Run it

Just open `index.html` in a browser, or enable **GitHub Pages** (Settings → Pages → deploy from `main`) and visit your published URL.

## 📁 Structure

```
index.html        Homepage (hero carousel, featured, reviews, newsletter)
shop.html         Product grid + filters/sort
product.html      Product detail + related
cart.html         Cart
checkout.html     Multi-step checkout
login.html        Login
register.html     Register
forgot.html       Forgot password
admin.html        Admin dashboard + product/order management
css/style.css     Global theme & components
js/data.js        Seed data (products, reviews, orders)
js/main.js        Cursor, carousel, cart, auth, rendering
js/admin.js       Admin panel logic
assets/           Drop your background videos / posters here
```

> Replace the placeholder `<video>` sources in the HTML with your own licensed anime clips to complete the cinematic effect.
