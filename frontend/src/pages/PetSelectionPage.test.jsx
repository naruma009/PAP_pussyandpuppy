import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

it("selects normal Pet Mode without exposing Horror behavior", async () => {
  const user = userEvent.setup();
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  expect(screen.getAllByRole("button")).toHaveLength(6);
  expect(screen.queryByLabelText(/secret|horror/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Cat ของดี/ }));
  expect(localStorage.getItem("pap-mode")).toBe("cat");
  expect(sessionStorage.getItem("pap-mode")).toBeNull();
  await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
