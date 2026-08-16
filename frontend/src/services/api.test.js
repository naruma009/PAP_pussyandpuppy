import { afterEach, expect, it, vi } from "vitest";
import { ApiError, apiRequest, createOrder, getCustomerOrders, loginAdmin, logoutAdmin } from "./api";

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

it("requires exact admin login 200 and logout 204 statuses", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  fetchMock.mockResolvedValueOnce(Response.json({ authenticated: true }, { status: 202 }));
  await expect(loginAdmin("code")).rejects.toMatchObject({ status: 202 });
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
  await expect(logoutAdmin()).rejects.toMatchObject({ status: 200 });
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(logoutAdmin()).resolves.toBeNull();
  expect(fetchMock.mock.calls.every(([, options]) => options.credentials === "same-origin")).toBe(true);
});
