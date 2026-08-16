import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChaosExperience from "./ChaosExperience";

const controller = (begin = true) => ({ isLocked:() => false, beginInteraction:vi.fn(() => begin), endInteraction:vi.fn() });

describe("ChaosExperience", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
  it("rolls back every lock when one controller fails", () => {
    const first = controller(true); const second = controller(false);
    render(<ChaosExperience controllers={[first, second]} mode="both" reducedMotion={false} playSound={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name:"Secret" }));
    expect(first.endInteraction).toHaveBeenCalledWith("chaos");
    expect(screen.queryByTestId("chaos-stage")).not.toBeInTheDocument();
  });
  it("cleans reduced chaos once and unlocks at three seconds", () => {
    const first = controller(true); const second = controller(true); const sound = vi.fn();
    render(<ChaosExperience controllers={[first, second]} mode="both" reducedMotion playSound={sound} />);
    fireEvent.click(screen.getByRole("button", { name:"Secret" }));
    expect(screen.getByTestId("chaos-stage").querySelectorAll("span")).toHaveLength(4);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByTestId("chaos-stage")).not.toBeInTheDocument();
    expect(first.endInteraction).toHaveBeenCalledTimes(1);
    expect(second.endInteraction).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(9500));
    expect(first.endInteraction).toHaveBeenCalledTimes(1);
    expect(sound).toHaveBeenCalledWith("chaos", "both");
  });
});
