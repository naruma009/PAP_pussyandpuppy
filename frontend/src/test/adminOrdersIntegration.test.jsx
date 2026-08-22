import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

const product = { id: 1, name: "Bed", description: "Soft", price: 10, stock: 3, category: "Beds", petType: "both", ageGroup: "all", image: null, emoji: "🐾", featured: false };
const customer = { name: "Buyer", email: "buyer@example.com" };
const newest = { id: "PAP-NEW", createdAt: "2026-08-17T10:30:00Z", status: "pending", total: 999, customer: { fullName: "Newest Buyer", phone: "0811111111", email: "new@example.com", address: "1 Road", district: "Area", province: "Bangkok", postalCode: "10000" }, items: [{ productId: 1, name: "Bed", qty: 2, price: 10, subtotal: 20 }] };
const older = { ...newest, id: "PAP-OLD", createdAt: "2026-08-16T10:30:00Z", customer: { ...newest.customer, fullName: "Older Buyer" } };

function mount(fetchMock) {
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: ["/admin"] });
  const view = render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return { router, ...view };
}

function adminFetch(ordersHandler, activeCustomer = null) {
  return vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json([product]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: activeCustomer });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return ordersHandler(options);
    if (endpoint.endsWith("/admin/logout")) return new Response(null, { status: 204 });
    throw new Error(`Unexpected API call: ${endpoint} ${options.method || "GET"}`);
  });
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("renders server order sequence, semantic details, authoritative total, English and dark mode", async () => {
  localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-theme", "dark");
  mount(adminFetch(() => Response.json([newest, older])));
  const heading = await screen.findByRole("heading", { name: "Customer Orders" });
  expect(heading).toBeInTheDocument();
  const articles = screen.getAllByRole("article");
  expect(articles).toHaveLength(2); expect(articles[0]).toHaveTextContent("PAP-NEW"); expect(articles[1]).toHaveTextContent("PAP-OLD");
  expect(articles[0]).toHaveTextContent("Newest Buyer"); expect(articles[0]).toHaveTextContent("0811111111"); expect(articles[0]).toHaveTextContent("new@example.com");
  expect(articles[0]).toHaveTextContent("1 Road, Area, Bangkok, 10000"); expect(articles[0]).toHaveTextContent("Bed × 2"); expect(articles[0]).toHaveTextContent("฿999"); expect(articles[0]).toHaveTextContent("Pending");
  expect(articles[0]).toHaveTextContent("Unit price: ฿10"); expect(articles[0]).toHaveTextContent("Subtotal: ฿20");
  expect(articles[0].querySelector("time")).toHaveAttribute("datetime", newest.createdAt); expect(articles[0].querySelector("address")).toBeInTheDocument(); expect(articles[0].querySelector("ul")).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
});

it("renders Thai empty state and explicit loading state", async () => {
  localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "th");
  let resolveOrders;
  const fetchMock = adminFetch(() => new Promise((resolve) => { resolveOrders = resolve; }));
  mount(fetchMock);
  expect(await screen.findByRole("heading", { name: "กำลังโหลดคำสั่งซื้อของลูกค้า" })).toBeInTheDocument();
  await waitFor(() => expect(resolveOrders).toEqual(expect.any(Function)));
  resolveOrders(Response.json([]));
  expect(await screen.findByText("ยังไม่มีคำสั่งซื้อจากลูกค้า")).toBeInTheDocument();
});

it("shows an error and retries manually", async () => {
  const user = userEvent.setup(); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "en");
  let calls = 0;
  mount(adminFetch(() => ++calls === 1 ? Response.json({ error: "Orders offline" }, { status: 500 }) : Response.json([newest])));
  expect(await screen.findByRole("alert")).toHaveTextContent("Orders offline");
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("PAP-NEW")).toBeInTheDocument(); expect(calls).toBe(2);
});

