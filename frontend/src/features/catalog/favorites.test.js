import { expect, it } from "vitest";
import { FAVORITES_KEY, readFavorites } from "./favorites";

it("keeps the legacy favorites key and sanitizes IDs", () => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(["2", 2, "bad", 99]));
  expect(readFavorites([{ id: 2 }])).toEqual([2]);
  expect(localStorage.getItem(FAVORITES_KEY)).toBe("[2]");
});
