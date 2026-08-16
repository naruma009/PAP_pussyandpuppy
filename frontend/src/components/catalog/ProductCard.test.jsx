import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";

vi.mock("../../features/catalog/CatalogProvider", () => ({ useCatalog: () => ({ favorites: [], toggleFavorite: vi.fn() }) }));
vi.mock("../../features/preferences/PreferenceProvider", () => ({ usePreferences: () => ({ language: "en", t: (key, params = {}) => ({ forCat: "For Cat", viewProduct: "View", addFavorite: "Add to favorites", inStock: `In Stock: ${params.count}`, "category.Food": "Food" }[key] || key) }) }));
const product = { id: 7, name: "Dinner", description: "Good food", category: "Food", petType: "cat", price: 120, stock: 3, image: "/uploads/products/dinner.png", emoji: "🐾" };

it("keeps upload URLs, retries a changed product image, and has no cart control", () => {
  const { container, rerender } = render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>);
  const image = screen.getByRole("img", { name: "Dinner" });
  expect(image).toHaveAttribute("src", "/uploads/products/dinner.png");
  fireEvent.error(image);
  expect(screen.queryByRole("img", { name: "Dinner" })).not.toBeInTheDocument();
  const next = { ...product, id: 8, name: "Breakfast", image: "/uploads/products/breakfast.png" };
  rerender(<MemoryRouter><ProductCard product={next} /></MemoryRouter>);
  expect(screen.getByRole("img", { name: "Breakfast" })).toHaveAttribute("src", "/uploads/products/breakfast.png");
  expect(container.querySelector(".catalog-cart-action-slot")).toBeInTheDocument();
  expect(localStorage.getItem("pap-cart")).toBeNull();
  expect(screen.queryByRole("button", { name: /cart/i })).not.toBeInTheDocument();
});
