import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { getProducts } from "../../services/api";
import CatalogProvider, { useCatalog } from "./CatalogProvider";

vi.mock("../../services/api", () => ({ getProducts: vi.fn() }));
function Probe() { const catalog = useCatalog(); return <><span>{catalog.status}</span><span>{catalog.products.length}</span><button onClick={catalog.retry}>retry</button></>; }

beforeEach(() => getProducts.mockReset());
it("hydrates once and retries API failures", async () => {
  getProducts.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([{ id: 1 }]);
  render(<CatalogProvider><Probe /></CatalogProvider>);
  expect(await screen.findByText("error")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "retry" }));
  await waitFor(() => expect(screen.getByText("success")).toBeInTheDocument());
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(getProducts).toHaveBeenCalledTimes(2);
});

it("aborts hydration when the provider unmounts", () => {
  getProducts.mockResolvedValue([]);
  const { unmount } = render(<CatalogProvider><Probe /></CatalogProvider>);
  const signal = getProducts.mock.calls[0][0];
  expect(signal.aborted).toBe(false);
  unmount();
  expect(signal.aborted).toBe(true);
});
