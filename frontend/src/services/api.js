const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const { expectedStatus, ...fetchOptions } = options;
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "same-origin",
    ...fetchOptions,
  });
  const unexpectedStatus = expectedStatus !== undefined && response.status !== expectedStatus;
  if (response.status === 204 && !unexpectedStatus) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok || unexpectedStatus) throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  return data;
}

export async function getHealth(signal) {
  return apiRequest("/health", { signal });
}

export async function getProducts(signal) {
  return apiRequest("/products", { signal });
}

export async function getCustomerSession(signal) {
  return apiRequest("/customer/session", { signal });
}

export async function loginCustomer(customer, signal) {
  return apiRequest("/customer/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(customer), signal });
}

export async function registerCustomer(account, signal) {
  return apiRequest("/customer/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(account), signal });
}

export async function logoutCustomer(signal) {
  return apiRequest("/customer/logout", { method: "POST", signal });
}

export async function createOrder(payload) {
  return apiRequest("/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), expectedStatus: 201 });
}

export async function getCustomerOrders(signal) {
  return apiRequest("/customer/orders", { signal });
}

export async function getCustomerOrder(id, signal) {
  return apiRequest(`/customer/orders/${encodeURIComponent(id)}`, { signal, expectedStatus: 200 });
}

export async function createPaymentCheckoutSession(id, signal) {
  return apiRequest(`/customer/orders/${encodeURIComponent(id)}/checkout-session`, { method: "POST", signal, expectedStatus: 200 });
}

export async function getAdminSession(signal) {
  return apiRequest("/admin/session", { signal, expectedStatus: 200 });
}

export async function getAdminOrders(signal) {
  return apiRequest("/admin/orders", { signal, expectedStatus: 200 });
}

export async function getAdminOrder(id, signal) {
  return apiRequest(`/admin/orders/${encodeURIComponent(id)}`, { signal, expectedStatus: 200 });
}

export async function updateAdminOrderStatus(id, status, signal) {
  return apiRequest(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    signal,
    expectedStatus: 200,
  });
}

export async function loginAdmin(credentials, signal) {
  return apiRequest("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials), signal, expectedStatus: 200 });
}

export async function logoutAdmin(signal) {
  return apiRequest("/admin/logout", { method: "POST", signal, expectedStatus: 204 });
}

export async function createProduct(formData, signal) {
  return apiRequest("/products", { method: "POST", body: formData, signal, expectedStatus: 201 });
}

export async function updateProduct(id, formData, signal) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: formData, signal, expectedStatus: 200 });
}

export async function deleteProduct(id, signal) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { method: "DELETE", signal, expectedStatus: 204 });
}
