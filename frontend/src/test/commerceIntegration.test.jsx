import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

const products = [{ id: 1, name: "Cat Dinner", description: "Food", price: 100, stock: 3, category: "Food", petType: "cat", ageGroup: "all", image: null, emoji: "🐱", featured: true, createdAt: "2026-01-01" }];

function renderCommerce(path, initialCustomer = null) {
  let customer = initialCustomer;
  const fetchMock = vi.fn().mockImplementation(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json(products);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer });
    if (endpoint.endsWith("/customer/login")) { const body = JSON.parse(options.body); customer = { name: body.name.trim(), email: body.email.trim() }; return Response.json({ customer }); }
    if (endpoint.endsWith("/customer/logout")) { customer = null; return new Response(null, { status: 204 }); }
    throw new Error(`Unexpected M3C API call: ${endpoint}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const rendered = render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return { router, fetchMock, unmount: rendered.unmount };
}

afterEach(() => vi.unstubAllGlobals());

it("preserves duplicate cart entries, clamps stock, and updates product controls and badge", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat");
  localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 2 }, { id: 1, qty: 1 }]));
  renderCommerce("/products");
  const add = await screen.findByRole("button", { name: /เพิ่ม Cat Dinner ลงตะกร้า/ });
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 2 }, { id: 1, qty: 1 }]);
  await user.click(add);
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 3 }, { id: 1, qty: 1 }]);
  expect(add).toBeDisabled();
  expect(screen.getByLabelText("สินค้าในตะกร้า 4 ชิ้น")).toHaveTextContent("4");
  expect(localStorage.getItem("pap-favorites-v1")).toBeNull();
});

it("renders CartPage and applies plus-limit, minus-to-zero, and remove behavior", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat");
  localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 9 }]));
  renderCommerce("/cart", { name: "Buyer", email: "buyer@example.com" });
  expect(await screen.findByText("Cat Dinner")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 3 }]);
  await user.click(screen.getByRole("button", { name: /เพิ่มจำนวน Cat Dinner/ }));
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 3 }]);
  await user.click(screen.getByRole("button", { name: /ลดจำนวน Cat Dinner/ }));
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 2 }]);
  await user.click(screen.getByRole("button", { name: /ลบ Cat Dinner/ }));
  expect(localStorage.getItem("pap-cart")).toBe("[]");
  expect(await screen.findByText("ตะกร้ายังว่างอยู่")).toBeInTheDocument();
});

it("adds to cart from Product Detail with the shared cart state", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat");
  renderCommerce("/products/1");
  const add = await screen.findByRole("button", { name: "เพิ่มลงตะกร้า ＋" });
  await user.click(add);
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
  expect(screen.getByText("ในตะกร้า: 1")).toBeInTheDocument();
});

it("maps pap-after-login checkout.html through login to the guarded checkout placeholder", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 1 }]));
  const { router, fetchMock } = renderCommerce("/cart");
  await user.click(await screen.findByRole("button", { name: "ชำระเงิน" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  expect(sessionStorage.getItem("pap-after-login")).toBe("checkout.html");
  await user.type(screen.getByLabelText("ชื่อเล่น"), " Mali ");
  await user.type(screen.getByLabelText("อีเมล"), "mali@example.com");
  await user.click(screen.getByRole("button", { name: "เข้าสู่ระบบแบบ Demo" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/checkout"));
  expect(sessionStorage.getItem("pap-after-login")).toBeNull();
  expect(await screen.findByRole("button", { name: "ยืนยันคำสั่งซื้อ" })).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/orders"))).toBe(false);
});

it("guards direct checkout for anonymous, empty-cart, and authenticated nonempty-cart states", async () => {
  localStorage.setItem("pap-mode", "cat");
  let view = renderCommerce("/checkout");
  await waitFor(() => expect(view.router.state.location.pathname).toBe("/login"));
  expect(sessionStorage.getItem("pap-after-login")).toBe("checkout.html");
  view.unmount(); view.router.dispose();

  sessionStorage.clear(); localStorage.setItem("pap-cart", "[]");
  view = renderCommerce("/checkout", { name: "Buyer", email: "buyer@example.com" });
  await waitFor(() => expect(view.router.state.location.pathname).toBe("/cart"));
  view.unmount(); view.router.dispose();

  localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 1 }]));
  view = renderCommerce("/checkout", { name: "Buyer", email: "buyer@example.com" });
  expect(await screen.findByRole("button", { name: "ยืนยันคำสั่งซื้อ" })).toBeInTheDocument();
  expect(view.router.state.location.pathname).toBe("/checkout");
});

it("logout preserves cart, favorites, and preferences", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-theme", "dark"); localStorage.setItem("pap-favorites-v1", "[1]"); localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 1 }]));
  const { router } = renderCommerce("/home", { name: "Buyer", email: "buyer@example.com" });
  await user.click(await screen.findByRole("button", { name: /สวัสดี, Buyer/ }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: "ออกจากระบบ" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /สวัสดี, Buyer/ }));
  await user.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
  expect(localStorage.getItem("pap-favorites-v1")).toBe("[1]");
  expect(localStorage.getItem("pap-theme")).toBe("dark");
});
