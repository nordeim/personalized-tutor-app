// Session-2 parity pins — the reference's data-driven content, mined verbatim
// from the live bundle (clone-workspace/recon/live-index.js). These tests pin
// the exact pools and math the live app ships so the clone cannot drift.
import { describe, expect, it } from "vitest";
import {
  confettiAt,
  DIVE_TOPICS,
  requeueQuestion,
  studyStreakDays,
  totalXp,
} from "@/lib/domain";
import {
  ENCOURAGEMENT_POOL,
  encouragementFor,
  POOL,
  QUOTE_POOL,
  randomLine,
} from "@/lib/quotes";

describe("DIVE_TOPICS — the dashboard typewriter list (live bundle $i)", () => {
  it("ships the reference's exact eight topics in order", () => {
    expect(DIVE_TOPICS).toEqual([
      "Literature",
      "Finance",
      "History",
      "Psychology",
      "Marketing",
      "Philosophy",
      "Economics",
      "Biology",
    ]);
  });

  it("does not ship clone-era inventions (Music Theory)", () => {
    expect(DIVE_TOPICS).not.toContain("Music Theory");
  });
});

describe("the 99-line content pool (live bundle Hy)", () => {
  it("is exactly 99 lines: 49 authored quotes + 50 encouragements", () => {
    expect(POOL).toHaveLength(99);
    expect(QUOTE_POOL).toHaveLength(49);
    expect(ENCOURAGEMENT_POOL).toHaveLength(50);
  });

  it("renders every authored quote as '\"text\" — Author'", () => {
    for (const q of QUOTE_POOL) {
      expect(q.raw).toMatch(/^".*" — .+$/);
      expect(q.text.length).toBeGreaterThan(5);
      expect(q.author.length).toBeGreaterThan(2);
    }
  });

  it("keeps the exact first and last lines the live app ships", () => {
    expect(QUOTE_POOL[0].raw).toBe(
      '"An investment in knowledge pays the best interest." — Benjamin Franklin'
    );
    expect(ENCOURAGEMENT_POOL[0]).toBe(
      "Every lesson you finish today is a step closer to who you want to become!"
    );
    expect(ENCOURAGEMENT_POOL[49]).toBe(
      "Stay curious, stay hungry — the best discoveries are still ahead of you!"
    );
  });

  it("fixes the Plutarch wording to the live copy (ignited, comma)", () => {
    const plutarch = QUOTE_POOL.find((q) => q.author === "Plutarch");
    expect(plutarch?.text).toBe(
      "The mind is not a vessel to be filled, but a fire to be ignited."
    );
  });

  it("drops the three quotes the live app never shipped", () => {
    const texts = QUOTE_POOL.map((q) => q.text);
    expect(texts).not.toContain(
      "Education is the kindling of a flame, not the filling of a vessel."
    );
    expect(texts).not.toContain(
      "The beautiful thing about learning is that no one can take it away from you."
    );
  });

  it("survives the four encouragement lines the clone already used", () => {
    for (const line of [
      "Every lesson you finish today is a step closer to who you want to become!",
      "You are becoming smarter and stronger with every lesson!",
      "You are one lesson away from a new perspective that could change everything!",
      "You're writing your own success story — one lesson at a time!",
    ]) {
      expect(ENCOURAGEMENT_POOL).toContain(line);
    }
  });

  it("encouragements cycle per lesson number across the 50-line pool", () => {
    expect(encouragementFor(1)).toBe(ENCOURAGEMENT_POOL[0]);
    expect(encouragementFor(2)).toBe(ENCOURAGEMENT_POOL[1]);
    expect(encouragementFor(51)).toBe(ENCOURAGEMENT_POOL[0]);
  });

  it("randomLine picks a pool member (injectable rng, reference semantics)", () => {
    expect(randomLine(() => 0)).toBe(POOL[0]);
    expect(randomLine(() => 0.999)).toBe(POOL[98]);
    expect(POOL).toContain(randomLine(Math.random));
  });
});

describe("gamification math (live bundle c_ card)", () => {
  it("studyStreakDays caps the quiz score at 7 days", () => {
    expect(studyStreakDays(0)).toBe(0);
    expect(studyStreakDays(4)).toBe(4);
    expect(studyStreakDays(7)).toBe(7);
    expect(studyStreakDays(9)).toBe(7);
    expect(studyStreakDays(-2)).toBe(0);
  });

  it("totalXp = scorePercent*10 + quizScore*50 (the live formula)", () => {
    expect(totalXp(0, 0)).toBe(0);
    expect(totalXp(60, 4)).toBe(800);
    expect(totalXp(100, 7)).toBe(1350);
  });

  it("confettiAt fires only when the score CROSSES 3 or 7 upward", () => {
    expect(confettiAt(null, 0)).toBe(false);
    expect(confettiAt(0, 1)).toBe(false);
    expect(confettiAt(2, 3)).toBe(true);
    expect(confettiAt(3, 4)).toBe(false);
    expect(confettiAt(4, 7)).toBe(true);
    expect(confettiAt(7, 7)).toBe(false);
    expect(confettiAt(6, 7)).toBe(true);
    expect(confettiAt(5, 4)).toBe(false); // downward never fires
    expect(confettiAt(null, 3)).toBe(false); // first observation initializes
    expect(confettiAt(null, 7)).toBe(false);
  });
});

describe("requeueQuestion — the retry-later semantics", () => {
  const base = [
    { id: 0, question: "Q1", options: ["a", "b", "c", "d"], correctIndex: 0 },
    { id: 1, question: "Q2", options: ["a", "b", "c", "d"], correctIndex: 1 },
  ];

  it("appends a copy at the end and never mutates the original", () => {
    const next = requeueQuestion(base, base[0]);
    expect(next).toHaveLength(3);
    expect(next[2]).toMatchObject({ question: "Q1", correctIndex: 0 });
    expect(next[2]).not.toBe(base[0]); // a copy, not the same reference
    expect(base).toHaveLength(2);
  });

  it("keeps appending when the re-queued copy itself is re-queued", () => {
    const once = requeueQuestion(base, base[1]);
    const twice = requeueQuestion(once, once[2]);
    expect(twice).toHaveLength(4);
    expect(twice[3].question).toBe("Q2");
  });
});
