/* =========================================================
   SoulScythe — core front-end logic
   Handles: Sharingan cursor, header/footer, cart, carousel,
   auth, checkout, and all page rendering. Vanilla JS only.
   ========================================================= */

/* ---------- Small helpers ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function getParam(name) { return new URLSearchParams(location.search).get(name); }

/* ---------- Central store (localStorage wrapper) ---------- */
const SS = {
  getProducts() { return JSON.parse(localStorage.getItem("ss_products") || "[]"); },
  saveProducts(p) { localStorage.setItem("ss_products", JSON.stringify(p)); },
  getProduct(id) { return SS.getProducts().find(function (p) { return String(p.id) === String(id); }); },
  getCart() { return JSON.parse(localStorage.getItem("ss_cart") || "[]"); },
  saveCart(c) { localStorage.setItem("ss_cart", JSON.stringify(c)); SS.updateCartBadge(); },
  getOrders() { return JSON.parse(localStorage.getItem("ss_orders") || "[]"); },
  saveOrders(o) { localStorage.setItem("ss_orders", JSON.stringify(o)); },
  getReviews() { return JSON.parse(localStorage.getItem("ss_reviews") || "[]"); },
  getUsers() { return JSON.parse(localStorage.getItem("ss_users") || "[]"); },
  saveUsers(u) { localStorage.setItem("ss_users", JSON.stringify(u)); },
  getSession() { return JSON.parse(localStorage.getItem("ss_session") || "null"); },
  setSession(s) { localStorage.setItem("ss_session", JSON.stringify(s)); },
  clearSession() { localStorage.removeItem("ss_session"); },
  money(n) { return "$" + Number(n).toFixed(2); },
  /* Themed inline SVG placeholder image (self-contained, no network) */
  img(p) {
    const c1 = (p.colors && p.colors[0]) || "#e01e2b";
    const c2 = (p.colors && p.colors[1]) || "#19a9ff";
    const label = escapeHtml(p.name || "SoulScythe");
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>" +
      "<defs><radialGradient id='g' cx='50%' cy='40%' r='65%'>" +
      "<stop offset='0' stop-color='" + c1 + "'/>" +
      "<stop offset='1' stop-color='" + c2 + "'/></radialGradient></defs>" +
      "<rect width='600' height='600' fill='#0b0b12'/>" +
      "<circle cx='300' cy='250' r='185' fill='url(#g)' opacity='0.9'/>" +
      "<circle cx='300' cy='250' r='70' fill='#0b0b12'/>" +
      "<circle cx='300' cy='250' r='30' fill='" + c1 + "'/>" +
      "<text x='300' y='540' fill='#f4f4f6' font-size='30' font-family='Georgia' font-weight='bold' text-anchor='middle'>" + label + "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  },
  cartCount() { return SS.getCart().reduce(function (n, i) { return n + i.qty; }, 0); },
  cartSubtotal() {
    return SS.getCart().reduce(function (sum, i) {
      const p = SS.getProduct(i.id);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  },
  addToCart(id, size, qty) {
    qty = qty || 1;
    const cart = SS.getCart();
    const existing = cart.find(function (i) { return String(i.id) === String(id) && i.size === size; });
    if (existing) existing.qty += qty; else cart.push({ id: id, size: size || "One Size", qty: qty });
    SS.saveCart(cart);
  },
  updateCartBadge() {
    qsa(".cart-count").forEach(function (el) {
      const n = SS.cartCount();
      el.textContent = n;
      el.style.display = n > 0 ? "inline-flex" : "none";
    });
  }
};
window.SS = SS;

/* ---------- Star rendering ---------- */
function stars(n) {
  n = Math.round(n || 0);
  let out = "";
  for (let i = 0; i < 5; i++) out += i < n ? "\u2605" : "\u2606";
  return out;
}

/* ---------- Toast ---------- */
function toast(msg) {
  let t = qs("#ss-toast");
  if (!t) { t = document.createElement("div"); t.id = "ss-toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__ssToast);
  window.__ssToast = setTimeout(function () { t.classList.remove("show"); }, 2200);
}

/* ---------- Sharingan cursor ---------- */
function initCursor() {
  if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const wrap = document.createElement("div");
  wrap.id = "ss-cursor";
  const tomoe = "<g><circle cx='50' cy='27' r='7'/><path d='M50 20 C59 25 57 38 50 45 C50 38 46 33 44 30 C46 26 48 22 50 20 Z'/></g>";
  wrap.innerHTML =
    "<svg viewBox='0 0 100 100'>" +
    "<circle cx='50' cy='50' r='47' fill='#c1121f' stroke='#0b0b0b' stroke-width='4'/>" +
    "<circle cx='50' cy='50' r='14' fill='#0b0b0b'/>" +
    "<g fill='#0b0b0b'>" + tomoe +
    "<g transform='rotate(120 50 50)'>" + tomoe + "</g>" +
    "<g transform='rotate(240 50 50)'>" + tomoe + "</g>" +
    "</g></svg>";
  const dot = document.createElement("div");
  dot.id = "ss-cursor-dot";
  document.body.appendChild(wrap);
  document.body.appendChild(dot);
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    wrap.classList.add("show"); dot.classList.add("show");
    dot.style.transform = "translate(" + (mx - 3) + "px," + (my - 3) + "px)";
  });
  addEventListener("mouseout", function (e) { if (!e.relatedTarget) { wrap.classList.remove("show"); dot.classList.remove("show"); } });
  document.addEventListener("mouseover", function (e) {
    if (e.target.closest("a,button,.chip,.size-btn,input,select")) wrap.classList.add("hover");
    else wrap.classList.remove("hover");
  });
  (function loop() {
    cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
    wrap.style.transform = "translate(" + (cx - 19) + "px," + (cy - 19) + "px)";
    requestAnimationFrame(loop);
  })();
}

/* ---------- Header & footer injection ---------- */
function sectionBg(extra) {
  return (
    '<div class="section-bg">' +
    '<video autoplay muted loop playsinline poster="">' +
    '<source src="assets/' + (extra || "ambient") + '.mp4" type="video/mp4">' +
    "</video>" +
    '<div class="bg-overlay"></div></div>'
  );
}
function injectChrome() {
  const page = document.body.dataset.page || "";
  const session = SS.getSession();
  const account = session
    ? '<a href="#" id="logout-link">Hi, ' + escapeHtml((session.name || "Hunter").split(" ")[0]) + " \u2715</a>"
    : '<a href="login.html" class="' + (page === "login" ? "active" : "") + '">Login</a>';
  const headerHost = qs("#ss-header");
  if (headerHost) {
    headerHost.innerHTML =
      '<header class="site-header">' +
      '<a class="brand" href="index.html"><span class="spark">\u2694</span> SOULSCYTHE</a>' +
      '<button class="nav-toggle" aria-label="Menu">\u2630</button>' +
      '<nav class="nav">' +
      '<a href="index.html" class="' + (page === "home" ? "active" : "") + '">Home</a>' +
      '<a href="shop.html" class="' + (page === "shop" || page === "product" ? "active" : "") + '">Shop</a>' +
      '<a href="admin.html" class="' + (page === "admin" ? "active" : "") + '">Admin</a>' +
      account +
      '<a href="cart.html" class="cart-link">\uD83D\uDED2 Cart <span class="cart-count">0</span></a>' +
      "</nav></header>";
    const toggle = qs(".nav-toggle"), nav = qs(".nav");
    if (toggle) toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
    const logout = qs("#logout-link");
    if (logout) logout.addEventListener("click", function (e) { e.preventDefault(); SS.clearSession(); toast("Logged out"); setTimeout(function () { location.reload(); }, 600); });
    addEventListener("scroll", function () { qs(".site-header").classList.toggle("scrolled", scrollY > 40); });
  }
  const footerHost = qs("#ss-footer");
  if (footerHost) {
    footerHost.innerHTML =
      '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
      '<div><h4><span style="color:var(--blood)">\u2694</span> SOULSCYTHE</h4>' +
      "<p>Forged for those who walk between worlds. Premium anime gear, figures & apparel for true hunters.</p></div>" +
      '<div><h4>Shop</h4><a href="shop.html">All Products</a><a href="shop.html">Figures</a><a href="shop.html">Apparel</a><a href="shop.html">Accessories</a></div>' +
      '<div><h4>Account</h4><a href="login.html">Login</a><a href="register.html">Register</a><a href="cart.html">Cart</a><a href="admin.html">Admin</a></div>' +
      '</div><div class="footer-bottom">\u00A9 2026 SoulScythe. All realms reserved. Built for demo purposes.</div></div></footer>';
  }
  SS.updateCartBadge();
}

/* ---------- Global add-to-cart delegation ---------- */
document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  e.preventDefault();
  const p = SS.getProduct(btn.getAttribute("data-add"));
  if (!p) return;
  SS.addToCart(p.id, (p.sizes && p.sizes[0]) || "One Size", 1);
  toast(p.name + " added to cart");
});

