import { expect, it } from "vitest";
import { formatAdminOrderDate, formatShippingAddress } from "./adminOrders";

it("formats order date and time for Thai and English without changing the source", () => {
  const value = "2026-08-17T10:30:00Z";
  expect(formatAdminOrderDate(value, "th")).toMatch(/2569/);
  expect(formatAdminOrderDate(value, "en")).toMatch(/2026/);
  expect(formatAdminOrderDate("not-a-date", "en")).toBe("not-a-date");
});

it("formats the complete shipping address in contract order", () => {
  expect(formatShippingAddress({ address: "1 Road", district: "Area", province: "Bangkok", postalCode: "10000" })).toBe("1 Road, Area, Bangkok, 10000");
});
