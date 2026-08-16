import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { useCatalog } from "../catalog/CatalogProvider";
import { getCustomerSession, loginCustomer, logoutCustomer } from "../../services/api";
import CommerceProvider, { useCommerce } from "./CommerceProvider";

vi.mock("../catalog/CatalogProvider", () => ({ useCatalog: vi.fn() }));
vi.mock("../../services/api", () => ({ getCustomerSession: vi.fn(), loginCustomer: vi.fn(), logoutCustomer: vi.fn() }));

function Probe() {
  const commerce = useCommerce();
  return <><span data-testid="cart-ready">{String(commerce.cartReady)}</span><span data-testid="cart">{JSON.stringify(commerce.cart)}</span><span data-testid="customer">{commerce.customer?.name || "none"}</span><button onClick={() => commerce.login({ name: "New", email: "new@example.com" })}>login</button><button onClick={() => commerce.logout()}>logout</button></>;
}

beforeEach(() => {
  getCustomerSession.mockReset().mockResolvedValue({ customer: null });
  loginCustomer.mockReset(); logoutCustomer.mockReset();
  useCatalog.mockReset().mockReturnValue({ products: [], status: "loading" });
});

it("does not sanitize cart during catalog loading/error and hydrates only after success", async () => {
  const storageWrite = vi.spyOn(Storage.prototype, "setItem");
  localStorage.setItem("pap-cart", JSON.stringify([{ id: 1, qty: 9 }, { id: 1, qty: 1 }]));
  const { rerender } = render(<CommerceProvider><Probe /></CommerceProvider>);
  expect(screen.getByTestId("cart-ready")).toHaveTextContent("false");
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toHaveLength(2);
  useCatalog.mockReturnValue({ products: [], status: "error" }); rerender(<CommerceProvider><Probe /></CommerceProvider>);
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toHaveLength(2);
  useCatalog.mockReturnValue({ products: [{ id: 1, stock: 3, price: 10 }], status: "success" }); rerender(<CommerceProvider><Probe /></CommerceProvider>);
  await waitFor(() => expect(screen.getByTestId("cart-ready")).toHaveTextContent("true"));
  expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 3 }, { id: 1, qty: 1 }]);
  const initialWrites = storageWrite.mock.calls.filter(([key]) => key === "pap-cart").length;
  useCatalog.mockReturnValue({ products: [{ id: 1, stock: 3, price: 10 }], status: "loading" }); rerender(<CommerceProvider><Probe /></CommerceProvider>);
  useCatalog.mockReturnValue({ products: [{ id: 1, stock: 3, price: 10 }], status: "success" }); rerender(<CommerceProvider><Probe /></CommerceProvider>);
  expect(storageWrite.mock.calls.filter(([key]) => key === "pap-cart")).toHaveLength(initialWrites);
  useCatalog.mockReturnValue({ products: [{ id: 1, stock: 2, price: 10 }], status: "success" }); rerender(<CommerceProvider><Probe /></CommerceProvider>);
  await waitFor(() => expect(JSON.parse(localStorage.getItem("pap-cart"))).toEqual([{ id: 1, qty: 2 }, { id: 1, qty: 1 }]));
  storageWrite.mockRestore();
});

it("ignores a stale bootstrap response after successful login", async () => {
  let resolveSession;
  getCustomerSession.mockImplementation(() => new Promise((resolve) => { resolveSession = resolve; }));
  loginCustomer.mockResolvedValue({ customer: { name: "New", email: "new@example.com" } });
  render(<CommerceProvider><Probe /></CommerceProvider>);
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  expect(await screen.findByText("New")).toBeInTheDocument();
  resolveSession({ customer: { name: "Stale", email: "old@example.com" } });
  await waitFor(() => expect(screen.getByTestId("customer")).toHaveTextContent("New"));
});

it("lets logout supersede an earlier pending login mutation", async () => {
  let resolveLogin;
  loginCustomer.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));
  logoutCustomer.mockResolvedValue(null);
  render(<CommerceProvider><Probe /></CommerceProvider>);
  await waitFor(() => expect(getCustomerSession).toHaveBeenCalled());
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  resolveLogin({ customer: { name: "Late", email: "late@example.com" } });
  await waitFor(() => expect(screen.getByTestId("customer")).toHaveTextContent("none"));
});

it("aborts a pending login request when logout supersedes it", async () => {
  let loginSignal;
  loginCustomer.mockImplementation((_credentials, signal) => new Promise((_resolve, reject) => {
    loginSignal = signal;
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  logoutCustomer.mockResolvedValue(null);
  render(<CommerceProvider><Probe /></CommerceProvider>);
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  expect(loginSignal.aborted).toBe(false);
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  expect(loginSignal.aborted).toBe(true);
  expect(logoutCustomer.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
});

it("aborts a pending logout request when login supersedes it", async () => {
  let logoutSignal;
  logoutCustomer.mockImplementation((signal) => new Promise((_resolve, reject) => {
    logoutSignal = signal;
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  loginCustomer.mockResolvedValue({ customer: { name: "New", email: "new@example.com" } });
  render(<CommerceProvider><Probe /></CommerceProvider>);
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  expect(logoutSignal.aborted).toBe(false);
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  expect(logoutSignal.aborted).toBe(true);
  expect(loginCustomer.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
});

it("aborts bootstrap on unmount", () => {
  getCustomerSession.mockResolvedValue({ customer: null });
  const { unmount } = render(<CommerceProvider><Probe /></CommerceProvider>);
  const signal = getCustomerSession.mock.calls[0][0];
  expect(signal.aborted).toBe(false); unmount(); expect(signal.aborted).toBe(true);
});