/* ---------- Product card markup ---------- */
function productCard(p) {
  return (
    '<article class="product-card">' +
    '<a class="pc-media" href="product.html?id=' + p.id + '">' +
    (p.badge ? '<span class="pc-badge">' + escapeHtml(p.badge) + "</span>" : "") +
    '<img src="' + SS.img(p) + '" alt="' + escapeHtml(p.name) + '" loading="lazy"></a>' +
    '<div class="pc-body">' +
    '<span class="pc-cat">' + escapeHtml(p.category) + "</span>" +
    '<h3 class="pc-name"><a href="product.html?id=' + p.id + '">' + escapeHtml(p.name) + "</a></h3>" +
    '<div class="pc-stars">' + stars(p.rating) + "</div>" +
    '<div class="pc-foot"><span class="pc-price">' + SS.money(p.price) + "</span>" +
    '<button class="btn btn-primary btn-sm" data-add="' + p.id + '">Add</button></div>' +
    "</div></article>"
  );
}

/* ---------- Carousel ---------- */
function initCarousel() {
  const slides = qsa(".slide");
  if (!slides.length) return;
  let i = 0;
  slides[i].classList.add("active");
  const dotsHost = qs(".carousel-dots");
  if (dotsHost) {
    slides.forEach(function (_, idx) {
      const b = document.createElement("button");
      if (idx === 0) b.classList.add("active");
      b.addEventListener("click", function () { go(idx); });
      dotsHost.appendChild(b);
    });
  }
  const dots = dotsHost ? qsa("button", dotsHost) : [];
  function go(n) {
    slides[i].classList.remove("active"); if (dots[i]) dots[i].classList.remove("active");
    i = (n + slides.length) % slides.length;
    slides[i].classList.add("active"); if (dots[i]) dots[i].classList.add("active");
  }
  let timer = setInterval(function () { go(i + 1); }, 6000);
  if (dotsHost) dotsHost.addEventListener("click", function () { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6000); });
}

