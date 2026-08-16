(function () {
  const store = window.PAPStore;
  let audioContext;
  const uiText = (key, fallback) => window.PAPUI ? window.PAPUI.t(key) : fallback;

  function money(value) { return `฿${Number(value).toLocaleString(window.PAPUI?.language === "en" ? "en-US" : "th-TH")}`; }
  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; }
  function label(petType) { return petType === "cat" ? uiText("forCat", "For Cat") : petType === "dog" ? uiText("forDog", "For Dog") : uiText("forBoth", "For Cat & Dog"); }
  function petBadge(petType) { const icon = petType === "cat" ? "🐱" : petType === "dog" ? "🐶" : "🐾"; return `<span class="pet-badge pet-badge--${petType}"><span aria-hidden="true">${icon}</span>${label(petType)}</span>`; }
  function categoryLabel(category) {
    if (window.PAPUI?.language === "en") return category;
    return ({ Food:"อาหาร", Treats:"ขนม", Toys:"ของเล่น", Beds:"ที่นอน", Grooming:"ดูแลขน", Clothing:"เสื้อผ้า", Accessories:"อุปกรณ์", "Health & Care":"สุขภาพและการดูแล", Other:"อื่น ๆ", "Cat Litter":"ทรายแมว", "Litter Box":"กระบะทราย", "Cat Toilet":"ห้องน้ำแมว" })[category] || category;
  }
  function visual(product, large = false) { return product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}"${large ? " class=\"product-image-large\"" : ""}>` : `<span>${escapeHtml(product.emoji || "🐾")}</span>`; }
  function favoriteButton(product, detail = false) {
    const active = store.isFavorite(product.id); const label = active ? uiText("removeFavorite", "นำออกจากรายการโปรด") : uiText("addFavorite", "เพิ่มเป็นรายการโปรด");
    return `<button class="favorite-button${detail ? " favorite-button--detail" : ""}" type="button" data-favorite-id="${product.id}" aria-pressed="${active}" aria-label="${label}: ${escapeHtml(product.name)}"><span aria-hidden="true">${active ? "♥" : "♡"}</span></button>`;
  }
  function productCard(product) {
    const inCart = store.getCart().find((item) => item.id === product.id)?.qty || 0;
    const maxed = product.stock <= 0 || inCart >= product.stock;
    return `<article class="product-card" data-product-id="${product.id}">
      <a class="product-visual" data-no-i18n href="product.html?id=${product.id}" aria-label="${window.PAPUI?.language === "en" ? "View" : "ดู"} ${escapeHtml(product.name)}">${visual(product)}</a>
      ${favoriteButton(product)}
      <div class="product-info"><small class="product-kicker"><span>${escapeHtml(categoryLabel(product.category))}</span>${petBadge(product.petType)}</small><h3><a data-no-i18n href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3>
      <p data-no-i18n>${escapeHtml(product.description)}</p><div class="stock ${product.stock <= 0 ? "out" : ""}">${product.stock <= 0 ? uiText("outStock", "Out of Stock") : uiText("inStock", `In Stock: ${product.stock}`).replace("{count}", product.stock)}</div><div class="in-cart" data-in-cart>${inCart ? uiText("inCart", `In Cart: ${inCart}`).replace("{count}", inCart) : uiText("notInCart", "Not in cart")}</div><div class="product-bottom"><strong>${money(product.price)}</strong>
      <button class="icon-button add-cart" data-id="${product.id}" aria-label="${window.PAPUI?.language === "en" ? "Add" : "เพิ่ม"} ${escapeHtml(product.name)} ${window.PAPUI?.language === "en" ? "to cart" : "ลงตะกร้า"}" ${maxed ? "disabled" : ""}>＋</button></div><div class="card-feedback" aria-live="polite">${product.stock > 0 && inCart >= product.stock ? uiText("stockLimit", "Stock limit reached") : ""}</div></div>
    </article>`;
  }
  function updateFavoriteState(id) {
    document.querySelectorAll(id ? `[data-favorite-id="${id}"]` : "[data-favorite-id]").forEach((button) => {
      const product = store.getProducts().find((item) => item.id === Number(button.dataset.favoriteId)); if (!product) { button.remove(); return; }
      const active = store.isFavorite(product.id); button.setAttribute("aria-pressed", String(active)); button.setAttribute("aria-label", `${active ? uiText("removeFavorite", "นำออกจากรายการโปรด") : uiText("addFavorite", "เพิ่มเป็นรายการโปรด")}: ${product.name}`); button.firstElementChild.textContent = active ? "♥" : "♡";
    });
  }
  function updateCartCount() {
    document.querySelectorAll("[data-cart-count]").forEach((node) => { const count = store.cartCount(); if (node.textContent !== String(count)) { node.textContent = count; node.classList.remove("badge-bounce"); void node.offsetWidth; node.classList.add("badge-bounce"); } });
  }
  function updateProductCartState(id) {
    const cart = store.getCart(); const products = store.getProducts();
    document.querySelectorAll(id ? `[data-product-id="${id}"]` : "[data-product-id]").forEach((card) => {
      const productId = Number(card.dataset.productId); const qty = cart.find((item) => item.id === productId)?.qty || 0; const product = products.find((item) => item.id === productId);
      const label = card.querySelector("[data-in-cart]"); const button = card.querySelector(".add-cart");
      if (label) label.textContent = qty ? uiText("inCart", `In Cart: ${qty}`).replace("{count}", qty) : uiText("notInCart", "Not in cart");
      if (button && product) button.disabled = product.stock <= 0 || qty >= product.stock;
      const feedback = card.querySelector(".card-feedback"); if (feedback && product && qty >= product.stock && product.stock > 0) feedback.textContent = "Stock limit reached";
    });
    document.querySelectorAll("[data-detail-id]").forEach((detail) => { const productId = Number(detail.dataset.detailId); const qty = cart.find((item) => item.id === productId)?.qty || 0; const product = products.find((item) => item.id === productId); const button = detail.querySelector(".add-cart"); detail.querySelector("[data-in-cart]").textContent = qty ? uiText("inCart", `In Cart: ${qty}`).replace("{count}", qty) : uiText("notInCart", "Not in cart"); button.disabled = !product || product.stock <= 0 || qty >= product.stock; button.textContent = !product || product.stock <= 0 ? uiText("outStock", "Out of Stock") : qty >= product.stock ? uiText("stockLimit", "Stock limit reached") : uiText("addCart", "เพิ่มลงตะกร้า ＋"); });
  }
  function toast(message) {
    const old = document.querySelector(".toast"); if (old) old.remove();
    const node = document.createElement("div"); node.className = "toast"; node.textContent = message;
    document.body.append(node); setTimeout(() => node.remove(), 1800);
  }
  function applyTheme() {
    ["css/flow.css","css/interactions.css","css/pet-experience.css","css/pet-personality.css"].forEach((href) => { if (!document.querySelector(`link[href="${href}"]`)) { const styles = document.createElement("link"); styles.rel = "stylesheet"; styles.href = href; document.head.append(styles); } });
    document.documentElement.dataset.pet = store.getMode();
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
    const thai = window.PAPUI?.language !== "en";
    const modes = { cat:{ icon:"🐱", label:thai ? "โหมดแมว" : "Cat Mode" }, dog:{ icon:"🐶", label:thai ? "โหมดหมา" : "Dog Mode" }, both:{ icon:"🐱🐶", label:thai ? "โหมดแมวและหมา" : "Cat & Dog Mode" } };
    const current = modes[store.getMode()] || modes.both;
    const control = document.createElement("a"); control.href = "index.html"; control.className = "pet-mode-control"; control.setAttribute("aria-label", thai ? `ขณะนี้: ${current.label} เปลี่ยน Pet Mode` : `Current: ${current.label}. Change Pet Mode`);
    control.innerHTML = `<span class="mode-pets" aria-hidden="true">${current.icon}</span><span class="mode-label">${current.label}</span><span class="change-label">${thai ? "เปลี่ยน" : "Change"}</span><span class="mode-paw" aria-hidden="true">🐾</span>`;
    actions.prepend(control);
  }
  function isSoundOn() { return localStorage.getItem("pap-sound") === "on"; }
  function sound(type = "click") {
    if (window.PAPUI) return window.PAPUI.sound(type, store.getMode());
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
    account.innerHTML = `<button class="customer-trigger" type="button" aria-expanded="false">${window.PAPUI?.language === "en" ? "Hi" : "สวัสดี"}, <span data-no-i18n>${escapeHtml(user.name)}</span> <span>⌄</span></button><div class="customer-menu"><button type="button" data-account="profile">My Profile</button><button type="button" data-account="orders">My Orders</button><button type="button" data-account="logout">Logout</button></div>`;
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
      const favorite = event.target.closest("[data-favorite-id]");
      if (favorite) { const id = Number(favorite.dataset.favoriteId); const active = store.toggleFavorite(id); updateFavoriteState(id); toast(active ? uiText("favoriteSaved", "เก็บไว้ในรายการโปรดแล้ว") : uiText("favoriteRemoved", "นำออกจากรายการโปรดแล้ว")); return; }
      const button = event.target.closest(".add-cart");
      if (!button) return;
      const id = Number(button.dataset.id); const card = button.closest(".product-card");
      if (store.addToCart(id)) {
        updateCartCount(); updateProductCartState(id); toast(uiText("added", "Added to cart!")); sound("cart");
        if (card) { card.classList.remove("cart-pop"); void card.offsetWidth; card.classList.add("cart-pop"); const clearPop = () => card.classList.remove("cart-pop"); card.addEventListener("animationend", clearPop, { once:true }); setTimeout(clearPop, 500); const feedback = card.querySelector(".card-feedback"); if (feedback) { feedback.textContent = uiText("added", "Added to cart!"); setTimeout(() => { const product = store.getProducts().find((item) => item.id === id); const qty = store.getCart().find((item) => item.id === id)?.qty || 0; feedback.textContent = product && qty >= product.stock ? uiText("stockLimit", "Stock limit reached") : ""; }, 1400); } }
      } else { toast(uiText("stockLimit", "Stock limit reached")); }
    });
    window.addEventListener("pap-cart-change", () => { updateCartCount(); updateProductCartState(); });
    window.addEventListener("pap-favorites-change", (event) => updateFavoriteState(event.detail?.id));
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
      featuredLink.addEventListener("click", (event) => { event.preventDefault(); expanded = !expanded; featuredLink.textContent = expanded ? uiText("showLess", "แสดงน้อยลง ↑") : uiText("viewAll", "ดูทั้งหมด →"); draw(); grid.scrollIntoView({ behavior:"smooth", block:"start" }); });
    }
    draw();
  }
  function renderProducts() {
    const grid = document.querySelector("#product-grid"); if (!grid) return;
    const mode = store.getMode();
    const baseCategories = ["Food","Treats","Toys","Beds","Grooming","Clothing","Accessories","Health & Care","Other"];
    const catCategories = ["Cat Litter","Litter Box","Cat Toilet"];
    const categories = mode === "dog" ? baseCategories : [...baseCategories, ...catCategories];
    const petTypes = mode === "cat" ? ["cat","both"] : mode === "dog" ? ["dog","both"] : ["cat","dog","both"];
    const filterBar = document.querySelector(".filters");
    const eligibleForMode = (item) => mode === "both" || item.petType === mode || item.petType === "both";
    const featuredOnly = new URLSearchParams(location.search).get("featured") === "1";
    const eligible = store.getProducts().filter((item) => eligibleForMode(item) && (!featuredOnly || item.featured));
    const availableMin = eligible.length ? Math.min(...eligible.map((item) => item.price)) : 0;
    const availableMax = eligible.length ? Math.max(...eligible.map((item) => item.price)) : 0;
    const storageKey = `pap-product-filters-${mode}${featuredOnly ? "-featured" : ""}`; const params = new URLSearchParams(location.search);
    if (params.get("reset") === "1") { sessionStorage.removeItem(storageKey); history.replaceState({}, "", `${location.pathname}${location.hash}`); }
    let saved = {}; try { saved = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch {}
    const state = {
      category:categories.includes(saved.category) ? saved.category : "all", petType:petTypes.includes(saved.petType) ? saved.petType : "all",
      age:["all","young","adult","senior"].includes(saved.age) ? saved.age : "all", stock:["all","in","out"].includes(saved.stock) ? saved.stock : "all",
      sort:["default","price-asc","price-desc","name","newest"].includes(saved.sort) ? saved.sort : "default", favoritesOnly:Boolean(saved.favoritesOnly),
      search:String(saved.search || ""), min:Math.max(availableMin, Number.isFinite(Number(saved.min)) ? Number(saved.min) : availableMin), max:Math.min(availableMax, Number.isFinite(Number(saved.max)) ? Number(saved.max) : availableMax)
    };
    if (state.min > state.max) { state.min = availableMin; state.max = availableMax; }
    const youngLabel = mode === "cat" ? "Kitten" : mode === "dog" ? "Puppy" : "Puppy / Kitten";
    const petOptions = petTypes.map((type) => `<option value="${type}">${type === "cat" ? uiText("catOnly", "Cat") : type === "dog" ? uiText("dogOnly", "Dog") : uiText("bothOnly", "Both")}</option>`).join("");
    filterBar.innerHTML = `<div class="category-chips">${[`<button class="filter-button" data-category="all">${uiText("allProducts", "All Products")}</button>`, ...categories.map((category) => `<button class="filter-button" data-category="${escapeHtml(category)}">${escapeHtml(categoryLabel(category))}</button>`)].join("")}</div><div class="filter-tools">
      <label class="age-filter discovery-search">${uiText("search", "Search")}<span><input data-product-search type="search" value="${escapeHtml(state.search)}" placeholder="${uiText("searchPlaceholder", "ค้นหาชื่อ รายละเอียด หรือหมวดหมู่")}"><button type="button" data-clear-search aria-label="${uiText("clearSearch", "ล้างคำค้นหา")}">×</button></span></label>
      <label class="age-filter">${uiText("petType", "Pet Type")}<select data-pet-filter><option value="all">${uiText("allRelevantPets", "All relevant pets")}</option>${petOptions}</select></label>
      <label class="age-filter">${uiText("age", "Age")}<select data-age-filter><option value="all">${window.PAPUI?.language === "en" ? "All Ages" : "ทุกช่วงวัย"}</option><option value="young">${window.PAPUI?.language === "en" ? youngLabel : mode === "cat" ? "ลูกแมว" : mode === "dog" ? "ลูกสุนัข" : "ลูกสุนัข / ลูกแมว"}</option><option value="adult">${uiText("adult", "Adult")}</option><option value="senior">${uiText("senior", "Senior")}</option></select></label>
      <label class="age-filter">${uiText("stock", "Stock")}<select data-stock-filter><option value="all">${uiText("allStock", "All stock")}</option><option value="in">${uiText("inStockOnly", "In stock")}</option><option value="out">${uiText("outStock", "Out of Stock")}</option></select></label>
      <label class="age-filter">${uiText("sort", "Sort")}<select data-sort><option value="default">${uiText("recommended", "Recommended")}</option><option value="price-asc">${uiText("priceLowHigh", "Price: Low to High")}</option><option value="price-desc">${uiText("priceHighLow", "Price: High to Low")}</option><option value="name">${uiText("nameAZ", "Name: A to Z")}</option><option value="newest">${uiText("newest", "Newest")}</option></select></label>
      <div class="price-filter"><div><span>${uiText("priceRange", "Price Range")}</span><strong data-price-output></strong></div><div class="dual-range"><div class="range-track"></div><input data-price-min type="range" min="${availableMin}" max="${availableMax}" value="${state.min}"><input data-price-max type="range" min="${availableMin}" max="${availableMax}" value="${state.max}"></div></div>
      <div class="favorite-filter-wrap"><button class="favorite-filter" type="button" data-favorites-only aria-pressed="${state.favoritesOnly}">♥ ${uiText("favoritesOnly", "Favorites only")}</button><small>${uiText("favoritesDeviceOnly", "บันทึกเฉพาะในอุปกรณ์นี้ ไม่ซิงก์กับบัญชี")}</small></div>
      <button class="reset-filters" type="button">${uiText("resetFilters", "ล้างตัวกรอง")}</button>
    </div><p class="discovery-status" aria-live="polite"></p>`;
    const buttons = filterBar.querySelectorAll("[data-category]"); const ageSelect = filterBar.querySelector("[data-age-filter]"); const petSelect = filterBar.querySelector("[data-pet-filter]"); const stockSelect = filterBar.querySelector("[data-stock-filter]"); const sortSelect = filterBar.querySelector("[data-sort]"); const searchInput = filterBar.querySelector("[data-product-search]"); const clearSearch = filterBar.querySelector("[data-clear-search]"); const favoriteFilter = filterBar.querySelector("[data-favorites-only]"); const minInput = filterBar.querySelector("[data-price-min]"); const maxInput = filterBar.querySelector("[data-price-max]"); const priceOutput = filterBar.querySelector("[data-price-output]"); const status = filterBar.querySelector(".discovery-status");
    ageSelect.value = state.age; petSelect.value = state.petType; stockSelect.value = state.stock; sortSelect.value = state.sort;
    const saveAndDraw = () => {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
      buttons.forEach((button) => button.classList.toggle("active", button.dataset.category === state.category));
      ageSelect.value = state.age; petSelect.value = state.petType; stockSelect.value = state.stock; sortSelect.value = state.sort; minInput.value = state.min; maxInput.value = state.max; priceOutput.textContent = `${money(state.min)} — ${money(state.max)}`; clearSearch.hidden = !state.search; favoriteFilter.setAttribute("aria-pressed", String(state.favoritesOnly));
      const span = Math.max(1, availableMax - availableMin); const left = ((state.min - availableMin) / span) * 100; const right = 100 - ((state.max - availableMin) / span) * 100; filterBar.style.setProperty("--range-left", `${left}%`); filterBar.style.setProperty("--range-right", `${right}%`);
      const search = state.search.trim().toLowerCase();
      const favorites = new Set(store.getFavorites());
      let list = eligible.filter((item) => (state.category === "all" || item.category === state.category) && (state.petType === "all" || item.petType === state.petType) && (state.age === "all" || item.ageGroup === state.age || item.ageGroup === "all") && (state.stock === "all" || (state.stock === "in" ? item.stock > 0 : item.stock <= 0)) && (!state.favoritesOnly || favorites.has(item.id)) && (!search || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search)) && item.price >= state.min && item.price <= state.max);
      const sorters = { "price-asc":(a,b)=>a.price-b.price, "price-desc":(a,b)=>b.price-a.price, name:(a,b)=>a.name.localeCompare(b.name, window.PAPUI?.language || "th", { sensitivity:"base" }), newest:(a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||b.id-a.id };
      if (sorters[state.sort]) list = [...list].sort(sorters[state.sort]);
      const emptyMessage = state.favoritesOnly ? uiText("noFavorites", "ยังไม่มีของโปรดในอุปกรณ์นี้") : search ? uiText("noSearchResults", "ดมหาแล้ว แต่ยังไม่เจอสินค้าที่ตรงกัน") : uiText("noCategoryProducts", "ยังไม่มีสินค้าในหมวดนี้");
      grid.innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty-state discovery-empty"><div class="big-emoji">🐾</div><h2>${emptyMessage}</h2><p>${uiText("tryFilters", "ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะ")}</p></div>`;
      status.textContent = search ? uiText("searchCount", "กำลังดมหาของให้น้อง... เจอ {count} ชิ้น").replace("{count}", list.length) : uiText("productCount", "พบสินค้า {count} ชิ้น").replace("{count}", list.length);
      updateProductCartState(); updateFavoriteState();
    };
    buttons.forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.category; saveAndDraw(); }));
    ageSelect.addEventListener("change", () => { state.age = ageSelect.value; saveAndDraw(); });
    petSelect.addEventListener("change", () => { state.petType = petSelect.value; saveAndDraw(); });
    stockSelect.addEventListener("change", () => { state.stock = stockSelect.value; saveAndDraw(); });
    sortSelect.addEventListener("change", () => { state.sort = sortSelect.value; saveAndDraw(); });
    searchInput.addEventListener("input", () => { state.search = searchInput.value; saveAndDraw(); });
    clearSearch.addEventListener("click", () => { state.search = ""; searchInput.value = ""; searchInput.focus(); saveAndDraw(); });
    favoriteFilter.addEventListener("click", () => { state.favoritesOnly = !state.favoritesOnly; saveAndDraw(); });
    minInput.addEventListener("input", () => { state.min = Math.min(Number(minInput.value), state.max); saveAndDraw(); });
    maxInput.addEventListener("input", () => { state.max = Math.max(Number(maxInput.value), state.min); saveAndDraw(); });
    filterBar.querySelector(".reset-filters").addEventListener("click", () => { Object.assign(state,{ category:"all",petType:"all",age:"all",stock:"all",sort:"default",favoritesOnly:false,search:"",min:availableMin,max:availableMax }); searchInput.value=""; saveAndDraw(); });
    window.addEventListener("pap-favorites-change", saveAndDraw);
    saveAndDraw();
  }
  function renderDetail() {
    const root = document.querySelector("#product-detail"); if (!root) return;
    const product = store.getProducts().find((item) => item.id === Number(new URLSearchParams(location.search).get("id")));
    if (!product) { root.innerHTML = `<div class="empty-state"><h2>${uiText("productMissing", "ไม่พบสินค้านี้")}</h2><a class="button" href="products.html">${uiText("backToProducts", "กลับไปเลือกสินค้า")}</a></div>`; return; }
    document.title = `${product.name} — PAP`;
    const inCart = store.getCart().find((item) => item.id === product.id)?.qty || 0;
    root.innerHTML = `<div class="detail-visual">${visual(product, true)}</div><div class="detail-copy" data-detail-id="${product.id}">${favoriteButton(product, true)}<small><span data-no-i18n>${escapeHtml(product.category)}</span> · ${label(product.petType)}</small>
      <h1 data-no-i18n>${escapeHtml(product.name)}</h1><p data-no-i18n>${escapeHtml(product.description)}</p><dl class="product-meta"><div><dt>${uiText("petType", "Pet Type")}</dt><dd>${label(product.petType)}</dd></div><div><dt>${uiText("stock", "Stock")}</dt><dd>${uiText("items", `${product.stock} items`).replace("{count}", product.stock)}</dd></div></dl><strong class="detail-price">${money(product.price)}</strong>
      <div class="in-cart" data-in-cart>${inCart ? uiText("inCart", `In Cart: ${inCart}`).replace("{count}", inCart) : uiText("notInCart", "Not in cart")}</div><button class="button add-cart" data-id="${product.id}" ${product.stock <= 0 || inCart >= product.stock ? "disabled" : ""}>${product.stock <= 0 ? uiText("outStock", "Out of Stock") : inCart >= product.stock ? uiText("stockLimit", "Stock limit reached") : uiText("addCart", "เพิ่มลงตะกร้า ＋")}</button></div>`;
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
      root.innerHTML = cart.map((entry) => { const item = products.find((p) => p.id === entry.id); if (!item) return ""; return `<article class="cart-row"><span class="cart-emoji">${item.emoji}</span><div data-no-i18n><h3>${escapeHtml(item.name)}</h3><small>${money(item.price)} <span data-i18n-ui>${uiText("perItem", "/ ชิ้น")}</span></small></div><div class="quantity"><button data-action="minus" data-id="${item.id}">−</button><span>${entry.qty}</span><button data-action="plus" data-id="${item.id}">＋</button></div><strong>${money(item.price * entry.qty)}</strong><button class="remove" data-action="remove" data-id="${item.id}" aria-label="${uiText("remove", "ลบ")}">×</button></article>`; }).join("");
      const total = cart.reduce((sum, entry) => { const p = products.find((item) => item.id === entry.id); return sum + (p ? p.price * entry.qty : 0); }, 0);
      document.querySelector("#cart-total").textContent = money(total);
    };
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]"); if (!button) return;
      const cart = store.getCart(); const item = cart.find((entry) => entry.id === Number(button.dataset.id)); if (!item) return;
      if (button.dataset.action === "plus") { const product = store.getProducts().find((p) => p.id === item.id); if (item.qty >= (product?.stock || 0)) { toast(uiText("stockLimit", "Stock limit reached")); return; } item.qty++; }
      if (button.dataset.action === "minus") item.qty--;
      const next = button.dataset.action === "remove" ? cart.filter((entry) => entry !== item) : cart.filter((entry) => entry.qty > 0);
      store.saveCart(next); draw();
    }); draw();
  }
  function bindLogin() {
    const form = document.querySelector("#login-form"); if (!form) return;
    const saved = store.getUser(); if (saved) document.querySelector("#login-status").textContent = uiText("helloDemo", `สวัสดี ${saved.name} — คุณกำลังใช้บัญชี Demo`).replace("{name}", saved.name);
    form.addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(form); const name = data.get("name").trim(); try { await store.loginUser({ name, email:data.get("email").trim() }); sound("success"); document.querySelector("#login-status").textContent = uiText("loggedIn", `เข้าสู่ระบบแล้ว สวัสดี ${name}!`).replace("{name}", name); const next = sessionStorage.getItem("pap-after-login"); if (next) sessionStorage.removeItem("pap-after-login"); location.href = next || "home.html"; } catch (error) { document.querySelector("#login-status").textContent = error.message; } });
  }
  window.PAP = { money, productCard, toast, sound };
  document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll('a[href="admin.html"]').forEach((link) => { link.hidden = true; });
    if (!location.pathname.endsWith("/admin.html") && !store.hasMode()) { location.replace("index.html"); return; }
    try { await store.load(); applyTheme(); await renderAdminNavigation(); bindShared(); renderHome(); renderProducts(); renderDetail(); renderCart(); bindLogin(); document.documentElement.dataset.uiReady = ""; import("/js/pet-experience.js").then(({ initPetExperience }) => initPetExperience({ mode:store.getMode(), products:store.getProducts(), sound })).catch(() => {}); }
    catch (error) { document.body.insertAdjacentHTML("beforeend", `<div class="toast">Backend unavailable: ${escapeHtml(error.message)}</div>`); }
  });
})();
