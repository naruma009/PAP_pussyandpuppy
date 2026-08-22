import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

const products = [{ id: 1, name: "Cat Dinner", description: "Food", price: 100, stock: 5, category: "Food", petType: "cat", ageGroup: "all", image: null, emoji: "🐱", featured: true, createdAt: "2026-01-01" }];
const customer = { name: "Buyer", email: "buyer@example.com" };

function mount(path, fetchMock) {
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return { router, ...view };
}

function baseFetch(orderHandler, refreshHandler = () => Response.json(products)) {
  let productRequests = 0;
  return vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return ++productRequests === 1 ? Response.json(products) : refreshHandler();
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer });
    if (endpoint.endsWith("/orders") && options.method === "POST") return orderHandler(url, options);
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
}

async function completeShipping(user) {
  await user.type(await screen.findByLabelText("Phone Number"), "0800000000");
  await user.type(screen.getByLabelText("Address"), "1 Road");
  await user.type(screen.getByLabelText("District / Area"), "District");
  await user.type(screen.getByLabelText("Province"), "Bangkok");
  await user.type(screen.getByLabelText("Postal Code"), "10000");
}

afterEach(() => vi.unstubAllGlobals());

it("submits duplicate lines without totals, clears only after 201, and keeps confirmation through refresh failure", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat");
  localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 2 }, { id: 1, qty: 1.5 }]));
  const order = { id: "PAP-OK", createdAt: "2026-01-02T00:00:00Z", status: "New", total: 777, customer: { fullName: "Buyer", email: customer.email }, items: [{ productId: 1, name: "Cat Dinner", qty: 3, price: 259, subtotal: 777 }] };
  const fetchMock = baseFetch(() => Response.json(order, { status: 201 }), () => Response.json({ error: "refresh failed" }, { status: 500 }));
  const { router } = mount("/checkout", fetchMock);
  await completeShipping(user);
  await user.click(screen.getByRole("button", { name: "Place Order" }));
  expect(await screen.findByText(/PAP-OK/)).toBeInTheDocument();
  expect(screen.getByText(/฿777/)).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/checkout");
  expect(localStorage.getItem("pap-cart")).toBe("[]");
  expect(screen.getByLabelText("0 items in cart")).toHaveTextContent("0");
  expect(JSON.parse(localStorage.getItem("pap-customer"))).toEqual({ fullName: "Buyer", phone: "0800000000", email: "buyer@example.com", address: "1 Road", district: "District", province: "Bangkok", postalCode: "10000" });
  const posts = fetchMock.mock.calls.filter(([, options = {}]) => options.method === "POST");
  expect(posts).toHaveLength(1);
  const payload = JSON.parse(posts[0][1].body);
  expect(payload.items).toEqual([{ productId: 1, quantity: 2 }, { productId: 1, quantity: 1.5 }]);
  expect(JSON.stringify(payload)).not.toMatch(/price|subtotal|total/);
  await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/products"))).toHaveLength(2));
  expect(screen.getByText(/PAP-OK/)).toBeInTheDocument();
});

it("keeps a valid 201 confirmation when pap-customer persistence fails", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]');
  const order = { id: "PAP-STORAGE", total: 100, items: [], createdAt: "2026-01-02T00:00:00Z", status: "New" };
  const fetchMock = baseFetch(() => Response.json(order, { status: 201 }));
  const originalSetItem = Storage.prototype.setItem;
  const storageMock = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
    if (key === "pap-customer") throw new DOMException("Storage disabled", "QuotaExceededError");
    return originalSetItem.call(this, key, value);
  });
  try {
    mount("/checkout", fetchMock);
    await completeShipping(user);
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    expect(await screen.findByText(/PAP-STORAGE/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(localStorage.getItem("pap-cart")).toBe("[]");
  } finally { storageMock.mockRestore(); }
});

