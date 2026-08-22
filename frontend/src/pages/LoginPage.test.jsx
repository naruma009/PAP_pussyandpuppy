import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import LoginPage, { loginDestination } from "./LoginPage";

const login = vi.fn();
const translate = (key) => ({ login: "Login", loginTitle: "Sign in", loginIntro: "Sign in", email: "Email", password: "Password", signingIn: "Signing in", invalidCredentials: "Invalid email or password", noAccount: "New?", register: "Register" }[key] || key);
vi.mock("../features/commerce/CommerceProvider", () => ({ useCommerce: () => ({ customer: null, login }) }));
vi.mock("../features/preferences/PreferenceProvider", () => ({ usePreferences: () => ({ language: "en", playSound: vi.fn(), t: translate }) }));

it("submits email/password and shows generic login errors", async () => {
  login.mockRejectedValueOnce(Object.assign(new Error("backend detail"), { status: 401 }));
  render(<MemoryRouter><LoginPage /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
  await userEvent.click(screen.getByRole("button", { name: "Login" }));
  expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  expect(login).toHaveBeenCalledWith({ email: "a@example.com", password: "wrong-password" });
});

it("allowlists checkout and account orders destinations", () => {
  for (const [saved, expected] of [["checkout.html", "/checkout"], ["/checkout", "/checkout"], ["/account/orders", "/account/orders"], ["https://evil.example", "/home"], ["/admin", "/home"]]) {
    sessionStorage.setItem("pap-after-login", saved);
    expect(loginDestination()).toBe(expected);
  }
});
