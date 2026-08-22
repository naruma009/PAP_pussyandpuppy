import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

const bed = { id: 1, name: "Bed", description: "Soft", price: 10, stock: 3, category: "Beds", petType: "both", ageGroup: "all", image: "/uploads/products/bed.png", emoji: "🐾", featured: false };
const customer = { name: "Buyer", email: "buyer@example.com" };

function mount(fetchMock, { strict = false } = {}) {
  localStorage.setItem("pap-mode", "cat"); localStorage.setItem("pap-language", "en");
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: ["/admin"] });
  const app = <AppProviders><RouterProvider router={router} /></AppProviders>;
  const view = render(strict ? <StrictMode>{app}</StrictMode> : app);
  return { router, ...view };
}

function apiMock({ mutation, refresh } = {}) {
  let products = [bed]; let productGets = 0;
  return vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return Response.json([]);
    if (endpoint.endsWith("/products") && (!options.method || options.method === "GET")) {
      productGets += 1;
      if (productGets > 1 && refresh) return refresh(products);
      return Response.json(products);
    }
    if (endpoint.includes("/products") && options.method) {
      const result = await mutation?.(endpoint, options, products);
      if (result?.products) products = result.products;
      return result?.response || result;
    }
    throw new Error(`Unexpected API call: ${endpoint} ${options.method || "GET"}`);
  });
}

async function fillCreate(user, name = "New Bed") {
  await user.type(await screen.findByLabelText("Product Name"), name);
  await user.type(screen.getByLabelText("Product Description"), "Cloud soft");
  await user.type(screen.getByLabelText("Price (THB)"), "250.5");
  await user.type(screen.getByLabelText("Stock Quantity"), "4");
}

afterEach(() => { vi.unstubAllGlobals(); delete URL.createObjectURL; delete URL.revokeObjectURL; vi.restoreAllMocks(); });