it("keeps the failed checkout form and cart when the follow-up product refresh also fails", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]');
  const fetchMock = baseFetch(
    () => Response.json({ error: "Not enough stock" }, { status: 409 }),
    () => Response.json({ error: "Catalog unavailable" }, { status: 500 }),
  );
  const { router } = mount("/checkout", fetchMock);
  await completeShipping(user);
  await user.click(screen.getByRole("button", { name: "Place Order" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Not enough stock");
  await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/products"))).toHaveLength(2));
  expect(screen.getByLabelText("Address")).toHaveValue("1 Road");
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
  expect(router.state.location.pathname).toBe("/checkout");
});

it("sanitizes the cart and returns to cart when authoritative refresh reports zero stock", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]');
  const fetchMock = baseFetch(
    () => Response.json({ error: "Not enough stock" }, { status: 409 }),
    () => Response.json([{ ...products[0], stock: 0 }]),
  );
  const { router } = mount("/checkout", fetchMock);
  await completeShipping(user);
  await user.click(screen.getByRole("button", { name: "Place Order" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/cart"));
  expect(localStorage.getItem("pap-cart")).toBe("[]");
});

it.each([
  [400, "Cart and complete shipping address are required"],
  [401, "Customer login required"],
  [409, "Not enough stock for Cat Dinner"],
  [0, "Network uncertain"],
])("keeps cart, shipping, and storage on %s failure without retrying POST", async (status, message) => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]');
  const fetchMock = baseFetch(() => status ? Response.json({ error: message }, { status }) : Promise.reject(new TypeError(message)));
  mount("/checkout", fetchMock);
  await completeShipping(user);
  await user.click(screen.getByRole("button", { name: "Place Order" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(screen.getByLabelText("Address")).toHaveValue("1 Road");
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
  expect(localStorage.getItem("pap-customer")).toBeNull();
  expect(fetchMock.mock.calls.filter(([, options = {}]) => options.method === "POST")).toHaveLength(1);
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/products"))).toHaveLength(2);
});

it("aborts a pending customer-orders request when logout navigates away", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat");
  let ordersSignal; let resolveOrders;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json(products);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer });
    if (endpoint.endsWith("/customer/orders")) return new Promise((resolve, reject) => {
      ordersSignal = options.signal; resolveOrders = resolve;
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
    if (endpoint.endsWith("/customer/logout")) return new Response(null, { status: 204 });
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  const { router } = mount("/account/orders", fetchMock);
  await waitFor(() => expect(ordersSignal).toBeInstanceOf(AbortSignal));
  await user.click(screen.getByRole("button", { name: /Hi, Buyer/ }));
  await user.click(screen.getByRole("button", { name: "Logout" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  expect(ordersSignal.aborted).toBe(true);
  resolveOrders?.(Response.json([{ id: "STALE", items: [], total: 1, createdAt: "2026-01-01", status: "New" }]));
  expect(screen.queryByText("STALE")).not.toBeInTheDocument();
});

it("treats an orders 401 as an expired local customer session and redirects to login", async () => {
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]');
  const fetchMock = vi.fn(async (url) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json(products);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer });
    if (endpoint.endsWith("/customer/orders")) return Response.json({ error: "Customer login required" }, { status: 401 });
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  const { router } = mount("/account/orders", fetchMock);
  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  expect(sessionStorage.getItem("pap-after-login")).toBe("/account/orders");
  expect(await screen.findByRole("button", { name: "Login" })).toBeInTheDocument();
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/customer/logout"))).toBe(false);
});

it("renders customer orders and retries a failed GET without showing stale data", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat");
  let orderRequests = 0;
  const fetchMock = vi.fn(async (url) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json(products);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer });
    if (endpoint.endsWith("/customer/orders")) {
      orderRequests += 1;
      return orderRequests === 1 ? Response.json({ error: "Orders offline" }, { status: 500 }) : Response.json([{ id: "PAP-HISTORY", createdAt: "2026-01-02T00:00:00Z", status: "New", total: 125.5, items: [{ productId: 1, name: "Cat Dinner", qty: 1, price: 125.5, subtotal: 125.5 }] }]);
    }
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  mount("/account/orders", fetchMock);
  expect(await screen.findByRole("alert")).toHaveTextContent("Orders offline");
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("PAP-HISTORY")).toBeInTheDocument();
  expect(screen.getByText("Cat Dinner × 1")).toBeInTheDocument();
  expect(screen.getByText("฿125.5")).toBeInTheDocument();
  expect(orderRequests).toBe(2);
});

it("returns to account orders after a successful allowlisted login", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat");
  let activeCustomer = null;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json(products);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: activeCustomer });
    if (endpoint.endsWith("/customer/login")) { activeCustomer = customer; return Response.json({ user: customer }); }
    if (endpoint.endsWith("/customer/orders")) return Response.json([]);
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  const { router } = mount("/account/orders", fetchMock);
  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  await user.type(screen.getByLabelText("Email"), "buyer@example.com");
  await user.type(screen.getByLabelText("Password"), "password-one");
  await user.click(screen.getByRole("button", { name: "Login" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/account/orders"));
  expect(await screen.findByText("You have no orders yet")).toBeInTheDocument();
  expect(sessionStorage.getItem("pap-after-login")).toBeNull();
});

it("guards direct orders and preserves the allowlisted return target", async () => {
  localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-mode", "cat");
  const fetchMock = vi.fn(async (url) => String(url).endsWith("/products") ? Response.json(products) : Response.json({ customer: null }));
  const { router } = mount("/account/orders", fetchMock);
  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  expect(sessionStorage.getItem("pap-after-login")).toBe("/account/orders");
});
