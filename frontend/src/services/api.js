const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "same-origin",
    ...options,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
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

export async function logoutCustomer(signal) {
  return apiRequest("/customer/logout", { method: "POST", signal });
}
