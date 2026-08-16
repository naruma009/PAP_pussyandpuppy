import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  delete window.__PAP_PREFERENCES__;
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-language");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-pet");
  document.documentElement.removeAttribute("data-preferences-ready");
});

afterEach(cleanup);
