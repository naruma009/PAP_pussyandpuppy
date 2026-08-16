import { describe, expect, it } from "vitest";
import { ACTION_REPLIES, CHAT_REPLIES, MOODS, QUESTION_POOLS } from "./personalityData";
import { moodResult, questionsFor, randomBetween, recommendedProducts, sampleQuestions } from "./personalityBehavior";

describe("legacy personality data and behavior", () => {
  it("keeps the exact pool sizes", () => {
    expect(QUESTION_POOLS.cat).toHaveLength(8); expect(QUESTION_POOLS.dog).toHaveLength(8);
    expect(ACTION_REPLIES.th.feed.cat).toHaveLength(5); expect(ACTION_REPLIES.en.pet.dog).toHaveLength(4);
    expect(CHAT_REPLIES.th.cat).toHaveLength(6); expect(CHAT_REPLIES.en.dog).toHaveLength(6);
    expect(Object.keys(MOODS.cat)).toEqual(["sleepy","judge","domination","new-home","energy"]);
    expect(Object.keys(MOODS.dog)).toEqual(["friend","snack","energy","travel","security"]);
  });
  it("uses inclusive random timing boundaries", () => { expect(randomBetween(1500, 3000, () => 0)).toBe(1500); expect(randomBetween(1500, 3000, () => .999999)).toBe(3000); expect(randomBetween(300, 900, () => .999999)).toBe(900); });
  it("uses Fisher-Yates without mutating the source and takes three", () => { const source = [1,2,3,4]; expect(sampleQuestions(source, 3, () => 0)).toEqual([2,3,4]); expect(source).toEqual([1,2,3,4]); });
  it("localizes legacy English answers by mood and answer index", () => { const questions = questionsFor("cat", "en", () => .999999); expect(questions).toHaveLength(3); expect(questions[0].text).toBe(QUESTION_POOLS.cat[0].en); expect(questions[0].answers[0].text).toBe("The wall remains safe."); });
  it("selects candidates within best minus one", () => { const result = moodResult("cat", [{ mood:"judge", weight:3 },{ mood:"energy", weight:2 },{ mood:"sleepy", weight:1 }], () => .999999); expect(result.candidates).toEqual(["judge","energy"]); expect(result.key).toBe("energy"); });
  it("filters recommendation without stock/featured rules and preserves order/max three", () => {
    const products = [{id:1,category:"Toys",petType:"cat",stock:0},{id:2,category:"Toys",petType:"both"},{id:3,category:"Beds",petType:"cat"},{id:4,category:"Toys",petType:"dog"},{id:5,category:"Toys",petType:"cat"}];
    expect(recommendedProducts(products, "cat", ["Toys"]).map((item) => item.id)).toEqual([1,2,5]);
  });
});
