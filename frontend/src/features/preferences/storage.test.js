import { describe, expect, it } from "vitest";
import { readPreferences } from "./storage";

describe("preference storage compatibility", () => {
  it("reads the existing PAP keys", () => {
    localStorage.setItem("pap-language", "en");
    localStorage.setItem("pap-theme", "dark");
    localStorage.setItem("pap-mode", "cat");
    localStorage.setItem("pap-sound", "on");
    expect(readPreferences()).toEqual({ language: "en", theme: "dark", petMode: "cat", sound: "on" });
  });

  it("uses the legacy session Pet Mode fallback without inventing a selected mode", () => {
    sessionStorage.setItem("pap-mode", "dog");
    expect(readPreferences().petMode).toBe("dog");
    sessionStorage.removeItem("pap-mode");
    window.__PAP_PREFERENCES__ = { petMode: "both" };
    expect(readPreferences().petMode).toBe("");
  });

  it("rejects invalid stored values", () => {
    localStorage.setItem("pap-language", "jp");
    localStorage.setItem("pap-theme", "sepia");
    localStorage.setItem("pap-mode", "bird");
    expect(readPreferences()).toEqual({ language: "th", theme: "light", petMode: "", sound: "off" });
  });
});
