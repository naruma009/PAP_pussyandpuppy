import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PreferenceProvider from "../../features/preferences/PreferenceProvider";
import PersonalityExperience from "./PersonalityExperience";

let reduced = false;
let observers;
let cancelFrame;

beforeEach(() => {
  localStorage.setItem("pap-mode", "both");
  reduced = false; observers = [];
  vi.stubGlobal("matchMedia", vi.fn((query) => ({ matches:query.includes("reduced-motion") ? reduced : false })));
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => setTimeout(callback, 0));
  cancelFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(clearTimeout);
  vi.stubGlobal("MutationObserver", class { constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this); } observe = vi.fn(); });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function view(path = "/home", strict = false) {
  const node = <PreferenceProvider><MemoryRouter initialEntries={[path]}><main /><PersonalityExperience /></MemoryRouter></PreferenceProvider>;
  return render(strict ? <StrictMode>{node}</StrictMode> : node);
}

function NavigationHarness() {
  const navigate = useNavigate();
  return <><main /><button onClick={() => navigate("/account/orders")}>Leave</button><PersonalityExperience /></>;
}

describe("PersonalityExperience", () => {
  it.each([["cat", ["cat"]], ["dog", ["dog"]], ["both", ["cat", "dog"]]])("renders %s mode species", (mode, kinds) => {
    localStorage.setItem("pap-mode", mode); view();
    expect([...screen.getByTestId("mascot-stage").querySelectorAll(".pap-mascot")].map((node) => node.dataset.kind)).toEqual(kinds);
  });
  it("renders the species selected by Pet Mode with localized accessible names", () => {
    localStorage.setItem("pap-language", "en"); view();
    expect(screen.getByTestId("mascot-stage").querySelectorAll(".pap-mascot")).toHaveLength(2);
    expect(screen.getByRole("button", { name:/PAP cat/ })).toBeInTheDocument(); expect(screen.getByRole("button", { name:/PAP dog/ })).toBeInTheDocument();
  });
  it.each(["/account/orders", "/admin"])("does not mount on %s", (path) => { view(path); expect(screen.queryByTestId("mascot-stage")).not.toBeInTheDocument(); });
  it("does not start movement facilities for reduced motion", () => { reduced = true; view(); expect(screen.getByTestId("mascot-stage")).toBeInTheDocument(); expect(observers).toHaveLength(0); });
  it("keeps local Chat available under reduced motion", () => { reduced = true; view(); fireEvent.click(screen.getByRole("button", { name:/ถามน้อง PAP/ })); expect(screen.getByRole("textbox")).toBeInTheDocument(); });
  it("opens the action menu with native keyboard activation", async () => { const user = userEvent.setup(); view(); const mascot = screen.getByRole("button", { name:/แมว PAP/ }); mascot.focus(); await user.keyboard("{Enter}"); expect(screen.getByRole("button", { name:/ให้อาหาร/ })).toHaveFocus(); });
  it("cleans listeners, frames, observer and timers on unmount", () => {
    vi.useFakeTimers(); const remove = vi.spyOn(window, "removeEventListener"); const result = view();
    window.dispatchEvent(new PointerEvent("pointermove", { clientX:10, clientY:20 })); window.dispatchEvent(new Event("scroll"));
    result.unmount();
    expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function)); expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(observers[0].disconnect).toHaveBeenCalled(); expect(cancelFrame).toHaveBeenCalledTimes(2);
    act(() => vi.runAllTimers()); remove.mockRestore(); vi.useRealTimers();
  });
  it("leaves one stage and one active observer after StrictMode remount", () => { view("/home", true); expect(screen.getAllByTestId("mascot-stage")).toHaveLength(1); expect(observers).toHaveLength(2); expect(observers[0].disconnect).toHaveBeenCalled(); });
  it("cleans up when navigation leaves the legacy route scope", () => {
    render(<PreferenceProvider><MemoryRouter initialEntries={["/home"]}><NavigationHarness /></MemoryRouter></PreferenceProvider>);
    fireEvent.click(screen.getByRole("button", { name:"Leave" }));
    expect(screen.queryByTestId("mascot-stage")).not.toBeInTheDocument(); expect(observers[0].disconnect).toHaveBeenCalled();
  });
  it("keeps Thai labels and dark theme compatibility", () => { localStorage.setItem("pap-theme", "dark"); view(); expect(screen.getByRole("button", { name:/แมว PAP/ })).toBeInTheDocument(); expect(document.documentElement).toHaveAttribute("data-theme", "dark"); });
});
