import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import AppProviders from "./app/providers";
import { routes } from "./router";

function renderRoute(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  return router;
}

it("guards commerce routes until a Pet Mode is selected", async () => {
  renderRoute("/home");
  expect(await screen.findByRole("heading", { name: "บ้านคุณเป็นทีมไหน?" })).toBeInTheDocument();
  expect(screen.queryByLabelText(/secret|horror/i)).not.toBeInTheDocument();
  expect(screen.queryByText("X")).not.toBeInTheDocument();
});

it.each([
  ["/home.html", "/home", "home"],
  ["/products.html?featured=1", "/products", "products"],
  ["/product.html?id=7", "/products/7", "product detail"],
  ["/cart.html", "/cart", "cart"],
  ["/login.html", "/login", "login"],
  ["/checkout.html", "/checkout", "checkout"],
])("maps legacy alias %s to %s", async (legacyPath, expectedPath, page) => {
  localStorage.setItem("pap-mode", "both");
  const router = renderRoute(legacyPath);
  expect(await screen.findByRole("heading", { name: page })).toBeInTheDocument();
  await waitFor(() => expect(router.state.location.pathname).toBe(expectedPath));
});

it("preserves query and hash through legacy aliases", async () => {
  localStorage.setItem("pap-mode", "cat");
  const router = renderRoute("/products.html?featured=1#product-grid");
  await screen.findByRole("heading", { name: "products" });
  expect(router.state.location).toMatchObject({
    pathname: "/products",
    search: "?featured=1",
    hash: "#product-grid",
  });
});
