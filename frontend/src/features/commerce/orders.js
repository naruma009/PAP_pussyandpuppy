export const CUSTOMER_KEY = "pap-customer";
export const SHIPPING_FIELDS = ["fullName", "phone", "email", "address", "district", "province", "postalCode"];

export function readCustomer(storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(CUSTOMER_KEY));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; }
}

export function writeCustomer(customer, storage = localStorage) {
  const saved = Object.fromEntries(SHIPPING_FIELDS.map((field) => [field, String(customer[field] ?? "").trim()]));
  storage.setItem(CUSTOMER_KEY, JSON.stringify(saved));
  return saved;
}

export function buildOrderPayload(cart, shipping) {
  return {
    items: cart.map((entry) => ({ productId: entry.id, quantity: entry.qty })),
    shipping: Object.fromEntries(SHIPPING_FIELDS.map((field) => [field, String(shipping[field] ?? "").trim()])),
  };
}
