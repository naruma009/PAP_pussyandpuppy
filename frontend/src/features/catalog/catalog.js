export const BASE_CATEGORIES = ["Food", "Treats", "Toys", "Beds", "Grooming", "Clothing", "Accessories", "Health & Care", "Other"];
export const CAT_CATEGORIES = ["Cat Litter", "Litter Box", "Cat Toilet"];
export const AGES = ["all", "young", "adult", "senior"];
export const SORTS = ["default", "price-asc", "price-desc", "name", "newest"];

export function categoriesForMode(mode) {
  return mode === "dog" ? BASE_CATEGORIES : [...BASE_CATEGORIES, ...CAT_CATEGORIES];
}

export function petTypesForMode(mode) {
  if (mode === "cat") return ["cat", "both"];
  if (mode === "dog") return ["dog", "both"];
  return ["cat", "dog", "both"];
}

export function eligibleProducts(products, mode, featuredOnly = false) {
  return products.filter((product) =>
    (mode === "both" || product.petType === mode || product.petType === "both") &&
    (!featuredOnly || product.featured === true),
  );
}

export function priceBounds(products) {
  if (!products.length) return { min: 0, max: 0 };
  return {
    min: Math.min(...products.map((product) => Number(product.price))),
    max: Math.max(...products.map((product) => Number(product.price))),
  };
}

export function storageKey(mode, featuredOnly) {
  return `pap-product-filters-${mode}${featuredOnly ? "-featured" : ""}`;
}

export function initialFilters(saved, mode, bounds) {
  const categories = categoriesForMode(mode);
  const petTypes = petTypesForMode(mode);
  const numericMin = Number(saved?.min);
  const numericMax = Number(saved?.max);
  const state = {
    category: categories.includes(saved?.category) ? saved.category : "all",
    petType: petTypes.includes(saved?.petType) ? saved.petType : petTypes[0],
    age: AGES.includes(saved?.age) ? saved.age : "all",
    hideOutOfStock: typeof saved?.hideOutOfStock === "boolean" ? saved.hideOutOfStock : saved?.stock === "in",
    sort: SORTS.includes(saved?.sort) ? saved.sort : "default",
    favoritesOnly: Boolean(saved?.favoritesOnly),
    search: String(saved?.search || ""),
    min: Math.max(bounds.min, Number.isFinite(numericMin) ? numericMin : bounds.min),
    max: Math.min(bounds.max, Number.isFinite(numericMax) ? numericMax : bounds.max),
  };
  if (state.min > state.max) return { ...state, min: bounds.min, max: bounds.max };
  return state;
}

export function filterProducts(products, filters, favoriteIds, language) {
  const search = filters.search.trim().toLowerCase();
  let result = products.filter((product) =>
    (filters.category === "all" || product.category === filters.category) &&
    product.petType === filters.petType &&
    (filters.age === "all" || product.ageGroup === filters.age || product.ageGroup === "all") &&
    (!filters.hideOutOfStock || Number(product.stock) > 0) &&
    (!filters.favoritesOnly || favoriteIds.has(Number(product.id))) &&
    (!search || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search)) &&
    Number(product.price) >= filters.min && Number(product.price) <= filters.max,
  );
  const sorters = {
    "price-asc": (a, b) => Number(a.price) - Number(b.price),
    "price-desc": (a, b) => Number(b.price) - Number(a.price),
    name: (a, b) => a.name.localeCompare(b.name, language, { sensitivity: "base" }),
    newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || Number(b.id) - Number(a.id),
  };
  if (sorters[filters.sort]) result = [...result].sort(sorters[filters.sort]);
  return result;
}

export function money(value, language) {
  return `฿${Number(value).toLocaleString(language === "en" ? "en-US" : "th-TH")}`;
}
