import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import { registerCustomer } from "../services/api";

const login = vi.fn().mockResolvedValue({ id: 1, name: "New", email: "new@example.com" });
vi.mock("../features/commerce/CommerceProvider", () => ({ useCommerce: () => ({ customer: null, login }) }));
vi.mock("../features/preferences/PreferenceProvider", () => ({ usePreferences: () => ({ language: "en", playSound: vi.fn(), t: (key) => ({ register: "Register", registerTitle: "Create account", registerIntro: "Join", name: "Name", email: "Email", password: "Password", confirmPassword: "Confirm password", registering: "Creating", passwordMismatch: "Passwords do not match", emailRegistered: "Email already registered", hasAccount: "Have account?", login: "Login" }[key] || key) }) }));
vi.mock("../services/api", () => ({ registerCustomer: vi.fn() }));

it("rejects mismatched passwords without calling the API", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><RegisterPage /></MemoryRouter>);
  await user.type(screen.getByLabelText("Name"), "New");
  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password-one");
  await user.type(screen.getByLabelText("Confirm password"), "password-two");
  await user.click(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  expect(registerCustomer).not.toHaveBeenCalled();
});

it("registers without sending role/admin fields and logs in", async () => {
  registerCustomer.mockResolvedValue({ user: { id: 1, name: "New", email: "new@example.com" } });
  const user = userEvent.setup();
  render(<MemoryRouter><RegisterPage /></MemoryRouter>);
  await user.type(screen.getByLabelText("Name"), "New");
  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password-one");
  await user.type(screen.getByLabelText("Confirm password"), "password-one");
  await user.click(screen.getByRole("button", { name: "Register" }));
  expect(registerCustomer).toHaveBeenCalledWith({ name: "New", email: "new@example.com", password: "password-one" });
  expect(login).toHaveBeenCalledWith({ email: "new@example.com", password: "password-one" });
});
