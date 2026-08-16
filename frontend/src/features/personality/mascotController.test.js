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
});
