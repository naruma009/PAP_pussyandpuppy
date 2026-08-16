import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { getAdminSession, loginAdmin, logoutAdmin } from "../../services/api";
import AdminProvider, { useAdmin } from "./AdminProvider";

vi.mock("../../services/api", () => ({ getAdminSession: vi.fn(), loginAdmin: vi.fn(), logoutAdmin: vi.fn() }));

function Probe() {
  const admin = useAdmin();
  return <><span data-testid="state">{admin.status}:{String(admin.authenticated)}</span><button onClick={() => admin.login("code")}>login</button><button onClick={() => admin.logout()}>logout</button><button onClick={admin.retry}>retry</button><button onClick={admin.expireAdminSession}>expire</button></>;
}

beforeEach(() => {
  getAdminSession.mockReset().mockResolvedValue({ authenticated: false });
  loginAdmin.mockReset().mockResolvedValue({ authenticated: true });
  logoutAdmin.mockReset().mockResolvedValue(null);
});

it("bootstraps authenticated, anonymous, error and retry states", async () => {
  getAdminSession.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ authenticated: true });
  render(<AdminProvider><Probe /></AdminProvider>);
  expect(await screen.findByText("error:false")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "retry" }));
  expect(await screen.findByText("ready:true")).toBeInTheDocument();
});

it("aborts bootstrap on unmount", () => {
  getAdminSession.mockImplementation(() => new Promise(() => {}));
  const { unmount } = render(<AdminProvider><Probe /></AdminProvider>);
  const signal = getAdminSession.mock.calls[0][0];
  expect(signal.aborted).toBe(false); unmount(); expect(signal.aborted).toBe(true);
});

it("prevents stale bootstrap and aborts superseded login/logout mutations", async () => {
  let bootstrapResolve; let loginSignal; let logoutSignal;
  getAdminSession.mockImplementation(() => new Promise((resolve) => { bootstrapResolve = resolve; }));
  loginAdmin.mockImplementation((_code, signal) => new Promise((_resolve, reject) => { loginSignal = signal; signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))); }));
  logoutAdmin.mockImplementation((signal) => new Promise((_resolve, reject) => { logoutSignal = signal; signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))); }));
  render(<AdminProvider><Probe /></AdminProvider>);
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  expect(loginSignal.aborted).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  expect(logoutSignal.aborted).toBe(true);
  bootstrapResolve({ authenticated: true });
  await waitFor(() => expect(screen.getByTestId("state")).not.toHaveTextContent("ready:true"));
});

it("does not let a stale bootstrap overwrite a successful login", async () => {
  let resolveSession;
  getAdminSession.mockImplementation(() => new Promise((resolve) => { resolveSession = resolve; }));
  render(<AdminProvider><Probe /></AdminProvider>);
  await userEvent.click(screen.getByRole("button", { name: "login" }));
  expect(await screen.findByText("ready:true")).toBeInTheDocument();
  resolveSession({ authenticated: false });
  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ready:true"));
});

it("does not let a stale retry bootstrap overwrite a successful logout", async () => {
  let resolveRetry;
  getAdminSession.mockResolvedValueOnce({ authenticated: true }).mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));
  render(<AdminProvider><Probe /></AdminProvider>);
  expect(await screen.findByText("ready:true")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "retry" }));
  await userEvent.click(screen.getByRole("button", { name: "logout" }));
  expect(await screen.findByText("ready:false")).toBeInTheDocument();
  resolveRetry({ authenticated: true });
  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ready:false"));
});

it("expires only local admin state without calling logout", async () => {
  getAdminSession.mockResolvedValue({ authenticated: true });
  render(<AdminProvider><Probe /></AdminProvider>);
  expect(await screen.findByText("ready:true")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "expire" }));
  expect(screen.getByTestId("state")).toHaveTextContent("ready:false");
  expect(logoutAdmin).not.toHaveBeenCalled();
});
