import { describe, expect, it } from "vitest";
import { eligibleProducts, filterProducts, initialFilters, petTypesForMode, priceBounds, storageKey } from "./catalog";

const products = [
  { id: 1, name: "Cat Food", description: "adult", category: "Food", petType: "cat", ageGroup: "adult", price: 100, stock: 2, featured: true, createdAt: "2026-01-01" },
  { id: 2, name: "Shared Toy", description: "all", category: "Toys", petType: "both", ageGroup: "all", price: 300, stock: 0, featured: true, createdAt: "2026-02-01" },
  { id: 3, name: "Dog Treat", description: "young", category: "Treats", petType: "dog", ageGroup: "young", price: 200, stock: 5, featured: false, createdAt: "bad" },
];

describe("catalog parity", () => {
  it("uses exact Pet Mode choices and defaults", () => {
    expect(petTypesForMode("cat")).toEqual(["cat", "both"]);
    expect(petTypesForMode("dog")).toEqual(["dog", "both"]);
    expect(petTypesForMode("both")).toEqual(["cat", "dog", "both"]);
    expect(initialFilters({}, "cat", { min: 0, max: 500 }).petType).toBe("cat");
    expect(initialFilters({}, "dog", { min: 0, max: 500 }).petType).toBe("dog");
    expect(initialFilters({}, "both", { min: 0, max: 500 }).petType).toBe("cat");
  });

  it("keeps featured and filter storage separate by mode", () => {
    expect(storageKey("cat", false)).toBe("pap-product-filters-cat");
    expect(storageKey("cat", true)).toBe("pap-product-filters-cat-featured");
  });

  it("derives bounds before discovery filters and filters inclusively", () => {
    const eligible = eligibleProducts(products, "both", true);
    expect(eligible.map((item) => item.id)).toEqual([1, 2]);
    expect(priceBounds(eligible)).toEqual({ min: 100, max: 300 });
    const filters = { ...initialFilters({}, "both", { min: 100, max: 300 }), petType: "cat", min: 100, max: 100 };
    expect(filterProducts(eligible, filters, new Set(), "en").map((item) => item.id)).toEqual([1]);
  });

  it("supports age-all, stock, favorites, search, and newest sorting", () => {
    const filters = { ...initialFilters({}, "both", { min: 0, max: 500 }), petType: "both", age: "senior", hideOutOfStock: false, favoritesOnly: true, search: "toy", sort: "newest" };
    expect(filterProducts(products, filters, new Set([2]), "en").map((item) => item.id)).toEqual([2]);
    expect(filterProducts(products, { ...filters, hideOutOfStock: true }, new Set([2]), "en")).toEqual([]);
  });

  it("validates restored filters and resets crossed price bounds", () => {
    const state = initialFilters({ petType: "all", min: 999, max: -1, sort: "bogus", stock: "in" }, "both", { min: 100, max: 300 });
    expect(state).toMatchObject({ petType: "cat", min: 100, max: 300, sort: "default", hideOutOfStock: true });
  });
});
