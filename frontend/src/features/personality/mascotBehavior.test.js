import { describe, expect, it } from "vitest";
import { mascotKindsForMode, supportsMascotRoute } from "./mascotBehavior";

describe("mascot behavior", () => {
  it.each([["cat", ["cat"]], ["dog", ["dog"]], ["both", ["cat", "dog"]]])("maps %s mode", (mode, expected) => expect(mascotKindsForMode(mode)).toEqual(expected));
  it.each(["/home", "/products", "/products/1", "/cart", "/login", "/checkout"])("includes %s", (path) => expect(supportsMascotRoute(path)).toBe(true));
  it.each(["/", "/account/orders", "/admin", "/admin.html", "/health"])("excludes %s", (path) => expect(supportsMascotRoute(path)).toBe(false));
});
