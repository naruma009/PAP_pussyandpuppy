import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
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
  return vi.fn(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/products")) return Response.json([{ id: 1, name: "Bed", description: "Soft", price: 10, stock: 3, category: "Beds", petType: "both", ageGroup: "all", image: null, emoji: "🐾", featured: false }]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    if (endpoint.endsWith("/admin/session")) return Response.json({ authenticated: active });
    if (endpoint.endsWith("/admin/login")) { active = true; return Response.json({ authenticated: true }); }
    if (endpoint.endsWith("/admin/logout")) { active = false; return new Response(null, { status: 204 }); }
    throw new Error(`Unexpected API call: ${endpoint} ${options.method || "GET"}`);
  });
}

afterEach(() => vi.unstubAllGlobals());

it("redirects anonymous direct admin access and preserves the legacy alias query/hash", async () => {
  localStorage.setItem("pap-mode", "cat");
  let router = mount("/admin", fetchForAdmin(false));
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  router.dispose();
  router = mount("/admin.html?from=legacy#top", fetchForAdmin(true));
  await waitFor(() => expect(router.state.location).toMatchObject({ pathname: "/admin", search: "?from=legacy", hash: "#top" }));
  expect(await screen.findByRole("heading", { name: "จัดการสินค้า" })).toBeInTheDocument();
});

it("opens the hidden gate on five timely logo clicks, handles errors and Escape focus", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  localStorage.setItem("pap-mode", "cat");
  const fetchMock = fetchForAdmin(false);
  const router = mount("/home", fetchMock);
  const logo = (await screen.findAllByRole("link", { name: "PPAP" }))[0];
  for (let index = 0; index < 4; index += 1) await user.click(logo);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  vi.advanceTimersByTime(1401);
  await user.click(logo);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  for (let index = 0; index < 4; index += 1) await user.click(logo);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeInTheDocument();
  expect(screen.getByLabelText("รหัสผ่านผู้ดูแล")).toHaveFocus();
  const close = screen.getByRole("button", { name: "ปิดหน้าต่างเข้าสู่ระบบผู้ดูแล" });
  close.focus(); await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(screen.getByRole("button", { name: "ดำเนินการต่อ" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(logo).toHaveFocus();
  expect(router.state.location.pathname).toBe("/home");
  vi.useRealTimers();
});

it("keeps the admin dialog open and reports a login error", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat");
  const fetchMock = fetchForAdmin(false);
  fetchMock.mockImplementation(async (url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.endsWith("/admin/login")) return Response.json({ error: "Invalid code" }, { status: 401 });
    if (endpoint.endsWith("/products")) return Response.json([]);
    if (endpoint.endsWith("/customer/session")) return Response.json({ customer: null });
    throw new Error(`Unexpected API call: ${endpoint} ${options.method || "GET"}`);
  });
  mount("/home", fetchMock);
  const logo = (await screen.findAllByRole("link", { name: "PPAP" }))[0];
  for (let index = 0; index < 5; index += 1) await user.click(logo);
  const input = screen.getByLabelText("รหัสผ่านผู้ดูแล");
  await user.type(input, "wrong");
  await user.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid code");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(input).toHaveFocus();
});

it("logs in to the translated dark admin shell and logs out without clearing browser commerce state", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "dog"); localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-theme", "dark");
  localStorage.setItem("pap-cart", '[{"id":1,"qty":1}]'); localStorage.setItem("pap-favorites-v1", "[1]");
  const fetchMock = fetchForAdmin(false);
  const router = mount("/home", fetchMock);
  const logo = (await screen.findAllByRole("link", { name: "PPAP" }))[0];
  for (let index = 0; index < 5; index += 1) await user.click(logo);
  await user.type(screen.getByLabelText("Access code"), "secret");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/admin"));
  expect(await screen.findByRole("heading", { name: "Manage Products" })).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  await user.click(screen.getByRole("button", { name: "Logout Admin" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  expect(localStorage.getItem("pap-cart")).toBe('[{"id":1,"qty":1}]');
  expect(localStorage.getItem("pap-favorites-v1")).toBe("[1]");
  expect(fetchMock.mock.calls.some(([url]) => /admin\/migrate|admin\/orders|api\/products\/(?:\d+)/.test(String(url)))).toBe(false);
});
