import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PreferenceProvider from "../../features/preferences/PreferenceProvider";
import PetChat from "./PetChat";

function responder(kind, locked = false) { let busy = locked; return { kind, isLocked:() => busy, pauseForResponse:vi.fn(() => busy ? false : Boolean(busy = true)), reactAndResume:vi.fn(), endInteraction:vi.fn(() => { busy = false; }) }; }
const view = (controllers, props = {}) => render(<PreferenceProvider><PetChat getControllers={() => controllers} mode={props.mode || "cat"} random={props.random || (() => 0)} /></PreferenceProvider>);
afterEach(() => vi.useRealTimers());

describe("PetChat", () => {
  it.each([[0,300],[.999999,900]])("uses the legacy reply delay boundary %s", (random, delay) => {
    vi.useFakeTimers(); const cat = responder("cat"); view([cat], { random:() => random }); fireEvent.click(screen.getByRole("button", { name:/ถามน้อง PAP/ })); const input = screen.getByRole("textbox"); fireEvent.change(input, { target:{ value:" hello " } }); fireEvent.submit(input.closest("form"));
    expect(input).toBeDisabled(); act(() => vi.advanceTimersByTime(delay - 1)); expect(cat.reactAndResume).not.toHaveBeenCalled(); act(() => vi.advanceTimersByTime(1)); expect(cat.reactAndResume).toHaveBeenCalled(); expect(input).toHaveFocus();
  });
  it("keeps input when all mascots are locked", () => { const cat = responder("cat", true), dog = responder("dog", true); view([cat,dog], { mode:"both" }); fireEvent.click(screen.getByRole("button", { name:/ถามน้อง PAP/ })); const input = screen.getByRole("textbox"); fireEvent.change(input, { target:{ value:"stay" } }); fireEvent.submit(input.closest("form")); expect(input).toHaveValue("stay"); expect(cat.pauseForResponse).not.toHaveBeenCalled(); });
  it("selects only an unlocked responder in Both mode", () => { vi.useFakeTimers(); const cat = responder("cat", true), dog = responder("dog"); view([cat,dog], { mode:"both", random:() => 0 }); fireEvent.click(screen.getByRole("button", { name:/ถามน้อง PAP/ })); const input = screen.getByRole("textbox"); fireEvent.change(input, { target:{ value:"hello" } }); fireEvent.submit(input.closest("form")); expect(cat.pauseForResponse).not.toHaveBeenCalled(); expect(dog.pauseForResponse).toHaveBeenCalled(); });
  it("trims messages and ignores empty submit", () => { const cat = responder("cat"); view([cat]); fireEvent.click(screen.getByRole("button", { name:/ถามน้อง PAP/ })); const input = screen.getByRole("textbox"); fireEvent.change(input, { target:{ value:"   " } }); fireEvent.submit(input.closest("form")); expect(cat.pauseForResponse).not.toHaveBeenCalled(); fireEvent.change(input, { target:{ value:"  hello  " } }); fireEvent.submit(input.closest("form")); expect(screen.getByText("hello")).toBeInTheDocument(); });
  it("continues a pending reply while closed without focusing the hidden input", () => {
    vi.useFakeTimers(); const cat = responder("cat"); view([cat]); const launcher = screen.getByRole("button", { name:/ถามน้อง PAP/ }); fireEvent.click(launcher); const input = screen.getByRole("textbox"); fireEvent.change(input, { target:{ value:"hello" } }); fireEvent.submit(input.closest("form")); fireEvent.click(screen.getByRole("button", { name:"ปิด" })); expect(launcher).toHaveFocus(); act(() => vi.advanceTimersByTime(300)); expect(launcher).toHaveFocus(); fireEvent.click(launcher); expect(screen.getByText("เหมียว")).toBeInTheDocument();
  });
  it("cancels continuation and releases chat lock on unmount", () => { vi.useFakeTimers(); const cat = responder("cat"); const result = view([cat]); fireEvent.click(screen.getByRole("button", { name:/ถามน้อง PAP/ })); const input = screen.getByRole("textbox"); fireEvent.change(input, { target:{ value:"hello" } }); fireEvent.submit(input.closest("form")); result.unmount(); act(() => vi.runAllTimers()); expect(cat.reactAndResume).not.toHaveBeenCalled(); expect(cat.endInteraction).toHaveBeenCalledWith("chat"); });
});
