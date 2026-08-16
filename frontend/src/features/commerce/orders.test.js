import { expect, it } from "vitest";
import { buildOrderPayload, CUSTOMER_KEY, readCustomer, writeCustomer } from "./orders";

it("preserves duplicate and fractional cart lines without client prices or totals", () => {
  const payload = buildOrderPayload([{ id: 1, qty: 2 }, { id: 1, qty: 1.5 }], { fullName: " Buyer ", email: " buyer@example.com " });
  expect(payload.items).toEqual([{ productId: 1, quantity: 2 }, { productId: 1, quantity: 1.5 }]);
  expect(JSON.stringify(payload)).not.toMatch(/price|subtotal|total/);
  expect(payload.shipping.fullName).toBe("Buyer");
  expect(Object.keys(payload.shipping)).toHaveLength(7);
});

it("reads legacy pap-customer safely and writes the exact seven-field schema", () => {
  localStorage.setItem(CUSTOMER_KEY, "not-json");
  expect(readCustomer()).toBeNull();
  const saved = writeCustomer({ fullName: " Buyer ", phone: " 08 ", email: " a@b.com ", address: " A ", district: " D ", province: " P ", postalCode: " 10000 ", ignored: "x" });
  expect(saved).toEqual({ fullName: "Buyer", phone: "08", email: "a@b.com", address: "A", district: "D", province: "P", postalCode: "10000" });
  expect(JSON.parse(localStorage.getItem(CUSTOMER_KEY))).toEqual(saved);
});
