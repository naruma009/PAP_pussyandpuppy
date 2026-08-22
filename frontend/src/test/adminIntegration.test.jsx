import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AppProviders from "../app/providers";
import { routes } from "../router";

function mount(path, fetchMock) {
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return router;
}

function fetchForAdmin(authenticated = false) {
  let active = authenticated;
  return vi.fn(async (url) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json([{ id: 1, name: "Demo product", description: "Demo", price: 10, stock: 1, category: "Other", petType: "both", ageGroup: "all", featured: false }]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: active });
    if (endpoint.endsWith("/admin/orders")) return Response.json([]);
    if (endpoint.endsWith("/admin/login")) { active = true; return Response.json({ authenticated: true }); }
    if (endpoint.endsWith("/admin/logout")) { active = false; return new Response(null, { status: 204 }); }
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
}

afterEach(() => vi.unstubAllGlobals());

it("restores an authenticated admin session and preserves the legacy route alias", async () => {
  localStorage.setItem("pap-language", "en");
  let router = mount("/admin", fetchForAdmin(false));
  expect(await screen.findByLabelText("Email")).toBeInTheDocument();
  router.dispose();
  router = mount("/admin.html?from=legacy#top", fetchForAdmin(true));
  await waitFor(() => expect(router.state.location).toMatchObject({ pathname: "/admin", search: "?from=legacy", hash: "#top" }));
  expect(await screen.findByRole("heading", { name: "Manage Products" })).toBeInTheDocument();
});

it("rejects a customer with a generic error and never sends an admin code", async () => {
  const user = userEvent.setup(); localStorage.setItem("pap-language", "en");
  const fetchMock = fetchForAdmin(false);
  fetchMock.mockImplementation(async (url) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: false });
    if (endpoint.endsWith("/admin/login")) return Response.json({ error: "Invalid email or password" }, { status: 401 });
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/products")) return Response.json([]);
    throw new Error(`Unexpected API call: ${endpoint}`);
  });
  mount("/admin", fetchMock);
  await user.type(await screen.findByLabelText("Email"), "customer@example.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Admin Login" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid admin email or password");
  expect(fetchMock.mock.calls.some(([, options]) => JSON.stringify(options.body || "").includes("code"))).toBe(false);
});

it("logs in and logs out without clearing commerce storage", async () => {
  const user = userEvent.setup(); localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]');
  const fetchMock = fetchForAdmin(false); const router = mount("/admin", fetchMock);
  await user.type(await screen.findByLabelText("Email"), "admin@example.com");
  await user.type(screen.getByLabelText("Password"), "secret");
  await user.click(screen.getByRole("button", { name: "Admin Login" }));
  expect(await screen.findByRole("heading", { name: "Manage Products" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Logout Admin" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
});
