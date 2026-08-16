import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("personality sounds", () => {
  beforeEach(() => { vi.resetModules(); vi.spyOn(performance, "now").mockReturnValue(1000); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it.each([["feed","cat",[680,820]],["feed","dog",[360,520]],["pet","cat",[420,500]],["pet","dog",[520,660]],["mood","cat",[392,523,659]],["chaos","both",[220,330,440]]])("plays %s/%s with expected notes", async (type, species, notes) => {
    const frequencies = [], starts = [];
    class AudioContext { state = "running"; currentTime = 10; destination = {}; createOscillator() { return { type:"sine", frequency:{ set value(next) { frequencies.push(next); } }, connect(){ return this; }, start(value){ starts.push(value); }, stop:vi.fn() }; } createGain() { return { gain:{ setValueAtTime:vi.fn(), exponentialRampToValueAtTime:vi.fn() }, connect(){ return this; } }; } }
    vi.stubGlobal("AudioContext", AudioContext); const { playCommerceSound } = await import("./sound"); expect(playCommerceSound(true, type, species)).toBe(true); expect(frequencies).toEqual(notes); expect(starts).toEqual(notes.map((_, index) => 10 + index * .055));
  });
});
