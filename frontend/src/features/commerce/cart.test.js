import { describe, expect, it } from "vitest";
import { addCartItem, cartCount, cartTotal, changeCartQuantity, removeCartItem, sanitizeCart } from "./cart";

const products = [{ id: 1, stock: 3, price: 100 }, { id: 2, stock: 0, price: 50 }];

describe("legacy cart compatibility", () => {
  it("prunes deleted, string-ID, invalid, zero-stock, and non-positive entries", () => {
    expect(sanitizeCart([{ id: 9, qty: 1 }, { id: "1", qty: 1 }, { id: 1, qty: "bad" }, { id: 1, qty: -2 }, { id: 2, qty: 1 }], products)).toEqual([]);
  });

  it("clamps stock while preserving fractional quantities and duplicate IDs", () => {
    expect(sanitizeCart([{ id: 1, qty: 9 }, { id: 1, qty: 1.5 }], products)).toEqual([{ id: 1, qty: 3 }, { id: 1, qty: 1.5 }]);
  });

  it("adds only to the first duplicate and enforces its stock limit", () => {
    const duplicated = [{ id: 1, qty: 2 }, { id: 1, qty: 1 }];
    expect(addCartItem(duplicated, products, 1).cart).toEqual([{ id: 1, qty: 3 }, { id: 1, qty: 1 }]);
    expect(addCartItem([{ id: 1, qty: 3 }, { id: 1, qty: 1 }], products, 1).added).toBe(false);
    expect(addCartItem([], products, 2).added).toBe(false);
  });

  it("decrements to removal, refuses plus at stock, and removes the first duplicate", () => {
    expect(changeCartQuantity([{ id: 1, qty: 1 }], products, 1, -1).cart).toEqual([]);
    expect(changeCartQuantity([{ id: 1, qty: 3 }], products, 1, 1)).toMatchObject({ changed: false, limited: true });
    expect(removeCartItem([{ id: 1, qty: 2 }, { id: 1, qty: 1 }], 1)).toEqual([{ id: 1, qty: 1 }]);
  });

  it("derives badge count and display total without normalizing duplicates", () => {
    const cart = [{ id: 1, qty: 2 }, { id: 1, qty: 1 }];
    expect(cartCount(cart)).toBe(3);
    expect(cartTotal(cart, products)).toBe(300);
  });
});
