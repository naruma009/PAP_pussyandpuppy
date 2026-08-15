(function () {
  const state = { products: [], user: null, orders: [] };
  let loadPromise;
  const readLocal = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const writeLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  async function api(path, options = {}) {
    const response = await fetch(path, { credentials:"same-origin", ...options });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
  async function load(force = false) {
    if (loadPromise && !force) return loadPromise;
    loadPromise = Promise.all([api("/api/products"), api("/api/customer/session")]).then(([products, customer]) => { state.products = products; state.user = customer.customer; return state; });
    return loadPromise;
  }
  async function refreshProducts() { state.products = await api("/api/products"); return state.products; }
  function getCart() {
    const cart = readLocal("pap-cart", []).map((entry) => { const product = state.products.find((item) => item.id === entry.id); return product ? { id:entry.id, qty:Math.min(Math.max(0, Number(entry.qty)), product.stock) } : null; }).filter((entry) => entry && entry.qty > 0);
    writeLocal("pap-cart", cart); return cart;
  }
  function saveCart(cart) { writeLocal("pap-cart", cart); window.dispatchEvent(new Event("pap-cart-change")); }

  window.PAPStore = {
    load,
    refreshProducts,
    getProducts: () => state.products,
    getCart,
    saveCart,
    addToCart(id, amount = 1) {
      const cart = getCart(); const product = state.products.find((entry) => entry.id === id);
      if (!product || product.stock <= 0) return false;
      const item = cart.find((entry) => entry.id === id);
      if (item && item.qty >= product.stock) return false;
      item ? item.qty = Math.min(item.qty + amount, product.stock) : cart.push({ id, qty:Math.min(amount, product.stock) });
      saveCart(cart); return true;
    },
    cartCount: () => getCart().reduce((sum, item) => sum + item.qty, 0),
    getMode: () => sessionStorage.getItem("pap-mode") || "both",
    setMode: (mode) => sessionStorage.setItem("pap-mode", mode),
    getUser: () => state.user,
    async loginUser(user) { const result = await api("/api/customer/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(user) }); state.user = result.customer; return state.user; },
    async clearUser() { await api("/api/customer/logout", { method:"POST" }); state.user = null; state.orders = []; },
    getCustomer: () => readLocal("pap-customer", null),
    getOrders: () => state.orders,
    async loadCustomerOrders() { state.orders = await api("/api/customer/orders"); return state.orders; },
    async placeOrder(customer) {
      const cart = getCart(); if (!cart.length) return { ok:false, error:"Your cart is empty." };
      try {
        const order = await api("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ items:cart.map((item) => ({ productId:item.id, quantity:item.qty })), shipping:customer }) });
        writeLocal("pap-customer", customer); saveCart([]); await refreshProducts(); return { ok:true, order };
      } catch (error) { await refreshProducts(); return { ok:false, error:error.message }; }
    },
    async getAdminSession() { return (await api("/api/admin/session")).authenticated; },
    async loginAdmin(code) { return api("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code }) }); },
    async logoutAdmin() { return api("/api/admin/logout", { method:"POST" }); },
    async loadAdminOrders() { state.orders = await api("/api/admin/orders"); return state.orders; },
    async createProduct(formData) { const product = await api("/api/products", { method:"POST", body:formData }); await refreshProducts(); return product; },
    async updateProduct(id, formData) { const product = await api(`/api/products/${id}`, { method:"PUT", body:formData }); await refreshProducts(); return product; },
    async deleteProduct(id) { await api(`/api/products/${id}`, { method:"DELETE" }); await refreshProducts(); },
    async migrateLegacyProducts() {
      if (localStorage.getItem("pap-backend-migrated") === "true") return;
      const products = readLocal("pap-products", null); if (!products?.length) { localStorage.setItem("pap-backend-migrated", "true"); return; }
      try { await api("/api/admin/migrate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ products }) }); localStorage.setItem("pap-backend-migrated", "true"); await refreshProducts(); } catch (error) { if (!error.message.includes("already")) throw error; }
    }
  };
  localStorage.removeItem("pap-horror");
})();
