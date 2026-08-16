import { afterEach, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api";

afterEach(() => vi.restoreAllMocks());

it("uses same-origin cookies and returns JSON", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }),
  );
  await expect(apiRequest("/example")).resolves.toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith("/api/example", expect.objectContaining({ credentials: "same-origin" }));
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
