import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import AdminLoginPage from "./AdminLoginPage";

const login = vi.fn();
vi.mock("../features/admin/AdminProvider", () => ({ useAdmin: () => ({ login }) }));
vi.mock("../features/preferences/PreferenceProvider", () => ({ usePreferences: () => ({
  t: (key) => ({ adminLogin: "Admin Login", adminLoginIntro: "Sign in", email: "Email", password: "Password", checkingAdmin: "Checking", invalidAdminCredentials: "Invalid admin email or password" }[key] || key),
}) }));

it("submits real admin credentials without an Admin Code field", async () => {
  login.mockResolvedValueOnce(true);
  const user = userEvent.setup();
  render(<AdminLoginPage />);
  await user.type(screen.getByLabelText("Email"), "admin@example.com");
  await user.type(screen.getByLabelText("Password"), "secret");
  expect(screen.queryByLabelText(/Admin Code|Access code/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Admin Login" }));
  expect(login).toHaveBeenCalledWith({ email: "admin@example.com", password: "secret" });
});

it("shows a generic error for rejected credentials or role", async () => {
  login.mockRejectedValueOnce(Object.assign(new Error("backend detail"), { status: 401 }));
  const user = userEvent.setup();
  render(<AdminLoginPage />);
  await user.type(screen.getByLabelText("Email"), "customer@example.com");
  await user.type(screen.getByLabelText("Password"), "secret");
  await user.click(screen.getByRole("button", { name: "Admin Login" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid admin email or password");
  expect(screen.queryByText("backend detail")).not.toBeInTheDocument();
});
