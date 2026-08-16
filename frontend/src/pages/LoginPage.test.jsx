import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

const login = vi.fn();
const translate = (key) => ({ login: "Login", loginTitle: "Join", demoLoginNote: "Demo", nickname: "Nickname", nicknameExample: "Name", email: "Email", signingIn: "Signing in", demoLogin: "Demo Login" }[key] || key);
vi.mock("../features/commerce/CommerceProvider", () => ({ useCommerce: () => ({ customer: null, login }) }));
vi.mock("../features/preferences/PreferenceProvider", () => ({ usePreferences: () => ({ language: "en", playSound: vi.fn(), t: translate }) }));

it("shows login API errors and preserves pap-after-login", async () => {
  login.mockRejectedValueOnce(new Error("Name and valid email are required"));
  sessionStorage.setItem("pap-after-login", "checkout.html");
  render(<MemoryRouter><LoginPage /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText("Nickname"), "A");
  await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
  await userEvent.click(screen.getByRole("button", { name: "Demo Login" }));
  expect(await screen.findByText("Name and valid email are required")).toBeInTheDocument();
  expect(sessionStorage.getItem("pap-after-login")).toBe("checkout.html");
});