it("creates, edits without a replacement image, and deletes with exact local snapshot updates", async () => {
  const user = userEvent.setup();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  let nextId = 2;
  const fetchMock = apiMock({ mutation: async (endpoint, options, products) => {
    if (options.method === "POST") {
      const created = { ...bed, id: nextId++, name: options.body.get("name"), description: options.body.get("description"), image: null };
      return { products: [...products, created], response: Response.json(created, { status: 201 }) };
    }
    if (options.method === "PUT") {
      expect(options.body.has("image")).toBe(false);
      const updated = { ...products[0], name: options.body.get("name") };
      return { products: products.map((item) => item.id === 1 ? updated : item), response: Response.json(updated) };
    }
    return { products: products.filter((item) => !endpoint.endsWith(`/${item.id}`)), response: new Response(null, { status: 204 }) };
  }});
  mount(fetchMock);
  await fillCreate(user);
  await user.click(screen.getByRole("button", { name: "Add Product" }));
  expect(await screen.findByText("New Bed")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Product added");
  await user.click(screen.getByRole("button", { name: "Edit Bed" }));
  const name = screen.getByLabelText("Product Name"); await user.clear(name); await user.type(name, "Updated Bed");
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(await screen.findByText("Updated Bed")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Delete Updated Bed" }));
  await waitFor(() => expect(screen.queryByText("Updated Bed")).not.toBeInTheDocument());
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls.filter(([, options = {}]) => ["POST", "PUT", "DELETE"].includes(options.method))).toHaveLength(3);
});

it.each([[400, "Missing required product fields"], [413, "Upload is too large"], [202, "Request failed (202)"]])("preserves the create form on %s", async (status, message) => {
  const user = userEvent.setup();
  const fetchMock = apiMock({ mutation: () => Response.json({ error: message }, { status }) });
  mount(fetchMock); await fillCreate(user, "Keep Me");
  await user.click(screen.getByRole("button", { name: "Add Product" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(screen.getByLabelText("Product Name")).toHaveValue("Keep Me");
  expect(screen.queryByText("Product added")).not.toBeInTheDocument();
});

it("reconciles and exits edit state when a stale-product 404 confirms the product disappeared", async () => {
  const user = userEvent.setup();
  const fetchMock = apiMock({ mutation: () => Response.json({ error: "Product not found" }, { status: 404 }), refresh: () => Response.json([]) });
  mount(fetchMock);
  await user.click(await screen.findByRole("button", { name: "Edit Bed" }));
  const name = screen.getByLabelText("Product Name"); await user.clear(name); await user.type(name, "Still Editing");
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Product not found");
  await waitFor(() => expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument());
  await waitFor(() => expect(screen.getByLabelText("Product Name")).toHaveValue(""));
  expect(fetchMock.mock.calls.filter(([url, options = {}]) => String(url).endsWith("/products") && !options.method)).toHaveLength(2);
});

it("keeps exact-success local data when background catalog refresh fails", async () => {
  const user = userEvent.setup();
  const created = { ...bed, id: 2, name: "Local Success", image: null };
  const fetchMock = apiMock({
    mutation: (_endpoint, _options, products) => ({ products: [...products, created], response: Response.json(created, { status: 201 }) }),
    refresh: () => Response.json({ error: "Refresh offline" }, { status: 500 }),
  });
  mount(fetchMock); await fillCreate(user, "Local Success");
  await user.click(screen.getByRole("button", { name: "Add Product" }));
  expect(await screen.findByText("Local Success")).toBeInTheDocument();
  expect(await screen.findByText(/Latest product sync failed/)).toHaveTextContent("Refresh offline");
  expect(screen.getByText("Product added")).toBeInTheDocument();
});

it("expires only admin state on product 401 and preserves customer commerce storage", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]'); localStorage.setItem("pap-favorites-v1", "[1]"); localStorage.setItem("pap-theme", "dark");
  const fetchMock = vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products") && !options.method) return Response.json([bed]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return Response.json([]);
    if (endpoint.endsWith("/products") && options.method === "POST") return Response.json({ error: "Admin authentication required" }, { status: 401 });
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  const { router } = mount(fetchMock); await fillCreate(user);
  await user.click(screen.getByRole("button", { name: "Add Product" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/admin"));
  expect(await screen.findByLabelText("Email")).toBeInTheDocument();
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]'); expect(localStorage.getItem("pap-favorites-v1")).toBe("[1]"); expect(localStorage.getItem("pap-theme")).toBe("dark");
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/admin/logout"))).toBe(false);
});

it("reverts invalid replacement preview and revokes owned object URLs", async () => {
  const user = userEvent.setup();
  URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn();
  mount(apiMock());
  await user.click(await screen.findByRole("button", { name: "Edit Bed" }));
  const input = screen.getByLabelText("Product Image");
  await user.upload(input, new File(["valid"], "new.png", { type: "image/png" }));
  expect(document.querySelector(".preview-image img")).toHaveAttribute("src", "blob:preview");
  fireEvent.change(screen.getByLabelText("Product Image"), { target: { files: [new File(["bad"], "bad.gif", { type: "image/gif" })] } });
  expect(await screen.findByRole("alert")).toHaveTextContent("PNG, JPEG, or WebP");
  expect(document.querySelector(".preview-image img")).toHaveAttribute("src", bed.image);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
});

it("allows only one product mutation at a time across repeated submit and delete events", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  let calls = 0; let resolveMutation;
  const fetchMock = apiMock({ mutation: (_endpoint, options, products) => {
    calls += 1;
    return new Promise((resolve) => { resolveMutation = () => {
      if (options.method === "POST") { const created = { ...bed, id: 2, name: options.body.get("name") }; resolve({ products: [...products, created], response: Response.json(created, { status: 201 }) }); }
      else resolve({ products: [], response: new Response(null, { status: 204 }) });
    }; });
  }});
  mount(fetchMock); await fillCreate(user, "One Request");
  const form = document.querySelector(".admin-form");
  fireEvent.submit(form); fireEvent.submit(form);
  expect(calls).toBe(1);
  resolveMutation();
  expect(await screen.findByText("One Request")).toBeInTheDocument();
  const remove = screen.getByRole("button", { name: "Delete Bed" });
  fireEvent.click(remove); fireEvent.click(remove);
  expect(calls).toBe(2);
  resolveMutation();
  await waitFor(() => expect(screen.queryByRole("button", { name: "Delete Bed" })).not.toBeInTheDocument());
});

it("keeps the newest local mutation snapshot while older catalog reconciliation completes", async () => {
  const user = userEvent.setup();
  const refreshes = [];
  let productGets = 0; let nextId = 2;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return Response.json([]);
    if (endpoint.endsWith("/products") && !options.method) {
      productGets += 1;
      if (productGets === 1) return Response.json([bed]);
      return new Promise((resolve) => refreshes.push(resolve));
    }
    if (endpoint.endsWith("/products") && options.method === "POST") {
      return Response.json({ ...bed, id: nextId++, name: options.body.get("name"), image: null }, { status: 201 });
    }
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  mount(fetchMock);
  await fillCreate(user, "First Local"); await user.click(screen.getByRole("button", { name: "Add Product" }));
  expect(await screen.findByText("First Local")).toBeInTheDocument();
  await fillCreate(user, "Newest Local"); await user.click(screen.getByRole("button", { name: "Add Product" }));
  expect(await screen.findByText("Newest Local")).toBeInTheDocument();
  expect(refreshes).toHaveLength(1);
  refreshes.shift()(Response.json([bed, { ...bed, id: 2, name: "First Local" }]));
  await waitFor(() => expect(refreshes).toHaveLength(1));
  expect(screen.getByText("Newest Local")).toBeInTheDocument();
  refreshes.shift()(Response.json([bed, { ...bed, id: 2, name: "First Local" }, { ...bed, id: 3, name: "Newest Local" }]));
  await waitFor(() => expect(productGets).toBe(3));
  expect(screen.getByText("Newest Local")).toBeInTheDocument();
});

it("aborts and ignores a stale mutation response after unmount without catalog reconciliation", async () => {
  const user = userEvent.setup();
  let resolveMutation; let mutationSignal; let productGets = 0;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return Response.json([]);
    if (endpoint.endsWith("/products") && !options.method) { productGets += 1; return Response.json([bed]); }
    if (endpoint.endsWith("/products") && options.method === "POST") {
      mutationSignal = options.signal;
      return new Promise((resolve) => { resolveMutation = resolve; });
    }
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  const { unmount } = mount(fetchMock); await fillCreate(user, "Late Product");
  await user.click(screen.getByRole("button", { name: "Add Product" }));
  unmount();
  expect(mutationSignal.aborted).toBe(true);
  resolveMutation(Response.json({ ...bed, id: 2, name: "Late Product" }, { status: 201 }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(productGets).toBe(1);
});

it("keeps mounted generation protection active after the StrictMode effect cycle", async () => {
  const user = userEvent.setup();
  const created = { ...bed, id: 2, name: "Strict Product", image: null };
  const fetchMock = apiMock({ mutation: (_endpoint, _options, products) => ({ products: [...products, created], response: Response.json(created, { status: 201 }) }) });
  mount(fetchMock, { strict: true }); await fillCreate(user, "Strict Product");
  await user.click(screen.getByRole("button", { name: "Add Product" }));
  expect(await screen.findByText("Strict Product")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Product added");
});

it("restores an existing custom emoji after an invalid replacement image", async () => {
  const user = userEvent.setup();
  const emojiProduct = { ...bed, image: null, emoji: "🦴" };
  URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn();
  mount(vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: true });
    if (endpoint.endsWith("/admin/orders")) return Response.json([]);
    if (endpoint.endsWith("/products") && !options.method) return Response.json([emojiProduct]);
    throw new Error(`Unexpected API call: ${endpoint}`);
  }));
  await user.click(await screen.findByRole("button", { name: "Edit Bed" }));
  const input = screen.getByLabelText("Product Image");
  await user.upload(input, new File(["valid"], "new.png", { type: "image/png" }));
  fireEvent.change(screen.getByLabelText("Product Image"), { target: { files: [new File(["bad"], "bad.gif", { type: "image/gif" })] } });
  expect(await screen.findByRole("alert")).toHaveTextContent("PNG, JPEG, or WebP");
  expect(document.querySelector(".preview-image .admin-emoji")).toHaveTextContent("🦴");
});
