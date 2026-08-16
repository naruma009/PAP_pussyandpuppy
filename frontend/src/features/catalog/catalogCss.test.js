import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src", "styles", "catalog.css"), "utf8");

it("keeps Chromium and Firefox dual-range thumbs interactive", () => {
  expect(css).toContain("::-webkit-slider-thumb");
  expect(css).toContain("::-moz-range-thumb");
  expect(css).toMatch(/::-moz-range-thumb\{[^}]*pointer-events:auto/);
});

it("scopes catalog dark surfaces and controls to the dark theme", () => {
  for (const selector of [".banner", ".filter-button", ".favorite-button", ".reset-filters", ".range-track", ".filter-tools input", ".filter-tools select"]) {
    expect(css).toContain(`:root[data-theme="dark"] ${selector}`);
  }
});
