document.addEventListener("DOMContentLoaded", async () => {
  const store = window.PAPStore;
  if (!await store.getAdminSession()) { location.replace("home.html"); return; }
  await store.load();
  await store.migrateLegacyProducts();
  await store.loadAdminOrders();
  const form = document.querySelector("#product-form");
  const table = document.querySelector("#admin-products");
  const preview = document.querySelector("#product-preview");
  const message = document.querySelector("#admin-message");
  let previewImage = "";
  ["Cat Litter","Litter Box","Cat Toilet"].forEach((category) => { const option = document.createElement("option"); option.textContent = category; form.elements.category.append(option); });
  document.querySelector(".admin-shell").insertAdjacentHTML("beforeend", `<section class="table-wrap admin-list"><h2>Customer Orders</h2><div id="admin-orders"></div></section>`);
  document.querySelector(".nav").insertAdjacentHTML("beforeend", `<button class="ghost-button" id="admin-logout" type="button">Logout Admin</button>`);
  document.querySelector("#admin-logout").addEventListener("click", async () => { await store.logoutAdmin(); location.href = "home.html"; });

  const petLabel = (type) => type === "cat" ? "Cat" : type === "dog" ? "Dog" : "Cat & Dog";
  const safe = (value) => { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; };
  const imageMarkup = (product, className = "") => product.image ? `<img class="${className}" src="${product.image}" alt="${safe(product.name)}">` : `<span class="admin-emoji">${product.emoji || "🐾"}</span>`;

  function formProduct() {
    const data = new FormData(form);
    return { id:Number(data.get("id")) || Date.now(), image:previewImage || data.get("currentImage") || "", name:data.get("name").trim() || "Product Name", description:data.get("description").trim() || "Product description will appear here.", price:Number(data.get("price")) || 0, stock:Math.max(0, Number(data.get("stock")) || 0), category:data.get("category"), petType:data.get("petType"), emoji:"🐾", featured:data.get("featured") === "on" };
  }

  function drawPreview() {
    const product = formProduct();
    preview.innerHTML = `<div class="preview-image">${imageMarkup(product)}</div><small>${safe(product.category)} · For ${petLabel(product.petType)}</small><h3>${safe(product.name)}</h3><p>${safe(product.description)}</p><strong>${window.PAP.money(product.price)}</strong><div class="stock ${product.stock === 0 ? "out" : ""}">${product.stock === 0 ? "Out of Stock" : `Stock: ${product.stock} items`}</div>`;
  }

  function resetForm() {
    form.reset(); form.elements.id.value = ""; form.elements.currentImage.value = ""; previewImage = "";
    form.querySelector("button[type=submit]").textContent = "Add Product"; message.textContent = ""; drawPreview();
  }

  function drawList() {
    table.innerHTML = store.getProducts().map((product) => `<tr><td><div class="admin-thumb">${imageMarkup(product)}</div></td><td><strong>${safe(product.name)}</strong><small>${safe(product.description)}</small></td><td>${safe(product.category)}<small>For ${petLabel(product.petType)}</small></td><td>${window.PAP.money(product.price)}</td><td><span class="stock ${product.stock === 0 ? "out" : ""}">${product.stock === 0 ? "Out" : product.stock}</span></td><td><button class="text-button" data-edit="${product.id}">Edit</button><button class="text-button danger" data-delete="${product.id}">Delete</button></td></tr>`).join("");
  }
  function drawOrders() {
    const root = document.querySelector("#admin-orders"); const orders = store.getOrders();
    if (!orders.length) { root.innerHTML = `<p class="empty-state">No customer orders yet.</p>`; return; }
    root.innerHTML = orders.map((order) => `<article class="admin-order"><div><strong>${safe(order.id)}</strong><small>${new Date(order.createdAt).toLocaleString("th-TH")}</small></div><div><strong>${safe(order.customer.fullName)}</strong><small>${safe(order.customer.phone)} · ${safe(order.customer.email)}</small><small>${safe(order.customer.address)}, ${safe(order.customer.district)}, ${safe(order.customer.province)} ${safe(order.customer.postalCode)}</small></div><div>${order.items.map((item) => `${safe(item.name)} × ${item.qty}`).join("<br>")}</div><strong>${window.PAP.money(order.total)}</strong><span class="order-status">${safe(order.status)}</span></article>`).join("");
  }

  form.elements.image.addEventListener("change", () => {
    const file = form.elements.image.files[0]; if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { message.textContent = "Image must be smaller than 1.5 MB."; form.elements.image.value = ""; return; }
    const reader = new FileReader(); reader.onload = () => { previewImage = reader.result; message.textContent = ""; drawPreview(); }; reader.readAsDataURL(file);
  });
  form.addEventListener("input", (event) => { if (event.target.type !== "file") drawPreview(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const id = Number(form.elements.id.value); const submit = form.querySelector("button[type=submit]"); const payload = new FormData(form); submit.disabled = true;
    try { id ? await store.updateProduct(id, payload) : await store.createProduct(payload); drawList(); resetForm(); window.PAP.toast(id ? "Product updated" : "Product added"); }
    catch (error) { message.textContent = error.message; }
    finally { submit.disabled = false; }
  });
  table.addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit]"); const remove = event.target.closest("[data-delete]");
    if (edit) {
      const product = store.getProducts().find((item) => item.id === Number(edit.dataset.edit));
      ["id","name","description","price","stock","category","petType"].forEach((key) => { form.elements[key].value = product[key]; });
      form.elements.currentImage.value = product.image || ""; form.elements.featured.checked = product.featured; previewImage = product.image || "";
      form.querySelector("button[type=submit]").textContent = "Save Changes"; drawPreview(); form.scrollIntoView({ behavior:"smooth" });
    }
    if (remove && confirm("Are you sure you want to delete this product?")) { try { await store.deleteProduct(Number(remove.dataset.delete)); drawList(); } catch (error) { message.textContent = error.message; } }
  });
  document.querySelector("#cancel-edit").addEventListener("click", resetForm);
  drawList(); drawPreview(); drawOrders();
});
