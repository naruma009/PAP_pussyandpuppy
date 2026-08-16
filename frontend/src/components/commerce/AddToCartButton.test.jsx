import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import AddToCartButton from "./AddToCartButton";

const announce = vi.fn();
vi.mock("../../features/commerce/CommerceProvider", async () => {
  const React = await import("react");
  const Context = React.createContext(null);
  return { useCommerce: () => React.useContext(Context), TestCommerceContext: Context };
});
vi.mock("../../features/preferences/PreferenceProvider", () => ({
  usePreferences: () => ({ language: "en", playSound: vi.fn(), t: (key, params = {}) => ({ inCart: `In Cart: ${params.count}`, notInCart: "Not in cart", stockLimit: "Stock limit reached", added: "Added to cart!", outStock: "Out of Stock", addCart: "Add to Cart +" }[key] || key) }),
}));

it("keeps success feedback visible when the successful add reaches final stock", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const { TestCommerceContext } = await import("../../features/commerce/CommerceProvider");
  function Harness() {
    const [cart, setCart] = useState([]);
    const value = { cart, cartReady: true, announce, addToCart() { setCart([{ id: 1, qty: 1 }]); return true; } };
    return <TestCommerceContext.Provider value={value}><AddToCartButton product={{ id: 1, name: "Only one", price: 10, stock: 1 }} detail /></TestCommerceContext.Provider>;
  }
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Add to Cart +" }));
  expect(screen.getByText("Added to cart!", { selector: ".sr-only" })).toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(1400));
  expect(screen.getByText("Stock limit reached", { selector: ".sr-only" })).toBeInTheDocument();
  vi.useRealTimers();
});
