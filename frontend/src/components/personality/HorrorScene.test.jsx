import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HorrorScene from "./HorrorScene";

describe("HorrorScene", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(window, "addEventListener"); vi.spyOn(window, "requestAnimationFrame"); });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });
  it("keeps reduced-motion final eyes static without pointer tracking or RAF", () => {
    render(<HorrorScene reducedMotion />);
    act(() => vi.advanceTimersByTime(2400));
    expect(window.addEventListener).not.toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
  it("cleans normal-motion pointer tracking and RAF on unmount", () => {
    const view = render(<HorrorScene reducedMotion={false} />);
    act(() => vi.advanceTimersByTime(2400));
    expect(window.addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(window.requestAnimationFrame).toHaveBeenCalled();
    view.unmount();
  });
});
