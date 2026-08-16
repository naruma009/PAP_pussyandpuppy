export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
export const CATEGORIES = ["Food", "Treats", "Toys", "Beds", "Grooming", "Clothing", "Accessories", "Health & Care", "Other", "Cat Litter", "Litter Box", "Cat Toilet"];
export const PET_TYPES = ["cat", "dog", "both"];
export const AGE_GROUPS = ["all", "young", "adult", "senior"];

export const EMPTY_PRODUCT_FORM = { name: "", description: "", price: "", stock: "", category: "Food", petType: "cat", ageGroup: "all", featured: false, emoji: "🐾" };

export function productToForm(product) {
  if (!product) return { ...EMPTY_PRODUCT_FORM };
  return Object.fromEntries(Object.keys(EMPTY_PRODUCT_FORM).map((key) => [key, key === "featured" ? Boolean(product[key]) : String(product[key] ?? EMPTY_PRODUCT_FORM[key])]));
}

export function validateProductImage(file) {
  if (!file) return null;
  if (file.size > MAX_IMAGE_BYTES) return "tooLarge";
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  const allowedExtensions = ["png", "jpg", "jpeg", "webp"];
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedExtensions.includes(extension) || (file.type && !allowedTypes.includes(file.type))) return "invalidType";
  return null;
}

export function buildProductFormData(values, image) {
  const data = new FormData();
  ["name", "description", "price", "stock", "category", "petType", "ageGroup"].forEach((field) => data.append(field, String(values[field] ?? "").trim()));
  if (values.featured) data.append("featured", "on");
  if (image) data.append("image", image);
  return data;
}
