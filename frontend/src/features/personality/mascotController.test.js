import { afterEach, describe, expect, it, vi } from "vitest";
import { createMascotController } from "./mascotController";

afterEach(() => { document.body.innerHTML = ""; vi.useRealTimers(); });

describe("mascot controller", () => {
  it("approaches and climbs a visible product card, then stops after destroy", () => {
    vi.useFakeTimers();
    const card = document.createElement("article"); card.className = "product-card";
    card.getBoundingClientRect = () => ({ width:240, height:300, top:180, bottom:480, left:200, right:440 });
    document.body.append(card);
    const draws = [];
    const controller = createMascotController({ element:document.createElement("div"), kind:"cat", index:0, mobile:false, random:() => 0, onDraw:(model) => draws.push({ ...model }) });
    controller.start(); vi.advanceTimersByTime(900);
    expect(draws.at(-1).state).toBe("approach-card");
    vi.advanceTimersByTime(draws.at(-1).duration + 180);
    expect(draws.at(-1).state).toBe("jump-up");
    controller.destroy(); const count = draws.length; vi.runAllTimers();
    expect(draws).toHaveLength(count);
  });
  it("keeps mobile movement on the ground instead of climbing cards", () => {
    vi.useFakeTimers();
    const card = document.createElement("article"); card.className = "product-card"; card.getBoundingClientRect = () => ({ width:240, top:180, bottom:480, left:200 }); document.body.append(card);
    const draws = []; const controller = createMascotController({ element:document.createElement("div"), kind:"cat", index:0, mobile:true, random:() => 0, onDraw:(model) => draws.push({ ...model }) });
    controller.start(); vi.advanceTimersByTime(900);
    expect(draws.at(-1).state).toBe("ground-walk"); controller.destroy();
  });
  it("isolates lock ownership and resumes reactions after 1300 ms", () => {
    vi.useFakeTimers(); const draws = []; const controller = createMascotController({ element:document.createElement("button"), kind:"dog", index:0, mobile:false, random:() => .69, onDraw:(model) => draws.push({ ...model }) });
    expect(controller.beginInteraction("direct-feed")).toBe(true); expect(controller.beginInteraction("chat")).toBe(false); expect(controller.showInteractionState("chat", "curious")).toBe(false);
    expect(controller.endInteraction("chat")).toBe(false); expect(controller.endInteraction("direct-feed")).toBe(true);
    expect(controller.pauseForResponse()).toBe(true); expect(controller.reactAndResume()).toBe(true); expect(draws.at(-1).state).toBe("happy");
    vi.advanceTimersByTime(1299); expect(controller.isLocked()).toBe(true); vi.advanceTimersByTime(1); expect(controller.isLocked()).toBe(false); controller.destroy();
  });
  it("uses curious at the 70 percent boundary and ignores stale work after destroy", () => {
    vi.useFakeTimers(); const draws = []; const controller = createMascotController({ element:document.createElement("button"), kind:"cat", index:0, mobile:false, random:() => .7, onDraw:(model) => draws.push({ ...model }) });
    controller.pauseForResponse(); controller.reactAndResume(); expect(draws.at(-1).state).toBe("curious"); controller.destroy(); const count = draws.length; vi.runAllTimers(); expect(draws).toHaveLength(count);
  });
  it("releases a chat lock without starting movement when reduced-motion setup never started the controller", () => {
    vi.useFakeTimers(); const draws = []; const controller = createMascotController({ element:document.createElement("button"), kind:"cat", index:0, mobile:false, random:() => 0, onDraw:(model) => draws.push({ ...model }) });
    controller.pauseForResponse(); controller.reactAndResume(); vi.advanceTimersByTime(1300);
    expect(controller.isLocked()).toBe(false); expect(draws.at(-1).state).toBe("idle"); const count = draws.length;
    vi.runAllTimers(); expect(draws).toHaveLength(count); controller.destroy();
  });
});
