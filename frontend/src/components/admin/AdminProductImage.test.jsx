import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import AdminProductImage from "./AdminProductImage";

it("replaces a broken product image with the product emoji", () => {
  render(<AdminProductImage product={{ id: 1786820130468, name: "Missing image", image: "/uploads/products/missing.jpg", emoji: "🐾" }} />);
  const image = screen.getByRole("img", { name: "Missing image" });
  fireEvent.error(image);
  expect(screen.queryByRole("img", { name: "Missing image" })).not.toBeInTheDocument();
  expect(document.querySelector(".admin-emoji")).toBeInTheDocument();
});
