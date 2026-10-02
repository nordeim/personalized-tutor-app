import { describe, expect, it } from "vitest";
import {
  confettiAt,
  enrollmentMaterial,
  masteryLabelTier,
} from "../src/lib/domain";

// Session-12 pins — the dashboard-confetti decode (bundle c_), the
// material-gate helper (the dead === "custom" fix), and the
// exact-equality confetti crossing.

describe("masteryLabelTier (S12-F2c — the live's Qi ladder)", () => {
  // The live's tiers: Novice 0, Apprentice 20, Learner 40, Scholar 60,
  // Expert 80, Master 100 — the label NEVER renders; it exists to drive
  // the 90-particle label-change confetti in the dashboard column.
  it("starts at Novice for 0", () => {
    expect(masteryLabelTier(0).label).toBe("Novice");
  });
  it("keeps Novice below 20", () => {
    expect(masteryLabelTier(19).label).toBe("Novice");
  });
  it("Apprentice at the 20 boundary", () => {
    expect(masteryLabelTier(20).label).toBe("Apprentice");
  });
  it("keeps Apprentice below 40", () => {
    expect(masteryLabelTier(39).label).toBe("Apprentice");
  });
  it("Learner at 40", () => {
    expect(masteryLabelTier(40).label).toBe("Learner");
  });
  it("keeps Learner below 60", () => {
    expect(masteryLabelTier(59).label).toBe("Learner");
  });
  it("Scholar at 60", () => {
    expect(masteryLabelTier(60).label).toBe("Scholar");
  });
  it("Expert at 80", () => {
    expect(masteryLabelTier(80).label).toBe("Expert");
  });
  it("Master at 100", () => {
    expect(masteryLabelTier(100).label).toBe("Master");
  });
  it("caps at Master above 100", () => {
    expect(masteryLabelTier(150).label).toBe("Master");
  });
  it("falls back to Novice for negatives", () => {
    expect(masteryLabelTier(-5).label).toBe("Novice");
  });
  it("exposes the tier's min threshold", () => {
    expect(masteryLabelTier(65).min).toBe(60);
  });
});

describe("confettiAt (S12-F2b — the exact-equality crossing)", () => {
  // The live's c_ effect: a.current < h && (h === 3 || h === 7) — EXACT
  // equality, not >=. The prior >=-crossing pins all still pass; these
  // discriminate the two semantics.
  it("first observation never fires", () => {
    expect(confettiAt(null, 3)).toBe(false);
  });
  it("downward never fires", () => {
    expect(confettiAt(5, 4)).toBe(false);
  });
  it("equal never fires", () => {
    expect(confettiAt(3, 3)).toBe(false);
  });
  it("2 -> 3 fires", () => {
    expect(confettiAt(2, 3)).toBe(true);
  });
  it("6 -> 7 fires", () => {
    expect(confettiAt(6, 7)).toBe(true);
  });
  it("5 -> 7 fires (crosses into 7 directly)", () => {
    expect(confettiAt(5, 7)).toBe(true);
  });
  it("2 -> 7 fires (crosses into 7 directly)", () => {
    expect(confettiAt(2, 7)).toBe(true);
  });
  it("2 -> 4 does NOT fire (h is 4, not 3 or 7 — the live's exact equality)", () => {
    expect(confettiAt(2, 4)).toBe(false);
  });
  it("1 -> 5 does NOT fire", () => {
    expect(confettiAt(1, 5)).toBe(false);
  });
  it("4 -> 7 fires", () => {
    expect(confettiAt(4, 7)).toBe(true);
  });
});

describe("enrollmentMaterial (S12-F1 — the dead custom-gate fix)", () => {
  // The quiz-flow material gate: the broad predicate (custom‖material —
  // the p_/m_ vocabulary), NOT the label-only === "custom" branch that no
  // writer in the codebase can ever emit.
  it("material courses pass their text", () => {
    expect(enrollmentMaterial("material", "Chapter 1: supply and demand")).toBe(
      "Chapter 1: supply and demand",
    );
  });
  it("custom courses (the live's own label) pass their text", () => {
    expect(enrollmentMaterial("custom", "my notes")).toBe("my notes");
  });
  it("topic courses never pass material", () => {
    expect(enrollmentMaterial("topic", "some text")).toBeNull();
  });
  it("a missing source never passes material", () => {
    expect(enrollmentMaterial(null, "some text")).toBeNull();
  });
  it("blank text never feeds the prompt", () => {
    expect(enrollmentMaterial("material", "   ")).toBeNull();
  });
  it("missing text never feeds the prompt", () => {
    expect(enrollmentMaterial("material", null)).toBeNull();
  });
});
