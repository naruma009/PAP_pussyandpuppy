import { act, fireEvent, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import AppProviders from "../app/providers";
import { routes } from "../router";

it("selects normal Pet Mode without exposing Horror behavior", async () => {
  vi.useFakeTimers();
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  render(<AppProviders><RouterProvider router={router} /></AppProviders>);
  expect(screen.getAllByRole("button")).toHaveLength(6);
  expect(screen.queryByLabelText(/secret|horror/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Cat/ }));
  expect(localStorage.getItem("pap-mode")).toBe("cat");
  expect(sessionStorage.getItem("pap-mode")).toBeNull();
  expect(router.state.location.pathname).toBe("/");
  expect(screen.getByRole("button", { name: /Cat/ })).toHaveClass("chosen");
  await act(() => vi.advanceTimersByTimeAsync(849));
  expect(router.state.location.pathname).toBe("/");
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(router.state.location.pathname).toBe("/home");
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});

afterEach(() => vi.useRealTimers());
