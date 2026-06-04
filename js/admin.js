/* =========================================================
   SoulScythe — Admin panel
   Password-protected dashboard with product CRUD + orders.
   ========================================================= */
(function () {
  if (document.body.dataset.page !== "admin") return;

  document.addEventListener("DOMContentLoaded", function () {
    const ADMIN = window.SS_DATA.admin;
    const loginView = document.getElementById("admin-login");
    const shell = document.getElementById("admin-shell");

    function authed() { return localStorage.getItem("ss_admin") === "1"; }

    function refresh() {
      if (authed()) { loginView.hidden = true; shell.hidden = false; renderDashboard(); renderProducts(); renderOrders(); }
      else { loginView.hidden = false; shell.hidden = true; }
    }

    /* ----- Login ----- */
    document.getElementById("admin-login-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("a-email").value.trim().toLowerCase();
      const pass = document.getElementById("a-pass").value;
      const msg = document.getElementById("admin-msg");
      if (email === ADMIN.email && pass === ADMIN.password) { localStorage.setItem("ss_admin", "1"); refresh(); }
      else { msg.className = "form-msg error"; msg.textContent = "Access denied. Check your credentials."; }
    });
    document.getElementById("admin-logout").addEventListener("click", function () { localStorage.removeItem("ss_admin"); refresh(); });

    /* ----- Sidebar nav ----- */
    const navBtns = Array.from(document.querySelectorAll(".admin-nav button"));
    const views = Array.from(document.querySelectorAll(".admin-view"));
    navBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        navBtns.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        const target = b.getAttribute("data-view");
        views.forEach(function (v) { v.hidden = v.getAttribute("data-view") !== target; });
      });
    });

    /* ----- Dashboard ----- */
    function renderDashboard() {
      const products = SS.getProducts();
      const orders = SS.getOrders();
      const revenue = orders.reduce(function (s, o) { return s + (o.total || 0); }, 0);
      document.getElementById("stat-orders").textContent = orders.length;
      document.getElementById("stat-revenue").textContent = SS.money(revenue);
      document.getElementById("stat-products").textContent = products.length;
    }

    /* ----- Orders ----- */
    function renderOrders() {
      const orders = SS.getOrders();
      const rows = orders.map(function (o) {
        const cls = (o.status || "Processing").toLowerCase();
        return "<tr><td>" + escapeHtml(o.id) + "</td><td>" + escapeHtml(o.customer) + "</td><td>" +
          escapeHtml(o.email || "") + "</td><td>" + (o.items || 1) + "</td><td>" + SS.money(o.total) +
          '</td><td><span class="badge-pill ' + cls + '">' + escapeHtml(o.status) + "</span></td><td>" + escapeHtml(o.date) + "</td></tr>";
      }).join("");
      document.getElementById("orders-body").innerHTML = rows || '<tr><td colspan="7">No orders yet.</td></tr>';
    }

    /* ----- Products CRUD ----- */
    function renderProducts() {
      const products = SS.getProducts();
      const rows = products.map(function (p) {
        return '<tr><td><img src="' + SS.img(p) + '" alt=""></td><td>' + escapeHtml(p.name) + "</td><td>" +
          escapeHtml(p.category) + "</td><td>" + SS.money(p.price) + "</td><td>" + stars(p.rating) +
          '</td><td><div class="t-actions"><button class="icon-btn" data-edit="' + p.id + '">Edit</button>' +
          '<button class="icon-btn del" data-del="' + p.id + '">Delete</button></div></td></tr>';
      }).join("");
      document.getElementById("products-body").innerHTML = rows || '<tr><td colspan="6">No products.</td></tr>';
    }

    const modal = document.getElementById("product-modal");
    const form = document.getElementById("product-form");
    const catSel = document.getElementById("p-category");
    catSel.innerHTML = window.SS_DATA.categories.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");

    function openModal(product) {
      document.getElementById("modal-title").textContent = product ? "Edit Product" : "Add New Product";
      document.getElementById("p-id").value = product ? product.id : "";
      document.getElementById("p-name").value = product ? product.name : "";
      document.getElementById("p-category").value = product ? product.category : window.SS_DATA.categories[0];
      document.getElementById("p-price").value = product ? product.price : "";
      document.getElementById("p-badge").value = product ? (product.badge || "") : "";
      document.getElementById("p-rating").value = product ? product.rating : 5;
      document.getElementById("p-desc").value = product ? product.description : "";
      modal.hidden = false;
    }
    function closeModal() { modal.hidden = true; }

    document.getElementById("add-product-btn").addEventListener("click", function () { openModal(null); });
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("modal-cancel").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

    document.getElementById("products-body").addEventListener("click", function (e) {
      const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
      if (ed) { openModal(SS.getProduct(ed.getAttribute("data-edit"))); }
      else if (del) {
        if (!confirm("Delete this product?")) return;
        const id = del.getAttribute("data-del");
        SS.saveProducts(SS.getProducts().filter(function (p) { return String(p.id) !== String(id); }));
        renderProducts(); renderDashboard(); toast("Product deleted");
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const products = SS.getProducts();
      const id = document.getElementById("p-id").value;
      const data = {
        name: document.getElementById("p-name").value.trim(),
        category: document.getElementById("p-category").value,
        price: parseFloat(document.getElementById("p-price").value) || 0,
        badge: document.getElementById("p-badge").value.trim(),
        rating: parseInt(document.getElementById("p-rating").value, 10) || 5,
        description: document.getElementById("p-desc").value.trim()
      };
      if (id) {
        const idx = products.findIndex(function (p) { return String(p.id) === String(id); });
        if (idx > -1) products[idx] = Object.assign(products[idx], data);
        toast("Product updated");
      } else {
        const newId = products.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1;
        products.push(Object.assign({ id: newId, colors: ["#e01e2b", "#14141d"], sizes: ["One Size"] }, data));
        toast("Product added");
      }
      SS.saveProducts(products);
      closeModal(); renderProducts(); renderDashboard();
    });

    refresh();
  });
})();