it("aborts a pending retry and ignores its stale response", async () => {
  const user = userEvent.setup(); localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "en");
  const requests = [];
  mount(adminFetch((options) => new Promise((resolve) => requests.push({ resolve, signal: options.signal }))));
  await waitFor(() => expect(requests).toHaveLength(1));
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[0].signal.aborted).toBe(true);
  requests[0].resolve(Response.json([{ ...older, id: "STALE" }]));
  requests[1].resolve(Response.json([newest]));
  expect(await screen.findByText("PAP-NEW")).toBeInTheDocument(); expect(screen.queryByText("STALE")).not.toBeInTheDocument();
});

it("aborts a pending orders request on navigation and ignores a late response", async () => {
  let resolveOrders; let signal; localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "en");
  const { router } = mount(adminFetch((options) => { signal = options.signal; return new Promise((resolve) => { resolveOrders = resolve; }); }));
  await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));
  await router.navigate("/home"); await waitFor(() => expect(signal.aborted).toBe(true));
  resolveOrders(Response.json([{ ...newest, id: "LATE" }]));
  await new Promise((resolve) => setTimeout(resolve, 0)); expect(screen.queryByText("LATE")).not.toBeInTheDocument();
});

it("aborts orders as soon as logout starts", async () => {
  const user = userEvent.setup(); let ordersSignal; let resolveLogout; localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "en");
  const fetchMock = adminFetch((options) => { ordersSignal = options.signal; return new Promise(() => {}); });
  fetchMock.mockImplementation(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json([product]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) { ordersSignal = options.signal; return new Promise(() => {}); }
    if (endpoint.endsWith("/admin/logout")) return new Promise((resolve) => { resolveLogout = resolve; });
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  const { router } = mount(fetchMock); await waitFor(() => expect(ordersSignal).toBeInstanceOf(AbortSignal));
  await user.click(screen.getByRole("button", { name: "Logout Admin" }));
  expect(ordersSignal.aborted).toBe(true); expect(router.state.location.pathname).toBe("/admin");
  resolveLogout(new Response(null, { status: 204 })); await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
});

it("expires only Admin on orders 401 and preserves customer commerce state", async () => {
  localStorage.setItem("pap-mode", "dog"); localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-theme", "dark"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]'); localStorage.setItem("pap-favorites-v1", "[1]");
  const fetchMock = adminFetch(() => Response.json({ error: "Admin authentication required" }, { status: 401 }), customer);
  const { router } = mount(fetchMock); await waitFor(() => expect(router.state.location.pathname).toBe("/admin"));
  expect(await screen.findByLabelText("Email")).toBeInTheDocument();
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]'); expect(localStorage.getItem("pap-favorites-v1")).toBe("[1]"); expect(localStorage.getItem("pap-theme")).toBe("dark"); expect(localStorage.getItem("pap-mode")).toBe("dog");
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/admin/logout"))).toBe(false);
});
it("updates valid status from the server and keeps rejected status unchanged", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-language", "en");
  let order = { ...newest, status: "pending" };
  const fetchMock = vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json([product]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return Response.json([order]);
    if (endpoint.endsWith("/status")) {
      const requested = JSON.parse(options.body).status;
      if (requested === "shipped") return Response.json({ error: "Invalid order status transition" }, { status: 409 });
      order = { ...order, status: requested };
      return Response.json(order);
    }
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  mount(fetchMock);
  const select = await screen.findByRole("combobox", { name: "Change status PAP-NEW" });
  await user.selectOptions(select, "processing");
  expect(await screen.findByText("Processing")).toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Change status PAP-NEW" }), "shipped");
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid order status transition");
  expect(screen.getByText("Processing")).toBeInTheDocument();
});

it("hides status mutation controls for terminal orders", async () => {
  localStorage.setItem("pap-language", "en");
  const terminal = { ...newest, status: "completed" };
  const fetchMock = adminFetch(() => Response.json([terminal]));
  mount(fetchMock);
  expect(await screen.findByText("Completed")).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /Change status/ })).not.toBeInTheDocument();
  expect(screen.getByText("Final status")).toBeInTheDocument();
});
