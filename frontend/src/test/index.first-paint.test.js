import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { expect, it } from "vitest";

it("applies stored preferences while the body is hidden before React loads", () => {
  const html = readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, {
    url: "http://127.0.0.1:5173/home.html",
    runScripts: "dangerously",
    beforeParse(window) {
      window.localStorage.setItem("pap-language", "en");
      window.localStorage.setItem("pap-theme", "dark");
      window.localStorage.setItem("pap-mode", "dog");
    },
  });
  const root = dom.window.document.documentElement;
  expect(root).toHaveProperty("lang", "en");
  expect(root.dataset).toMatchObject({ language: "en", theme: "dark", pet: "dog" });
  expect(root.classList.contains("ui-booting")).toBe(true);
  expect(dom.window.getComputedStyle(dom.window.document.body).visibility).toBe("hidden");
  dom.window.close();
});
