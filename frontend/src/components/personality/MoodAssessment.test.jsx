import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PreferenceProvider from "../../features/preferences/PreferenceProvider";
import MoodAssessment from "./MoodAssessment";

const products = [
  { id:1, name:"First toy", emoji:"1", category:"Toys", petType:"cat", stock:0 },
  { id:2, name:"Both toy", emoji:"2", category:"Toys", petType:"both", stock:2 },
  { id:3, name:"Wrong pet", emoji:"3", category:"Toys", petType:"dog", stock:2 },
  { id:4, name:"Third toy", emoji:"4", category:"Toys", petType:"cat", stock:2 },
  { id:5, name:"Fourth toy", emoji:"5", category:"Toys", petType:"cat", stock:2 },
];
function view(mode = "cat", items = products) { localStorage.setItem("pap-mode", mode); return render(<PreferenceProvider><MemoryRouter><MoodAssessment products={items} random={() => .999999} /></MemoryRouter></PreferenceProvider>); }
function answerThree() { [0,2,2].forEach((choice) => fireEvent.click(screen.getByRole("dialog").querySelectorAll(".pap-mood-options button")[choice])); }
afterEach(() => vi.restoreAllMocks());

describe("MoodAssessment", () => {
  it("asks Both mode to choose a species before three questions", () => { view("both"); fireEvent.click(screen.getByRole("button", { name:/วันนี้น้องคิดอะไรอยู่/ })); expect(screen.getByRole("dialog")).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name:/น้องแมว/ })); expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument(); });
  it("snapshots catalog and preserves recommendation order/max three", () => {
    const result = view(); fireEvent.click(screen.getByRole("button", { name:/วันนี้น้องคิดอะไรอยู่/ })); result.rerender(<PreferenceProvider><MemoryRouter><MoodAssessment products={[]} random={() => .999999} /></MemoryRouter></PreferenceProvider>); answerThree();
    const links = screen.getAllByRole("link"); expect(links.map((link) => link.textContent)).toEqual(["1 First toy","2 Both toy","4 Third toy"]); expect(links.map((link) => link.getAttribute("href"))).toEqual(["/products/1","/products/2","/products/4"]);
  });
  it("closes with Escape and restores trigger focus", () => { vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(); return 1; }); view(); const trigger = screen.getByRole("button", { name:/วันนี้น้องคิดอะไรอยู่/ }); fireEvent.click(trigger); fireEvent.keyDown(document, { key:"Escape" }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(trigger).toHaveFocus(); });
  it("renders English dialog copy in dark mode", () => { localStorage.setItem("pap-language", "en"); localStorage.setItem("pap-theme", "dark"); view("both"); fireEvent.click(screen.getByRole("button", { name:/What is your pet thinking/ })); expect(screen.getByRole("heading", { name:"Who would you like to analyze today?" })).toBeInTheDocument(); expect(document.documentElement).toHaveAttribute("data-theme", "dark"); });
});
