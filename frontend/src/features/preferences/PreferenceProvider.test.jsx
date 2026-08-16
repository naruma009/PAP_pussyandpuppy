import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import PreferenceControls from "../../components/layout/PreferenceControls";
import PreferenceProvider from "./PreferenceProvider";

it("applies and persists language, theme, and sound preferences", async () => {
  const user = userEvent.setup();
  localStorage.setItem("pap-mode", "cat");
  render(<PreferenceProvider><PreferenceControls /></PreferenceProvider>);
  expect(document.documentElement.dataset.pet).toBe("cat");
  expect(document.documentElement).not.toHaveClass("ui-booting");

  await user.click(screen.getByRole("button", { name: "โหมดมืด" }));
  expect(localStorage.getItem("pap-theme")).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");

  await user.click(screen.getByRole("button", { name: "Switch to English" }));
  expect(localStorage.getItem("pap-language")).toBe("en");
  expect(document.documentElement.lang).toBe("en");

  await user.click(screen.getByRole("button", { name: "Sound Off — turn on" }));
  expect(localStorage.getItem("pap-sound")).toBe("on");
});
