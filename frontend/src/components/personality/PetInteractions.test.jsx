import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PreferenceProvider from "../../features/preferences/PreferenceProvider";
import PetInteractions from "./PetInteractions";

function mascot(kind) {
  let owner = null;
  const element = document.createElement("button"); element.className = "pap-mascot"; element.getBoundingClientRect = () => ({ left:200, top:300 }); document.body.append(element);
  return { kind, element, beginInteraction:vi.fn((next) => owner ? false : Boolean(owner = next)), showInteractionState:vi.fn((next) => owner === next), endInteraction:vi.fn((next) => owner === next ? !(owner = null) : false), isLocked:() => Boolean(owner) };
}
const wrap = (node) => render(<PreferenceProvider>{node}</PreferenceProvider>);
afterEach(() => { vi.useRealTimers(); document.querySelectorAll("body > .pap-mascot").forEach((node) => node.remove()); });

describe("PetInteractions", () => {
  it.each([[0,1500],[.999999,3000]])("keeps inclusive bubble duration for random %s", (random, duration) => {
    vi.useFakeTimers(); const cat = mascot("cat"); const close = vi.fn(); wrap(<PetInteractions getControllers={() => [cat]} menuKind="cat" onCloseMenu={close} random={() => random} />);
    expect(screen.getByRole("button", { name:/ให้อาหาร/ })).toHaveFocus(); fireEvent.click(screen.getByRole("button", { name:/ให้อาหาร/ }));
    expect(cat.showInteractionState).toHaveBeenCalledWith("direct-feed", "excited"); expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(duration - 1)); expect(cat.endInteraction).not.toHaveBeenCalled(); act(() => vi.advanceTimersByTime(1)); expect(cat.endInteraction).toHaveBeenCalledWith("direct-feed");
  });
  it("supports independent mascot locks in Both mode", () => {
    vi.useFakeTimers(); const cat = mascot("cat"), dog = mascot("dog"), close = vi.fn(); const result = wrap(<PetInteractions getControllers={() => [cat,dog]} menuKind="cat" onCloseMenu={close} random={() => 0} />);
    fireEvent.click(screen.getByRole("button", { name:/ให้อาหาร/ })); result.rerender(<PreferenceProvider><PetInteractions getControllers={() => [cat,dog]} menuKind="dog" onCloseMenu={close} random={() => 0} /></PreferenceProvider>); fireEvent.click(screen.getByRole("button", { name:/ลูบหัว/ }));
    expect(cat.beginInteraction).toHaveBeenCalledWith("direct-feed"); expect(dog.beginInteraction).toHaveBeenCalledWith("direct-pet"); expect(screen.getAllByRole("status")).toHaveLength(2);
  });
  it("closes on Escape and restores mascot focus", () => { const cat = mascot("cat"); wrap(<PetInteractions getControllers={() => [cat]} menuKind="cat" onCloseMenu={vi.fn()} />); fireEvent.keyDown(document, { key:"Escape" }); expect(cat.element).toHaveFocus(); });
  it("closes on outside click", () => { const cat = mascot("cat"), close = vi.fn(); wrap(<PetInteractions getControllers={() => [cat]} menuKind="cat" onCloseMenu={close} />); fireEvent.pointerDown(document.body); expect(close).toHaveBeenCalled(); });
});
