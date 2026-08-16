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
  expect(screen.getByLabelText(/secret mode/i)).toBeInTheDocument();
  expect(screen.getByText("X")).toBeInTheDocument();
});

it.each([
  ["/home.html", "/home"],
  ["/products.html?featured=1", "/products"],
  ["/product.html?id=7", "/products/7"],
  ["/cart.html", "/cart"],
  ["/login.html", "/login"],
  ["/checkout.html", "/checkout"],
])("maps legacy alias %s to %s", async (legacyPath, expectedPath) => {
  localStorage.setItem("pap-mode", "both");
  const router = renderRoute(legacyPath);
  await waitFor(() => expect(router.state.location.pathname).toBe(expectedPath));
  expect(document.querySelector("#main")).toBeInTheDocument();
});

it("preserves query and hash through legacy aliases", async () => {
  localStorage.setItem("pap-mode", "cat");
  const router = renderRoute("/products.html?featured=1#product-grid");
  await waitFor(() => expect(router.state.location).toMatchObject({
    pathname: "/products",
    search: "?featured=1",
    hash: "#product-grid",
  }));
});

it.each([
  ["/home.html", /ของโปรดสำหรับ/],
  ["/products.html", /ช้อปความสุข/],
])("renders the catalog destination for legacy alias %s", async (legacyPath, heading) => {
  localStorage.setItem("pap-mode", "both");
  renderRoute(legacyPath);
  expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
});
