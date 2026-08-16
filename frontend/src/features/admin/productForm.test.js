import { expect, it } from "vitest";
import { buildProductFormData, MAX_IMAGE_BYTES, productToForm, validateProductImage } from "./productForm";

const values = { name: " Cloud Bed ", description: " Soft ", price: "250.50", stock: "4", category: "Beds", petType: "cat", ageGroup: "adult", featured: true };

it("builds the exact multipart fields and preserves an optional image", () => {
  const file = new File(["image"], "bed.webp", { type: "image/webp" });
  const data = buildProductFormData(values, file);
  expect([...data.keys()]).toEqual(["name", "description", "price", "stock", "category", "petType", "ageGroup", "featured", "image"]);
  expect(Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"))).toEqual({ name: "Cloud Bed", description: "Soft", price: "250.50", stock: "4", category: "Beds", petType: "cat", ageGroup: "adult", featured: "on" });
  expect(data.get("image")).toBe(file);
});

it("omits image and featured when editing without a replacement", () => {
  const data = buildProductFormData({ ...values, featured: false }, null);
  expect(data.has("image")).toBe(false); expect(data.has("featured")).toBe(false);
  expect(productToForm({ ...values, id: 8, image: "/uploads/products/bed.png" })).toMatchObject({ name: " Cloud Bed ", featured: true });
});

it("validates the 1.5 MB boundary, extension, and MIME type", () => {
  expect(validateProductImage(new File([new Uint8Array(MAX_IMAGE_BYTES)], "ok.PNG", { type: "image/png" }))).toBeNull();
  expect(validateProductImage(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" }))).toBe("tooLarge");
  expect(validateProductImage(new File(["gif"], "bad.gif", { type: "image/gif" }))).toBe("invalidType");
  expect(validateProductImage(new File(["bad"], "bad.png", { type: "image/gif" }))).toBe("invalidType");
});
