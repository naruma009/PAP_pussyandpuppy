export const FAVORITES_KEY = "pap-favorites-v1";

export function readFavorites(products) {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? []; } catch { /* use empty */ }
  const numeric = Array.isArray(saved) ? saved.map(Number).filter(Number.isFinite) : [];
  const valid = [...new Set(numeric)].filter((id) => products.some((product) => Number(product.id) === id));
  if (valid.length !== numeric.length) localStorage.setItem(FAVORITES_KEY, JSON.stringify(valid));
  return valid;
}

export function writeFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}
