document.addEventListener("DOMContentLoaded", async () => {
  const store = window.PAPStore;
  await store.load();
  const user = store.getUser();
  if (!user) { sessionStorage.setItem("pap-after-login", "checkout.html"); location.replace("login.html"); return; }
  if (!store.getCart().length) { location.replace("cart.html"); return; }

  const form = document.querySelector("#checkout-form");
  const itemsRoot = document.querySelector("#checkout-items");
  const addressPreview = document.querySelector("#shipping-preview");
  const safe = (value) => { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; };
  const money = window.PAP.money;
  const t = (key, fallback) => window.PAPUI ? window.PAPUI.t(key) : fallback;
  const saved = store.getCustomer() || user;
  const fieldMap = { fullName:saved.fullName || saved.name, email:saved.email, phone:saved.phone, address:saved.address, district:saved.district, province:saved.province, postalCode:saved.postalCode };
  Object.entries(fieldMap).forEach(([name, value]) => { if (value && form.elements[name]) form.elements[name].value = value; });

  function renderSummary() {
    const products = store.getProducts(); const cart = store.getCart();
    itemsRoot.innerHTML = cart.map((entry) => { const product = products.find((item) => item.id === entry.id); return product ? `<div class="checkout-item"><span data-no-i18n>${safe(product.name)} × ${entry.qty}</span><strong>${money(product.price * entry.qty)}</strong></div>` : ""; }).join("");
    const total = cart.reduce((sum, entry) => { const product = products.find((item) => item.id === entry.id); return sum + (product ? product.price * entry.qty : 0); }, 0);
    document.querySelector("#checkout-total").textContent = money(total);
  }
  function customerData() { const data = new FormData(form); return Object.fromEntries([...data.entries()].map(([key, value]) => [key, value.trim()])); }
  function renderAddress() { const customer = customerData(); const hasAddress = customer.address || customer.province; addressPreview.innerHTML = `<strong>${t("shipping", "Shipping Address")}</strong><p>${hasAddress ? `${safe(customer.fullName)}<br>${safe(customer.address)} ${safe(customer.district)}<br>${safe(customer.province)} ${safe(customer.postalCode)}<br>${safe(customer.phone)}` : t("addressHint", "กรอกข้อมูลเพื่อดูที่อยู่จัดส่ง")}</p>`; }
  form.addEventListener("input", renderAddress);
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const submit = form.querySelector("button[type=submit]"); submit.disabled = true; const result = await store.placeOrder(customerData());
    submit.disabled = false;
    if (!result.ok) { document.querySelector("#checkout-error").textContent = result.error; renderSummary(); return; }
    window.PAP.sound("success");
    document.querySelector("#checkout-main").innerHTML = `<section class="order-confirmation"><div class="big-emoji">✓</div><span class="eyebrow">${t("orderConfirmed", "Order confirmed")}</span><h1>${t("thanks", "Thank you!")}</h1><p>${t("orderPlaced", `Order ${safe(result.order.id)} has been placed.`).replace("{id}", safe(result.order.id))}</p><p>${t("total", "Total")} ${money(result.order.total)}</p><a class="button" href="home.html">${t("backHome", "Back to Home")}</a></section>`;
  });
  renderSummary(); renderAddress();
});
