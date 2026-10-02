import { describe, expect, it } from "vitest";

import { lessonProgressLabel, lessonProgressPct } from "@/lib/domain";

/**
 * S9-F1: the Hub sidebar's Lesson Progress card computes the live's qP
 * formula — `[c + 1, "/", d]` — UNCLAMPED, where c = the session's correct
 * count and d = 8. At the 8th correct the live renders "9/8" (observed on
 * the live after completing lesson 1: the card read 9/8 through the
 * Level-Up interstitial). The percent bar uses the live's
 * `Math.round(c / d * 100)` (no clamp either — c never exceeds 8 because
 * the lesson completes at 8 correct).
 */
describe("lessonProgressLabel (S9-F1 — the live's unclamped qP label)", () => {
  it("renders answered + 1 over 8 for a fresh session", () => {
    expect(lessonProgressLabel(0)).toBe("1/8");
  });

  it("renders the mid-lesson counts", () => {
    expect(lessonProgressLabel(3)).toBe("4/8");
  });

  it("renders 8/8 at seven correct", () => {
    expect(lessonProgressLabel(7)).toBe("8/8");
  });

  it("renders 9/8 at the completing 8th correct — the live's observed terminal label", () => {
    // The live's [c+1,"/",d] has no clamp: 8 correct → "9/8" (the live
    // observation this session pinned). The clone previously clamped at 8.
    expect(lessonProgressLabel(8)).toBe("9/8");
  });

  it("is a pure string of answered + 1 — no Math.min clamp anywhere in the formula", () => {
    // The clamp-removal contract: the label must NOT cap at the total.
    // (answered cannot exceed 8 in the real flow — the lesson completes at
    // 8 — but the FORMULA must be the live's, not a defensive clamp.)
    expect(lessonProgressLabel(9)).toBe("10/8");
  });
});

describe("lessonProgressPct (S9-F1 — the live's unclamped qP bar)", () => {
  it("computes 0 at a fresh session", () => {
    expect(lessonProgressPct(0)).toBe(0);
  });

  it("computes 50 at four correct", () => {
    expect(lessonProgressPct(4)).toBe(50);
  });

  it("computes 100 at the completing 8th correct", () => {
    expect(lessonProgressPct(8)).toBe(100);
  });

  it("rounds like the live's Math.round(c/d*100)", () => {
    expect(lessonProgressPct(3)).toBe(38); // Math.round(37.5)
  });
});
