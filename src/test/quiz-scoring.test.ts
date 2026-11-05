import { describe, expect, it } from "vitest";
import { fiftyFifty, lifetimeTotal, pointsFor, starsFor } from "@/lib/quiz-scoring";

describe("Kuis Seru scoring", () => {
  it("santai gives points only for correct answers, no speed bonus", () => {
    expect(pointsFor({ correct: true, mode: "santai", secondsLeft: 20, limit: 20, streak: 1 })).toBe(100);
    expect(pointsFor({ correct: false, mode: "santai", secondsLeft: 20, limit: 20, streak: 0 })).toBe(0);
  });
  it("tantangan rewards faster answers", () => {
    const fast = pointsFor({ correct: true, mode: "tantangan", secondsLeft: 18, limit: 20, streak: 1 });
    const slow = pointsFor({ correct: true, mode: "tantangan", secondsLeft: 2, limit: 20, streak: 1 });
    expect(fast).toBeGreaterThan(slow);
  });
  it("streak adds bonus points", () => {
    expect(pointsFor({ correct: true, mode: "santai", secondsLeft: 0, limit: 20, streak: 3 })).toBe(120);
  });
  it("lifetime total sums best score per quiz, replays cannot farm", () => {
    expect(lifetimeTotal([
      { episode_id: "a", score: 300 }, { episode_id: "a", score: 500 }, { episode_id: "a", score: 500 }, { episode_id: "b", score: 200 },
    ])).toBe(700);
  });
  it("stars range 1 to 3", () => {
    expect(starsFor(7, 7)).toBe(3);
    expect(starsFor(5, 7)).toBe(2);
    expect(starsFor(0, 7)).toBe(1);
  });
  it("50:50 removes two wrong options only", () => {
    const r = fiftyFifty(4, 2);
    expect(r).toHaveLength(2);
    expect(r).not.toContain(2);
  });
});