/* ============== PAGE ROUTERS ============== */
const PAGES = {
  home() {
    initCarousel();
    const feat = qs("#featured");
    if (feat) feat.innerHTML = SS.getProducts().slice(0, 4).map(productCard).join("");
    const rev = qs("#reviews");
    if (rev) rev.innerHTML = SS.getReviews().map(function (r) {
      return '<div class="review-card"><div class="review-stars">' + stars(r.stars) + "</div>" +
        '<p class="review-text">\u201C' + escapeHtml(r.text) + '\u201D</p>' +
        '<p class="review-author">\u2014 ' + escapeHtml(r.author) + "</p></div>";
    }).join("");
  },

  shop() {
    const grid = qs("#shop-grid");
    const catHost = qs("#filter-cats");
    const search = qs("#search");
    const sort = qs("#sort");
    let activeCat = "All";
    const cats = ["All"].concat(window.SS_DATA.categories);
    if (catHost) catHost.innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === "All" ? " active" : "") + '" data-cat="' + c + '">' + c + "</button>";
    }).join("");
    function render() {
      let list = SS.getProducts();
      if (activeCat !== "All") list = list.filter(function (p) { return p.category === activeCat; });
      const term = (search && search.value || "").toLowerCase().trim();
      if (term) list = list.filter(function (p) { return p.name.toLowerCase().indexOf(term) > -1; });
      const s = sort && sort.value;
      if (s === "low") list.sort(function (a, b) { return a.price - b.price; });
      else if (s === "high") list.sort(function (a, b) { return b.price - a.price; });
      else if (s === "rating") list.sort(function (a, b) { return b.rating - a.rating; });
      grid.innerHTML = list.length ? list.map(productCard).join("") : '<p class="empty-state">No relics found in this realm.</p>';
    }
    if (catHost) catHost.addEventListener("click", function (e) {
      const c = e.target.closest("[data-cat]"); if (!c) return;
      activeCat = c.getAttribute("data-cat");
      qsa(".chip", catHost).forEach(function (x) { x.classList.remove("active"); });
      c.classList.add("active"); render();
    });
    if (search) search.addEventListener("input", render);
    if (sort) sort.addEventListener("change", render);
    const preset = getParam("cat");
    if (preset && cats.indexOf(preset) > -1) { activeCat = preset; qsa(".chip", catHost).forEach(function (x) { x.classList.toggle("active", x.getAttribute("data-cat") === preset); }); }
    render();
  },

  product() {
    const host = qs("#product-detail");
    const p = SS.getProduct(getParam("id"));
    if (!p) { host.innerHTML = '<p class="empty-state">This relic has vanished. <a href="shop.html" style="color:var(--blue-bright)">Return to shop</a></p>'; return; }
    document.title = p.name + " \u2014 SoulScythe";
    host.innerHTML =
      '<div class="pdp"><div class="pdp-media"><img src="' + SS.img(p) + '" alt="' + escapeHtml(p.name) + '"></div>' +
      '<div class="pdp-info"><span class="eyebrow">' + escapeHtml(p.category) + "</span>" +
      "<h1>" + escapeHtml(p.name) + "</h1>" +
      '<div class="pc-stars" style="color:var(--gold);font-size:1.1rem">' + stars(p.rating) + "</div>" +
      '<div class="pdp-price">' + SS.money(p.price) + (p.oldPrice ? ' <span style="color:var(--muted);font-size:1.1rem;text-decoration:line-through">' + SS.money(p.oldPrice) + "</span>" : "") + "</div>" +
      '<p class="pdp-desc">' + escapeHtml(p.description) + "</p>" +
      '<div class="variant-row"><label>Variant / Size</label><div class="sizes" id="sizes">' +
      (p.sizes || ["One Size"]).map(function (s, idx) { return '<button class="size-btn' + (idx === 0 ? " active" : "") + '" data-size="' + escapeHtml(s) + '">' + escapeHtml(s) + "</button>"; }).join("") +
      "</div></div>" +
      '<div class="variant-row"><label>Quantity</label><div class="qty-box"><button id="q-minus">\u2212</button><input id="q-val" value="1" readonly><button id="q-plus">+</button></div></div>' +
      '<button class="btn btn-primary btn-block" id="pdp-add">Add to Cart</button></div></div>';
    let size = (p.sizes && p.sizes[0]) || "One Size", qty = 1;
    qsa("#sizes .size-btn").forEach(function (b) { b.addEventListener("click", function () { qsa("#sizes .size-btn").forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); size = b.getAttribute("data-size"); }); });
    qs("#q-minus").addEventListener("click", function () { qty = Math.max(1, qty - 1); qs("#q-val").value = qty; });
    qs("#q-plus").addEventListener("click", function () { qty++; qs("#q-val").value = qty; });
    qs("#pdp-add").addEventListener("click", function () { SS.addToCart(p.id, size, qty); toast(p.name + " added to cart"); });
    const related = qs("#related");
    if (related) related.innerHTML = SS.getProducts().filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 4).map(productCard).join("");
  },

  cart() {
    const host = qs("#cart-view");
    function render() {
      const cart = SS.getCart();
      if (!cart.length) { host.innerHTML = '<div class="empty-state"><h2 style="color:#fff;margin-bottom:1rem">Your cart is empty</h2><a href="shop.html" class="btn btn-primary">Enter the Shop</a></div>'; return; }
      const rows = cart.map(function (i, idx) {
        const p = SS.getProduct(i.id); if (!p) return "";
        return '<div class="cart-item"><img src="' + SS.img(p) + '" alt=""><div><h4>' + escapeHtml(p.name) + "</h4>" +
          '<div class="meta">' + escapeHtml(i.size) + " \u00B7 " + SS.money(p.price) + "</div>" +
          '<div class="qty-box" style="margin-top:.5rem"><button data-dec="' + idx + '">\u2212</button><input value="' + i.qty + '" readonly><button data-inc="' + idx + '">+</button></div>' +
          '<button class="cart-remove" data-rm="' + idx + '">Remove</button></div>' +
          '<div class="pc-price">' + SS.money(p.price * i.qty) + "</div></div>";
      }).join("");
      const sub = SS.cartSubtotal();
      const ship = sub > 100 || sub === 0 ? 0 : 9.99;
      host.innerHTML = '<div class="cart-wrap"><div>' + rows + "</div>" +
        '<div class="summary"><h3>Order Summary</h3>' +
        '<div class="summary-row"><span>Subtotal</span><span>' + SS.money(sub) + "</span></div>" +
        '<div class="summary-row"><span>Shipping</span><span>' + (ship === 0 ? "FREE" : SS.money(ship)) + "</span></div>" +
        '<div class="summary-row total"><span>Total</span><span>' + SS.money(sub + ship) + "</span></div>" +
        '<a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:1rem">Checkout</a>' +
        '<a href="shop.html" class="btn btn-ghost btn-block" style="margin-top:.6rem">Continue Shopping</a></div></div>';
    }
    host.addEventListener("click", function (e) {
      const cart = SS.getCart();
      const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"), rm = e.target.closest("[data-rm]");
      if (inc) { cart[+inc.getAttribute("data-inc")].qty++; SS.saveCart(cart); render(); }
      else if (dec) { const k = +dec.getAttribute("data-dec"); cart[k].qty = Math.max(1, cart[k].qty - 1); SS.saveCart(cart); render(); }
      else if (rm) { cart.splice(+rm.getAttribute("data-rm"), 1); SS.saveCart(cart); render(); }
    });
    render();
  },

  checkout() {
    const cart = SS.getCart();
    const host = qs("#checkout-summary");
    if (!cart.length) { qs("#checkout-root").innerHTML = '<div class="empty-state"><h2 style="color:#fff">Your cart is empty</h2><a href="shop.html" class="btn btn-primary" style="margin-top:1rem">Go Shopping</a></div>'; return; }
    const sub = SS.cartSubtotal();
    const ship = sub > 100 ? 0 : 9.99;
    if (host) host.innerHTML = '<h3>Summary</h3>' + cart.map(function (i) { const p = SS.getProduct(i.id); return '<div class="summary-row"><span>' + escapeHtml(p.name) + " \u00D7" + i.qty + "</span><span>" + SS.money(p.price * i.qty) + "</span></div>"; }).join("") +
      '<div class="summary-row"><span>Shipping</span><span>' + (ship === 0 ? "FREE" : SS.money(ship)) + "</span></div>" +
      '<div class="summary-row total"><span>Total</span><span>' + SS.money(sub + ship) + "</span></div>";
    const steps = qsa(".step"), panels = qsa(".checkout-panel");
    let shipData = {};
    function showStep(n) { steps.forEach(function (s, i) { s.classList.toggle("active", i === n); s.classList.toggle("done", i < n); }); panels.forEach(function (p, i) { p.hidden = i !== n; }); window.scrollTo({ top: 0, behavior: "smooth" }); }
    qs("#ship-form").addEventListener("submit", function (e) { e.preventDefault(); shipData = { name: qs("#c-name").value, email: qs("#c-email").value }; showStep(1); });
    qs("#pay-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const orders = SS.getOrders();
      const id = "SS-" + Math.floor(100000 + Math.random() * 899999);
      orders.unshift({ id: id, customer: shipData.name || "Guest Hunter", email: shipData.email || "", total: +(sub + ship).toFixed(2), status: "Processing", date: new Date().toISOString().slice(0, 10), items: SS.cartCount() });
      SS.saveOrders(orders);
      SS.saveCart([]);
      qs("#order-id").textContent = id;
      showStep(2);
    });
    qs("#back-to-ship").addEventListener("click", function () { showStep(0); });
    showStep(0);
  },

  login() {
    qs("#login-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const email = qs("#l-email").value.trim().toLowerCase();
      const pass = qs("#l-pass").value;
      const user = SS.getUsers().find(function (u) { return u.email === email && u.password === pass; });
      const msg = qs("#form-msg");
      if (user) { SS.setSession({ name: user.name, email: user.email }); msg.className = "form-msg success"; msg.textContent = "Welcome back, " + user.name + "!"; setTimeout(function () { location.href = "index.html"; }, 800); }
      else { msg.className = "form-msg error"; msg.textContent = "Invalid credentials. Try registering first."; }
    });
  },

  register() {
    qs("#reg-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const name = qs("#r-name").value.trim();
      const email = qs("#r-email").value.trim().toLowerCase();
      const pass = qs("#r-pass").value;
      const conf = qs("#r-conf").value;
      const msg = qs("#form-msg");
      if (pass !== conf) { msg.className = "form-msg error"; msg.textContent = "Passwords do not match."; return; }
      const users = SS.getUsers();
      if (users.some(function (u) { return u.email === email; })) { msg.className = "form-msg error"; msg.textContent = "An account with that email already exists."; return; }
      users.push({ name: name, email: email, password: pass });
      SS.saveUsers(users);
      SS.setSession({ name: name, email: email });
      msg.className = "form-msg success"; msg.textContent = "Account forged! Entering the realm...";
      setTimeout(function () { location.href = "index.html"; }, 900);
    });
  },

  forgot() {
    qs("#forgot-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const msg = qs("#form-msg");
      msg.className = "form-msg success";
      msg.textContent = "If that email exists, a reset scroll has been sent. \uD83D\uDD4A";
      qs("#forgot-form").reset();
    });
  }
};

/* ---------- Newsletter (global) ---------- */
document.addEventListener("submit", function (e) {
  if (e.target.classList && e.target.classList.contains("newsletter-form")) {
    e.preventDefault(); toast("Subscribed to the SoulScythe scrolls!"); e.target.reset();
  }
});

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", function () {
  initCursor();
  injectChrome();
  const page = document.body.dataset.page;
  if (page && PAGES[page]) PAGES[page]();
});
