import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import CustomerNavigation from "./CustomerNavigation";

vi.mock("../../features/commerce/CommerceProvider", () => ({ useCommerce: () => ({ customer: null, customerStatus: "ready", retrySession: vi.fn(), logout: vi.fn() }) }));
vi.mock("../../features/preferences/PreferenceProvider", () => ({ usePreferences: () => ({ language: "en", t: (key) => ({ login: "Login", register: "Register" }[key] || key) }) }));

it("shows login and register links when logged out", () => {
  render(<MemoryRouter><CustomerNavigation /></MemoryRouter>);
  expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
});
