import { describe, expect, it } from "vitest";

import { derivedLessonsCompleted, lessonRowStatus } from "@/lib/domain";

// Session-7 pins — S7-F4: the Course Lessons card's row states keyed off the
// quiz-derived count. The live renders lucide SVG icons per status
// (CircleCheckBig for done, Circle for next/later — the next row's icon is
// full text-black, later rows' icons are text-black/40); the statuses
// themselves ride the same derived count as the row backgrounds
// (#F5F5F5 done / #FFFFFF+black-border next / #FAFAFA later). This pins the
// status derivation the icon column consumes (the icons themselves are
// pinned at the e2e layer — session7-parity.spec.ts).
describe("lessonRowStatus (S7-F4)", () => {
  it("marks rows below the derived count done, the next row next, the rest later", () => {
    // The /demo fixture: quiz 3 → 60% → 4 lessons completed.
    const completed = derivedLessonsCompleted(60);
    expect(completed).toBe(4);
    expect(lessonRowStatus(0, completed)).toBe("done");
    expect(lessonRowStatus(3, completed)).toBe("done");
    expect(lessonRowStatus(4, completed)).toBe("next");
    expect(lessonRowStatus(5, completed)).toBe("later");
  });

  it("starts at next when nothing is completed", () => {
    expect(lessonRowStatus(0, 0)).toBe("next");
    expect(lessonRowStatus(1, 0)).toBe("later");
    expect(lessonRowStatus(5, 0)).toBe("later");
  });

  it("has no next row once every lesson is done", () => {
    expect(lessonRowStatus(5, 6)).toBe("done");
    expect(lessonRowStatus(4, 6)).toBe("done");
  });

  it("never returns a status outside the three decoded states", () => {
    for (let i = 0; i < 6; i++) {
      for (const c of [0, 1, 4, 5, 6]) {
        const s = lessonRowStatus(i, c);
        expect(["done", "next", "later"]).toContain(s);
      }
    }
  });
});
