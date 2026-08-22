import { afterEach, expect, it, vi } from "vitest";
import { ApiError, apiRequest, createOrder, createProduct, deleteProduct, getAdminOrders, getCustomerOrders, loginAdmin, logoutAdmin, registerCustomer, updateAdminOrderStatus, updateProduct } from "./api";

afterEach(() => vi.restoreAllMocks());

it("uses same-origin cookies and returns JSON", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }),
  );
  await expect(apiRequest("/example")).resolves.toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith("/api/example", expect.objectContaining({ credentials: "same-origin" }));
});

it("uses the M2 order endpoints without adding client totals", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "PAP-1", total: 50 }), { status: 201 }));
  const payload = { items: [{ productId: 1, quantity: 2 }], shipping: { email: "buyer@example.com" } };
  await expect(createOrder(payload)).resolves.toMatchObject({ id: "PAP-1", total: 50 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/orders");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload);
  const controller = new AbortController();
  fetchMock.mockResolvedValueOnce(new Response("[]", { status: 200 }));
  await getCustomerOrders(controller.signal);
  expect(fetchMock).toHaveBeenLastCalledWith("/api/customer/orders", expect.objectContaining({ credentials: "same-origin", signal: controller.signal }));
});

it("posts real customer registration with same-origin credentials", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ user: { id: 1 } }, { status: 200 }));
  await expect(registerCustomer({ name: "New", email: "new@example.com", password: "password-one" })).resolves.toEqual({ user: { id: 1 } });
  expect(fetchMock).toHaveBeenCalledWith("/api/customer/register", expect.objectContaining({ credentials: "same-origin" }));
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: "New", email: "new@example.com", password: "password-one" });
});

it("does not treat a non-201 order response as success", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "unexpected" }), { status: 200 }));
  await expect(createOrder({ items: [], shipping: {} })).rejects.toMatchObject({ status: 200, message: "Request failed (200)" });
});

it.each([202, 204, 205])("rejects order response status %s while preserving ordinary 204 endpoints", async (status) => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status }));
  await expect(createOrder({ items: [], shipping: {} })).rejects.toMatchObject({ status, message: `Request failed (${status})` });
});

it("preserves the FastAPI error contract and 204 behavior", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Customer login required" }), { status: 401 }),
  );
  await expect(apiRequest("/orders")).rejects.toEqual(
    expect.objectContaining({ name: "ApiError", message: "Customer login required", status: 401 }),
  );
  expect(ApiError).toBeDefined();
  globalThis.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(apiRequest("/logout", { method: "POST" })).resolves.toBeNull();
});

it("uses real admin email/password login and exact auth statuses", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  fetchMock.mockResolvedValueOnce(Response.json({ authenticated: true }, { status: 202 }));
  await expect(loginAdmin({ email: "admin@example.com", password: "secret" })).rejects.toMatchObject({ status: 202 });
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "admin@example.com", password: "secret" });
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
  await expect(logoutAdmin()).rejects.toMatchObject({ status: 200 });
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(logoutAdmin()).resolves.toBeNull();
  expect(fetchMock.mock.calls.every(([, options]) => options.credentials === "same-origin")).toBe(true);
});

it("requires exact admin-orders 200 with same-origin credentials and caller abort signal", async () => {
  const controller = new AbortController();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([{ id: "PAP-1" }], { status: 200 }));
  await expect(getAdminOrders(controller.signal)).resolves.toEqual([{ id: "PAP-1" }]);
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/orders", expect.objectContaining({ credentials: "same-origin", signal: controller.signal }));
});

it.each([201, 202, 204, 205])("rejects wrong admin-orders success status %s without retry", async (status) => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status }));
  await expect(getAdminOrders()).rejects.toMatchObject({ status, message: `Request failed (${status})` });
  expect(fetchMock).toHaveBeenCalledOnce();
});

it("updates an admin order status through the canonical endpoint", async () => {
  const controller = new AbortController();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id: "PAP-1", status: "processing" }, { status: 200 }));
  await expect(updateAdminOrderStatus("PAP-1", "processing", controller.signal)).resolves.toEqual({ id: "PAP-1", status: "processing" });
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/orders/PAP-1/status", expect.objectContaining({ method: "PATCH", credentials: "same-origin", signal: controller.signal }));
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ status: "processing" });
});

it("uses exact product mutation statuses and leaves multipart content type to the browser", async () => {
  const data = new FormData(); data.append("name", "Bed");
  const fetchMock = vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ id: 1 }, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ id: 1 }, { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(createProduct(data)).resolves.toEqual({ id: 1 });
  await expect(updateProduct(1, data)).resolves.toEqual({ id: 1 });
  await expect(deleteProduct(1)).resolves.toBeNull();
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/products", "/api/products/1", "/api/products/1"]);
  fetchMock.mock.calls.forEach(([, options]) => { expect(options.credentials).toBe("same-origin"); expect(options.headers).toBeUndefined(); });
});

it.each([
  ["create", 200], ["create", 202], ["create", 204],
  ["update", 201], ["update", 202], ["update", 204],
  ["delete", 200], ["delete", 202], ["delete", 205],
])("rejects wrong product %s status %s", async (operation, status) => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status }));
  const data = new FormData();
  const request = operation === "create" ? createProduct(data) : operation === "update" ? updateProduct(1, data) : deleteProduct(1);
  await expect(request).rejects.toMatchObject({ status });
});
