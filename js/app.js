(function () {
  const store = window.PAPStore;
  let audioContext;

  function money(value) { return `฿${Number(value).toLocaleString("th-TH")}`; }
  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; }
  function label(petType) { return petType === "cat" ? "For Cat" : petType === "dog" ? "For Dog" : "For Cat & Dog"; }
  function visual(product, large = false) { return product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}"${large ? " class=\"product-image-large\"" : ""}>` : `<span>${escapeHtml(product.emoji || "🐾")}</span>`; }
  function productCard(product) {
    const inCart = store.getCart().find((item) => item.id === product.id)?.qty || 0;
    const maxed = product.stock <= 0 || inCart >= product.stock;
    return `<article class="product-card" data-product-id="${product.id}">
      <a class="product-visual" href="product.html?id=${product.id}" aria-label="ดู ${escapeHtml(product.name)}">${visual(product)}</a>
      <div class="product-info"><small>${escapeHtml(product.category)} · ${label(product.petType)}</small><h3><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3>
      <p>${escapeHtml(product.description)}</p><div class="stock ${product.stock <= 0 ? "out" : ""}">${product.stock <= 0 ? "Out of Stock" : `In Stock: ${product.stock}`}</div><div class="in-cart" data-in-cart>${inCart ? `In Cart: ${inCart}` : "Not in cart"}</div><div class="product-bottom"><strong>${money(product.price)}</strong>
      <button class="icon-button add-cart" data-id="${product.id}" aria-label="เพิ่ม ${escapeHtml(product.name)} ลงตะกร้า" ${maxed ? "disabled" : ""}>＋</button></div><div class="card-feedback" aria-live="polite">${product.stock > 0 && inCart >= product.stock ? "Stock limit reached" : ""}</div></div>
    </article>`;
  }
  function updateCartCount() {
    document.querySelectorAll("[data-cart-count]").forEach((node) => { const count = store.cartCount(); if (node.textContent !== String(count)) { node.textContent = count; node.classList.remove("badge-bounce"); void node.offsetWidth; node.classList.add("badge-bounce"); } });
  }
  function updateProductCartState(id) {
    const cart = store.getCart(); const products = store.getProducts();
    document.querySelectorAll(id ? `[data-product-id="${id}"]` : "[data-product-id]").forEach((card) => {
      const productId = Number(card.dataset.productId); const qty = cart.find((item) => item.id === productId)?.qty || 0; const product = products.find((item) => item.id === productId);
      const label = card.querySelector("[data-in-cart]"); const button = card.querySelector(".add-cart");
      if (label) label.textContent = qty ? `In Cart: ${qty}` : "Not in cart";
      if (button && product) button.disabled = product.stock <= 0 || qty >= product.stock;
      const feedback = card.querySelector(".card-feedback"); if (feedback && product && qty >= product.stock && product.stock > 0) feedback.textContent = "Stock limit reached";
    });
    document.querySelectorAll("[data-detail-id]").forEach((detail) => { const productId = Number(detail.dataset.detailId); const qty = cart.find((item) => item.id === productId)?.qty || 0; const product = products.find((item) => item.id === productId); const button = detail.querySelector(".add-cart"); detail.querySelector("[data-in-cart]").textContent = qty ? `In Cart: ${qty}` : "Not in cart"; button.disabled = !product || product.stock <= 0 || qty >= product.stock; button.textContent = !product || product.stock <= 0 ? "Out of Stock" : qty >= product.stock ? "Stock limit reached" : "เพิ่มลงตะกร้า ＋"; });
  }
  function toast(message) {
    const old = document.querySelector(".toast"); if (old) old.remove();
    const node = document.createElement("div"); node.className = "toast"; node.textContent = message;
    document.body.append(node); setTimeout(() => node.remove(), 1800);
  }
  function applyTheme() {
    ["css/flow.css","css/interactions.css","css/pet-experience.css"].forEach((href) => { if (!document.querySelector(`link[href="${href}"]`)) { const styles = document.createElement("link"); styles.rel = "stylesheet"; styles.href = href; document.head.append(styles); } });
    document.documentElement.dataset.pet = store.getMode();
    document.body.classList.remove("horror");
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => button.remove());
    document.querySelectorAll('a[href="admin.html"]').forEach((link) => { link.hidden = true; });
    document.querySelectorAll(".footer-inner > span").forEach((text) => { if (text.textContent.includes("2026")) text.textContent = "Pussy & Puppy © 2026"; });
    renderPetModeControl(); renderCustomerNavigation(); renderSoundControl();
  }
  async function renderAdminNavigation() {
    const authenticated = await store.getAdminSession();
    document.querySelectorAll('a[href="admin.html"]').forEach((link) => { link.hidden = !authenticated; if (authenticated) link.dataset.adminConfirmed = ""; else delete link.dataset.adminConfirmed; });
  }
  function renderPetModeControl() {
    if (location.pathname.endsWith("/admin.html")) return;
    const actions = document.querySelector(".nav-actions"); if (!actions || document.querySelector(".pet-mode-control")) return;
    const modes = { cat:{ icon:"🐱", label:"Cat Mode" }, dog:{ icon:"🐶", label:"Dog Mode" }, both:{ icon:"🐱🐶", label:"Cat & Dog Mode" } };
    const current = modes[store.getMode()] || modes.both;
    const control = document.createElement("a"); control.href = "index.html"; control.className = "pet-mode-control"; control.setAttribute("aria-label", `Current: ${current.label}. Change Pet Mode`);
    control.innerHTML = `<span class="mode-pets" aria-hidden="true">${current.icon}</span><span class="mode-label">${current.label}</span><span class="change-label">Change</span><span class="mode-paw" aria-hidden="true">🐾</span>`;
    actions.prepend(control);
  }
  function isSoundOn() { return localStorage.getItem("pap-sound") === "on"; }
  function sound(type = "click") {
    if (!isSoundOn()) return;
    const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
    audioContext ||= new AudioEngine(); if (audioContext.state === "suspended") audioContext.resume();
    const notes = type === "success" ? [523,659,784] : type === "cart" ? [420,620] : type === "pet" ? [520,720] : [480];
    notes.forEach((frequency, index) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = "sine"; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, audioContext.currentTime + index * .07); gain.gain.exponentialRampToValueAtTime(.055, audioContext.currentTime + index * .07 + .01); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + index * .07 + .11); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(audioContext.currentTime + index * .07); oscillator.stop(audioContext.currentTime + index * .07 + .12); });
  }
  function renderSoundControl() {
    if (location.pathname.endsWith("/admin.html")) return;
    const actions = document.querySelector(".nav-actions"); if (!actions || actions.querySelector(".sound-toggle")) return;
    const button = document.createElement("button"); button.type = "button"; button.className = "sound-toggle";
    const update = () => { const on = isSoundOn(); button.textContent = on ? "🔊" : "🔇"; button.setAttribute("aria-label", on ? "Sound On — turn off" : "Sound Off — turn on"); button.title = on ? "Sound On" : "Sound Off"; };
    button.addEventListener("click", () => { localStorage.setItem("pap-sound", isSoundOn() ? "off" : "on"); update(); if (isSoundOn()) sound("pet"); }); update(); actions.prepend(button);
  }
  function renderCustomerNavigation() {
    if (location.pathname.endsWith("/admin.html")) return;
    const login = document.querySelector('.nav-actions a[href="login.html"]'); const user = store.getUser(); if (!login || !user) return;
    const account = document.createElement("div"); account.className = "customer-account";
    account.innerHTML = `<button class="customer-trigger" type="button" aria-expanded="false">Hi, ${escapeHtml(user.name)} <span>⌄</span></button><div class="customer-menu"><button type="button" data-account="profile">My Profile</button><button type="button" data-account="orders">My Orders</button><button type="button" data-account="logout">Logout</button></div>`;
    login.replaceWith(account); const trigger = account.querySelector(".customer-trigger");
    trigger.addEventListener("click", () => { const open = account.classList.toggle("open"); trigger.setAttribute("aria-expanded", String(open)); });
    account.addEventListener("click", async (event) => { const action = event.target.closest("[data-account]")?.dataset.account; if (!action) return; if (action === "logout") { await store.clearUser(); location.href = "home.html"; } else { await openAccountPanel(action); account.classList.remove("open"); } });
    document.addEventListener("click", (event) => { if (!account.contains(event.target)) account.classList.remove("open"); });
  }
  async function openAccountPanel(section) {
    const user = store.getUser(); const orders = section === "orders" ? await store.loadCustomerOrders() : []; const panel = document.createElement("div"); panel.className = "account-panel";
    const content = section === "orders" ? (orders.length ? orders.map((order) => `<article><strong>${escapeHtml(order.id)}</strong><span>${new Date(order.createdAt).toLocaleDateString("th-TH")} · ${money(order.total)}</span></article>`).join("") : `<p>ยังไม่มีคำสั่งซื้อ</p>`) : `<p><strong>${escapeHtml(user.name)}</strong></p><p>${escapeHtml(user.email || "No email")}</p>`;
    panel.innerHTML = `<div class="account-panel-box"><button class="gate-close" type="button" aria-label="Close">×</button><span class="eyebrow">${section === "orders" ? "My Orders" : "My Profile"}</span><div class="account-content">${content}</div></div>`; document.body.append(panel); panel.querySelector(".gate-close").addEventListener("click", () => panel.remove());
  }
  function bindHiddenAdmin() {
    if (!location.pathname.endsWith("/home.html")) return;
    const logo = document.querySelector(".site-header .logo"); if (!logo) return;
    let taps = 0, timer;
    logo.addEventListener("click", (event) => {
      event.preventDefault(); taps++; clearTimeout(timer); timer = setTimeout(() => taps = 0, 1400);
      if (taps === 5) { taps = 0; clearTimeout(timer); openAdminGate(); }
    });
  }
  function openAdminGate() {
    const gate = document.createElement("div"); gate.className = "admin-gate";
    gate.innerHTML = `<form class="admin-gate-box"><button type="button" class="gate-close" aria-label="Close">×</button><label for="admin-code">Access code</label><input id="admin-code" type="password" autocomplete="off" required><button class="button" type="submit">Continue</button><p aria-live="polite"></p></form>`;
    document.body.append(gate); const form = gate.querySelector("form"); const input = gate.querySelector("input"); input.focus();
    gate.querySelector(".gate-close").addEventListener("click", () => gate.remove());
    form.addEventListener("submit", async (event) => { event.preventDefault(); try { await store.loginAdmin(input.value); location.href = "admin.html"; } catch (error) { form.querySelector("p").textContent = error.message; input.select(); } });
  }
  function bindShared() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".add-cart");
      if (!button) return;
      const id = Number(button.dataset.id); const card = button.closest(".product-card");
      if (store.addToCart(id)) {
        updateCartCount(); updateProductCartState(id); toast("Added to cart!"); sound("cart");
        if (card) { card.classList.remove("cart-pop"); void card.offsetWidth; card.classList.add("cart-pop"); const feedback = card.querySelector(".card-feedback"); if (feedback) { feedback.textContent = "Added to cart!"; setTimeout(() => { const product = store.getProducts().find((item) => item.id === id); const qty = store.getCart().find((item) => item.id === id)?.qty || 0; feedback.textContent = product && qty >= product.stock ? "Stock limit reached" : ""; }, 1400); } }
      } else { toast("Stock limit reached"); }
    });
    window.addEventListener("pap-cart-change", () => { updateCartCount(); updateProductCartState(); });
    updateCartCount(); bindHiddenAdmin();
  }
  function renderHome() {
    const grid = document.querySelector("#featured-products");
    const mode = store.getMode();
    const featuredLink = document.querySelector(".section-heading .text-link");
    if (!grid) return;
    const featured = store.getProducts().filter((item) => item.featured && (mode === "both" || item.petType === mode || item.petType === "both"));
    let expanded = false;
    const draw = () => { grid.innerHTML = (expanded ? featured : featured.slice(0, 4)).map(productCard).join(""); updateProductCartState(); };
    grid.closest(".section").style.paddingTop = "35px";
    if (featuredLink) {
      featuredLink.href = "#featured-products";
      featuredLink.hidden = featured.length <= 4;
      if (featured.length > 4) featuredLink.dataset.featuredReady = "";
      featuredLink.addEventListener("click", (event) => { event.preventDefault(); expanded = !expanded; featuredLink.textContent = expanded ? "แสดงน้อยลง ↑" : "ดูทั้งหมด →"; draw(); grid.scrollIntoView({ behavior:"smooth", block:"start" }); });
    }
    draw();
  }
  function renderProducts() {
    const grid = document.querySelector("#product-grid"); if (!grid) return;
    const mode = store.getMode();
    const baseCategories = ["Food","Treats","Toys","Beds","Grooming","Clothing","Accessories","Health & Care","Other"];
    const catCategories = ["Cat Litter","Litter Box","Cat Toilet"];
    const categories = mode === "dog" ? baseCategories : [...baseCategories, ...catCategories];
    const filterBar = document.querySelector(".filters");
    const eligibleForMode = (item) => mode === "both" || item.petType === mode || item.petType === "both";
    const featuredOnly = new URLSearchParams(location.search).get("featured") === "1";
    const eligible = store.getProducts().filter((item) => eligibleForMode(item) && (!featuredOnly || item.featured));
    const availableMin = eligible.length ? Math.min(...eligible.map((item) => item.price)) : 0;
    const availableMax = eligible.length ? Math.max(...eligible.map((item) => item.price)) : 0;
    const storageKey = `pap-product-filters-${mode}${featuredOnly ? "-featured" : ""}`; const params = new URLSearchParams(location.search);
    if (params.get("reset") === "1") { sessionStorage.removeItem(storageKey); history.replaceState({}, "", `${location.pathname}${location.hash}`); }
    let saved = {}; try { saved = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch {}
    const state = { category:categories.includes(saved.category) ? saved.category : "all", age:["all","young","adult","senior"].includes(saved.age) ? saved.age : "all", search:String(saved.search || ""), min:Math.max(availableMin, Number(saved.min) || availableMin), max:Math.min(availableMax, Number(saved.max) || availableMax) };
    if (state.min > state.max) { state.min = availableMin; state.max = availableMax; }
    const youngLabel = mode === "cat" ? "Kitten" : mode === "dog" ? "Puppy" : "Puppy / Kitten";
    filterBar.innerHTML = `<div class="category-chips">${[`<button class="filter-button" data-category="all">All Products</button>`, ...categories.map((category) => `<button class="filter-button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)].join("")}</div><div class="filter-tools"><label class="age-filter">Age<select><option value="all">All Ages</option><option value="young">${youngLabel}</option><option value="adult">Adult</option><option value="senior">Senior</option></select></label><label class="age-filter">Search<input data-product-search type="search" value="${escapeHtml(state.search)}" placeholder="Search products"></label><div class="price-filter"><div><span>Price Range</span><strong data-price-output></strong></div><div class="dual-range"><div class="range-track"></div><input data-price-min type="range" min="${availableMin}" max="${availableMax}" value="${state.min}"><input data-price-max type="range" min="${availableMin}" max="${availableMax}" value="${state.max}"></div></div><button class="reset-filters" type="button">Reset Filters</button></div>`;
    const buttons = filterBar.querySelectorAll("[data-category]"); const ageSelect = filterBar.querySelector("select"); const searchInput = filterBar.querySelector("[data-product-search]"); const minInput = filterBar.querySelector("[data-price-min]"); const maxInput = filterBar.querySelector("[data-price-max]"); const priceOutput = filterBar.querySelector("[data-price-output]");
    ageSelect.value = state.age;
    const saveAndDraw = () => {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
      buttons.forEach((button) => button.classList.toggle("active", button.dataset.category === state.category));
      ageSelect.value = state.age; minInput.value = state.min; maxInput.value = state.max; priceOutput.textContent = `${money(state.min)} — ${money(state.max)}`;
      const span = Math.max(1, availableMax - availableMin); const left = ((state.min - availableMin) / span) * 100; const right = 100 - ((state.max - availableMin) / span) * 100; filterBar.style.setProperty("--range-left", `${left}%`); filterBar.style.setProperty("--range-right", `${right}%`);
      const search = state.search.trim().toLowerCase();
      const list = eligible.filter((item) => (state.category === "all" || item.category === state.category) && (state.age === "all" || item.ageGroup === state.age || item.ageGroup === "all") && (!search || `${item.name} ${item.description}`.toLowerCase().includes(search)) && item.price >= state.min && item.price <= state.max);
      grid.innerHTML = list.length ? list.map(productCard).join("") : `<p class="empty-state">ยังไม่มีสินค้าในหมวดนี้</p>`;
      updateProductCartState();
    };
    buttons.forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.category; saveAndDraw(); }));
    ageSelect.addEventListener("change", () => { state.age = ageSelect.value; saveAndDraw(); });
    searchInput.addEventListener("input", () => { state.search = searchInput.value; saveAndDraw(); });
    minInput.addEventListener("input", () => { state.min = Math.min(Number(minInput.value), state.max); saveAndDraw(); });
    maxInput.addEventListener("input", () => { state.max = Math.max(Number(maxInput.value), state.min); saveAndDraw(); });
    filterBar.querySelector(".reset-filters").addEventListener("click", () => { state.category="all"; state.age="all"; state.search=""; searchInput.value=""; state.min=availableMin; state.max=availableMax; saveAndDraw(); });
    saveAndDraw();
  }
  function renderDetail() {
    const root = document.querySelector("#product-detail"); if (!root) return;
    const product = store.getProducts().find((item) => item.id === Number(new URLSearchParams(location.search).get("id")));
    if (!product) { root.innerHTML = `<div class="empty-state"><h2>ไม่พบสินค้านี้</h2><a class="button" href="products.html">กลับไปเลือกสินค้า</a></div>`; return; }
    document.title = `${product.name} — PAP`;
    const inCart = store.getCart().find((item) => item.id === product.id)?.qty || 0;
    root.innerHTML = `<div class="detail-visual">${visual(product, true)}</div><div class="detail-copy" data-detail-id="${product.id}"><small>${escapeHtml(product.category)} · ${label(product.petType)}</small>
      <h1>${escapeHtml(product.name)}</h1><p>${escapeHtml(product.description)}</p><dl class="product-meta"><div><dt>Pet Type</dt><dd>${label(product.petType).replace("For ", "")}</dd></div><div><dt>Stock</dt><dd>${product.stock} items</dd></div></dl><strong class="detail-price">${money(product.price)}</strong>
      <div class="in-cart" data-in-cart>${inCart ? `In Cart: ${inCart}` : "Not in cart"}</div><button class="button add-cart" data-id="${product.id}" ${product.stock <= 0 || inCart >= product.stock ? "disabled" : ""}>${product.stock <= 0 ? "Out of Stock" : inCart >= product.stock ? "Stock limit reached" : "เพิ่มลงตะกร้า ＋"}</button></div>`;
  }
  function renderCart() {
    const root = document.querySelector("#cart-items"); if (!root) return;
    const checkoutButton = document.querySelector(".cart-summary .button");
    checkoutButton.removeAttribute("onclick"); checkoutButton.textContent = "Checkout";
    checkoutButton.addEventListener("click", () => { if (!store.getCart().length) return; if (!store.getUser()) { sessionStorage.setItem("pap-after-login", "checkout.html"); location.href = "login.html"; } else { location.href = "checkout.html"; } });
    const draw = () => {
      const products = store.getProducts(); const cart = store.getCart();
      checkoutButton.disabled = !cart.length;
      if (!cart.length) { root.innerHTML = `<div class="empty-state"><div class="big-emoji">🛒</div><h2>ตะกร้ายังว่างอยู่</h2><a class="button" href="products.html">ไปเลือกของน่ารัก ๆ</a></div>`; document.querySelector("#cart-total").textContent = money(0); return; }
      root.innerHTML = cart.map((entry) => { const item = products.find((p) => p.id === entry.id); if (!item) return ""; return `<article class="cart-row"><span class="cart-emoji">${item.emoji}</span><div><h3>${item.name}</h3><small>${money(item.price)} / ชิ้น</small></div><div class="quantity"><button data-action="minus" data-id="${item.id}">−</button><span>${entry.qty}</span><button data-action="plus" data-id="${item.id}">＋</button></div><strong>${money(item.price * entry.qty)}</strong><button class="remove" data-action="remove" data-id="${item.id}" aria-label="ลบ">×</button></article>`; }).join("");
      const total = cart.reduce((sum, entry) => { const p = products.find((item) => item.id === entry.id); return sum + (p ? p.price * entry.qty : 0); }, 0);
      document.querySelector("#cart-total").textContent = money(total);
    };
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]"); if (!button) return;
      const cart = store.getCart(); const item = cart.find((entry) => entry.id === Number(button.dataset.id)); if (!item) return;
      if (button.dataset.action === "plus") { const product = store.getProducts().find((p) => p.id === item.id); if (item.qty >= (product?.stock || 0)) { toast("Stock limit reached"); return; } item.qty++; }
      if (button.dataset.action === "minus") item.qty--;
      const next = button.dataset.action === "remove" ? cart.filter((entry) => entry !== item) : cart.filter((entry) => entry.qty > 0);
      store.saveCart(next); draw();
    }); draw();
  }
  function bindLogin() {
    const form = document.querySelector("#login-form"); if (!form) return;
    const saved = store.getUser(); if (saved) document.querySelector("#login-status").textContent = `สวัสดี ${saved.name} — คุณกำลังใช้บัญชี Demo`;
    form.addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(form); const name = data.get("name").trim(); try { await store.loginUser({ name, email:data.get("email").trim() }); sound("success"); document.querySelector("#login-status").textContent = `เข้าสู่ระบบแล้ว สวัสดี ${name}!`; const next = sessionStorage.getItem("pap-after-login"); if (next) sessionStorage.removeItem("pap-after-login"); location.href = next || "home.html"; } catch (error) { document.querySelector("#login-status").textContent = error.message; } });
  }
  window.PAP = { money, productCard, toast, sound };
  document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll('a[href="admin.html"]').forEach((link) => { link.hidden = true; });
    if (!location.pathname.endsWith("/admin.html") && !store.hasMode()) { location.replace("index.html"); return; }
    try { await store.load(); applyTheme(); await renderAdminNavigation(); bindShared(); renderHome(); renderProducts(); renderDetail(); renderCart(); bindLogin(); document.documentElement.dataset.uiReady = ""; import("/js/pet-experience.js").then(({ initPetExperience }) => initPetExperience({ mode:store.getMode() })).catch(() => {}); }
    catch (error) { document.body.insertAdjacentHTML("beforeend", `<div class="toast">Backend unavailable: ${escapeHtml(error.message)}</div>`); }
  });
})();
