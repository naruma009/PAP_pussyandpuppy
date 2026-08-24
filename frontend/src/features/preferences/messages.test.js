import { expect, it } from "vitest";
import { messages } from "./messages";

it("keeps normal storefront copy on the pal2paw brand", () => {
  expect(messages.th.bannerTitle).toContain("pal2paw");
  expect(messages.en.bannerTitle).toContain("pal2paw");
  expect(messages.th.loginTitle).toContain("pal2paw");
  expect(messages.en.loginTitle).toContain("pal2paw");
  expect(messages.en.demoLogin).toBeUndefined();
  expect(messages.en.demoLoginNote).toBeUndefined();
});
