import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ProductPreview from "./ProductPreview";

vi.mock("../../features/preferences/PreferenceProvider", () => ({
  usePreferences: () => ({ language: "en", t: (key, params) => ({ livePreview: "Live Preview", previewProductName: "Product", previewProductDescription: "Description", "adminPet.cat": "For Cat", outStock: "Out", adminStockCount: `Stock: ${params?.count}` }[key] || key) }),
}));

vi.mock("../../features/catalog/catalog", () => ({ money: (value) => String(value) }));

it("falls back in the admin live preview when the saved image is missing", () => {
  render(<ProductPreview values={{ name: "Bed", description: "Soft", stock: 2, price: 10, category: "Beds", petType: "cat", emoji: "🐾" }} image="/uploads/products/missing.jpg" />);
  fireEvent.error(screen.getByRole("img", { name: "Bed" }));
  expect(screen.queryByRole("img", { name: "Bed" })).not.toBeInTheDocument();
  expect(document.querySelector(".preview-image .admin-emoji")).toBeInTheDocument();
});
