export const CART_KEY = "pap-cart";

export function sanitizeCart(raw, products) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const product = products.find((item) => item.id === entry?.id);
    if (!product) return null;
    const qty = Math.min(Math.max(0, Number(entry.qty)), Number(product.stock));
    return { id: entry.id, qty };
  }).filter((entry) => entry && entry.qty > 0);
}

export function readCart(products, storage = localStorage) {
  let raw = [];
  try { raw = JSON.parse(storage.getItem(CART_KEY)) ?? []; } catch { /* use empty */ }
  return sanitizeCart(raw, products);
}

export function writeCart(cart, storage = localStorage) {
  storage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addCartItem(cart, products, id, amount = 1) {
  const product = products.find((entry) => entry.id === id);
  if (!product || Number(product.stock) <= 0) return { cart, added: false };
  const index = cart.findIndex((entry) => entry.id === id);
  if (index >= 0 && cart[index].qty >= Number(product.stock)) return { cart, added: false };
  const next = cart.map((entry) => ({ ...entry }));
  if (index >= 0) next[index].qty = Math.min(next[index].qty + amount, Number(product.stock));
  else next.push({ id, qty: Math.min(amount, Number(product.stock)) });
  return { cart: next, added: true };
}

export function changeCartQuantity(cart, products, id, change) {
  const index = cart.findIndex((entry) => entry.id === id);
  if (index < 0) return { cart, changed: false, limited: false };
  const product = products.find((entry) => entry.id === id);
  if (change > 0 && cart[index].qty >= Number(product?.stock || 0)) return { cart, changed: false, limited: true };
  const next = cart.map((entry) => ({ ...entry }));
  next[index].qty += change;
  return { cart: next.filter((entry) => entry.qty > 0), changed: true, limited: false };
}

export function removeCartItem(cart, id) {
  const index = cart.findIndex((entry) => entry.id === id);
  return index < 0 ? cart : cart.filter((entry, entryIndex) => entryIndex !== index);
}

export function cartCount(cart) {
  return cart.reduce((sum, entry) => sum + entry.qty, 0);
}

export function cartTotal(cart, products) {
  return cart.reduce((sum, entry) => {
    const product = products.find((item) => item.id === entry.id);
    return sum + (product ? Number(product.price) * entry.qty : 0);
  }, 0);
}
