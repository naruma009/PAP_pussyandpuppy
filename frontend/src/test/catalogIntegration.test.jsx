import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

const products = [
  { id: 1, name: "Cat Dinner", description: "Cat food", price: 100, stock: 4, category: "Food", petType: "cat", ageGroup: "adult", image: "/uploads/products/cat.png", emoji: "🐱", featured: true, createdAt: "2026-01-01" },
  { id: 2, name: "Dog Dinner", description: "Dog food", price: 200, stock: 0, category: "Food", petType: "dog", ageGroup: "all", image: null, emoji: "🐶", featured: true, createdAt: "2026-02-01" },
  { id: 3, name: "Shared Toy", description: "Play", price: 300, stock: 5, category: "Toys", petType: "both", ageGroup: "all", image: null, emoji: "🐾", featured: false, createdAt: "2026-03-01" },
];

function renderRoute(path) {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => Promise.resolve(new Response(JSON.stringify(String(url).endsWith("/customer/session") ? { customer: null } : products), { status: 200, headers: { "Content-Type": "application/json" } }))));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return router;
}

function renderDeferredRoute(path) {
  let resolveRequest;
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => String(url).endsWith("/customer/session")
    ? Promise.resolve(new Response(JSON.stringify({ customer: null }), { status: 200, headers: { "Content-Type": "application/json" } }))
    : new Promise((resolve) => { resolveRequest = () => resolve(new Response(JSON.stringify(products), { status: 200, headers: { "Content-Type": "application/json" } })); })));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return { router, resolveRequest: () => act(() => resolveRequest()) };
}

afterEach(() => vi.unstubAllGlobals());

it("hydrates featured products and preserves upload URLs", async () => {
  localStorage.setItem("pap-mode", "cat");
  renderRoute("/home");
  expect(await screen.findByText("Cat Dinner")).toBeInTheDocument();
  expect(screen.queryByText("Dog Dinner")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Cat Dinner" })).toHaveAttribute("src", "/uploads/products/cat.png");
  expect(fetch).toHaveBeenCalledWith("/api/products", expect.objectContaining({ credentials: "same-origin" }));
});

it("uses Both-to-Cat default, removes reset query, filters stock, and persists favorites", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "both");
  sessionStorage.setItem("pap-product-filters-both", JSON.stringify({ petType: "dog" }));
  const router = renderRoute("/products?reset=1#product-grid");
  const petSelect = await screen.findByRole("combobox", { name: /ประเภทสัตว์/ });
  expect(petSelect).toHaveValue("cat");
  const allProducts = screen.getByRole("button", { name: "สินค้าทั้งหมด" });
  expect(allProducts).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "อาหาร" }));
  expect(allProducts).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByRole("option", { name: /All relevant pets/i })).not.toBeInTheDocument();
  await waitFor(() => expect(router.state.location.search).toBe(""));
  expect(sessionStorage.getItem("pap-product-filters-both")).toContain('"petType":"cat"');
  await user.click(screen.getByRole("button", { name: /เพิ่มเป็นรายการโปรด: Cat Dinner/ }));
  expect(localStorage.getItem("pap-favorites-v1")).toBe("[1]");
  await user.selectOptions(petSelect, "dog");
  await user.click(screen.getByRole("checkbox", { name: /ซ่อนสินค้าที่หมด/ }));
  expect(screen.queryByText("Dog Dinner")).not.toBeInTheDocument();
});

it("restores independent saved filters after a Pet Mode switch", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat");
  sessionStorage.setItem("pap-product-filters-cat", JSON.stringify({ petType: "both", min: 100, max: 300 }));
  sessionStorage.setItem("pap-product-filters-dog", JSON.stringify({ petType: "dog", min: 200, max: 300 }));
  const router = renderRoute("/products");
  expect(await screen.findByRole("combobox", { name: "ประเภทสัตว์" })).toHaveValue("both");
  await user.click(screen.getByRole("link", { name: "เปลี่ยน Pet Mode" }));
  await user.click(await screen.findByRole("button", { name: /^Dog / }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  await router.navigate("/products");
  expect(await screen.findByRole("combobox", { name: "ประเภทสัตว์" })).toHaveValue("dog");
});

it("hydrates product detail by legacy ID alias", async () => {
  localStorage.setItem("pap-mode", "both");
  const router = renderRoute("/product.html?id=3");
  expect(await screen.findByRole("heading", { name: "Shared Toy" })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/products/3");
  expect(document.title).toBe("Shared Toy — PAP");
  expect(localStorage.getItem("pap-cart")).toBe("[]");
  await router.navigate("/products/999");
  await waitFor(() => expect(document.title).toBe("ไม่พบสินค้านี้ — PAP"));
  await router.navigate("/home");
  await waitFor(() => expect(document.title).toBe("PAP — Pussy and Puppy"));
});

it("does not overwrite a saved price range with pre-hydration zero bounds", async () => {
  localStorage.setItem("pap-mode", "both");
  const saved = { category: "all", petType: "cat", age: "all", hideOutOfStock: false, sort: "default", favoritesOnly: false, search: "", min: 120, max: 180 };
  sessionStorage.setItem("pap-product-filters-both-featured", JSON.stringify(saved));
  const { resolveRequest } = renderDeferredRoute("/products?featured=1");
  expect(JSON.parse(sessionStorage.getItem("pap-product-filters-both-featured"))).toEqual(saved);
  await resolveRequest();
  expect(await screen.findByRole("slider", { name: "ราคาต่ำสุด" })).toHaveValue("120");
  expect(screen.getByRole("slider", { name: "ราคาสูงสุด" })).toHaveValue("180");
  expect(JSON.parse(sessionStorage.getItem("pap-product-filters-both-featured"))).toEqual(saved);
});

it("resets only the featured context before restoring the normal context deterministically", async () => {
  localStorage.setItem("pap-mode", "both");
  sessionStorage.setItem("pap-product-filters-both-featured", JSON.stringify({ petType: "cat", min: 120, max: 180 }));
  const normal = { category: "all", petType: "dog", age: "all", hideOutOfStock: false, sort: "default", favoritesOnly: false, search: "", min: 100, max: 300 };
  sessionStorage.setItem("pap-product-filters-both", JSON.stringify(normal));
  const { router, resolveRequest } = renderDeferredRoute("/products?featured=1&reset=1#product-grid");
  await waitFor(() => expect(router.state.location.search).toBe(""));
  expect(sessionStorage.getItem("pap-product-filters-both-featured")).toBeNull();
  expect(JSON.parse(sessionStorage.getItem("pap-product-filters-both"))).toEqual(normal);
  await resolveRequest();
  expect(await screen.findByRole("combobox", { name: "ประเภทสัตว์" })).toHaveValue("dog");
  expect(JSON.parse(sessionStorage.getItem("pap-product-filters-both"))).toEqual(normal);
});
