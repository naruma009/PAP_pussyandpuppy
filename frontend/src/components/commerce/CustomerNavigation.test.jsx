import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import CustomerNavigation from "./CustomerNavigation";

const logout = vi.fn().mockResolvedValue(true);
vi.mock("../../features/commerce/CommerceProvider", () => ({
  useCommerce: () => ({ customer: { name: "Buyer", email: "buyer@example.com" }, customerStatus: "ready", retrySession: vi.fn(), logout }),
}));
vi.mock("../../features/preferences/PreferenceProvider", () => ({
  usePreferences: () => ({ language: "en", t: (key) => ({ logout: "Logout" }[key] || key) }),
}));

it("uses a semantic dropdown and restores trigger focus on Escape", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CustomerNavigation /><button type="button">Outside</button></MemoryRouter>);
  const trigger = screen.getByRole("button", { name: /Hi, Buyer/ });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveAttribute("aria-controls");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("closes on an outside click", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CustomerNavigation /><button type="button">Outside</button></MemoryRouter>);
  await user.click(screen.getByRole("button", { name: /Hi, Buyer/ }));
  await user.click(screen.getByRole("button", { name: "Outside" }));
  expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
});
