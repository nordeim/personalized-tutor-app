import { describe, expect, it } from "vitest";
import {
  CATEGORY_TAGS,
  DEFAULT_LESSON_TITLES,
  completedLessonCount,
  courseProgressPercent,
  lessonMeta,
  lessonTitles,
  masteryLevel,
  parseRoadmap,
  stageLevelLabel,
  stageStatus,
  avatarLetter,
  displayName,
} from "@/lib/domain";
import { quoteOfTheDay, encouragementFor } from "@/lib/quotes";

describe("lessonMeta — the 3-stage × 2-level grid", () => {
  it("maps all six lesson indexes onto the grid", () => {
    expect(lessonMeta(0)).toEqual({ index: 0, number: 1, stage: 0, level: 0 });
    expect(lessonMeta(1)).toEqual({ index: 1, number: 2, stage: 0, level: 1 });
    expect(lessonMeta(2)).toEqual({ index: 2, number: 3, stage: 1, level: 0 });
    expect(lessonMeta(3)).toEqual({ index: 3, number: 4, stage: 1, level: 1 });
    expect(lessonMeta(4)).toEqual({ index: 4, number: 5, stage: 2, level: 0 });
    expect(lessonMeta(5)).toEqual({ index: 5, number: 6, stage: 2, level: 1 });
  });

  it("clamps out-of-range indexes", () => {
    expect(lessonMeta(-3).index).toBe(0);
    expect(lessonMeta(99).index).toBe(5);
  });

  it("renders the sheet label 'Stage N · Level N'", () => {
    expect(stageLevelLabel(0)).toBe("Stage 1 · Level 1");
    expect(stageLevelLabel(4)).toBe("Stage 3 · Level 1");
  });
});

describe("parseRoadmap — defensive JSON parsing", () => {
  it("parses a valid 3-stage roadmap", () => {
    const json = JSON.stringify([
      { title: "A", description: "a" },
      { title: "B", description: "b" },
      { title: "C", description: "c" },
    ]);
    const roadmap = parseRoadmap(json);
    expect(roadmap).toHaveLength(3);
    expect(roadmap[0]).toEqual({ title: "A", description: "a" });
  });

  it("degrades invalid input to an empty roadmap", () => {
    expect(parseRoadmap(null)).toEqual([]);
    expect(parseRoadmap("")).toEqual([]);
    expect(parseRoadmap("not json")).toEqual([]);
    expect(parseRoadmap(JSON.stringify({ title: "x" }))).toEqual([]);
    expect(parseRoadmap(JSON.stringify([42, "nope"]))).toEqual([]);
  });

  it("caps the roadmap at 3 stages", () => {
    const five = JSON.stringify([1, 2, 3, 4, 5].map((i) => ({ title: `t${i}` })));
    expect(parseRoadmap(five)).toHaveLength(3);
  });
});

describe("lessonTitles — roadmap-aware titles with default fallback", () => {
  it("derives '{Stage}: Basics' / '{Stage}: In Practice' titles", () => {
    const titles = lessonTitles([{ title: "Foundations", description: "" }]);
    expect(titles[0]).toBe("Foundations: Basics");
    expect(titles[1]).toBe("Foundations: In Practice");
    expect(titles[2]).toBe(DEFAULT_LESSON_TITLES[2]);
  });

  it("falls back to the default grid with an empty roadmap", () => {
    expect(lessonTitles([])).toEqual([...DEFAULT_LESSON_TITLES]);
  });
});

describe("progress math", () => {
  it("counts completed lessons", () => {
    expect(completedLessonCount([{ completed: false }, { completed: true }])).toBe(1);
  });

  it("computes course progress percent", () => {
    expect(courseProgressPercent(0)).toBe(0);
    expect(courseProgressPercent(3)).toBe(50);
    expect(courseProgressPercent(6)).toBe(100);
    expect(courseProgressPercent(9)).toBe(100);
  });

  it("classifies stage status", () => {
    // nothing done: stage 0 shows in-progress (course started)
    expect(stageStatus(0, [])).toBe("in-progress");
    expect(stageStatus(1, [])).toBe("upcoming");
    // first lesson of stage 0 done → stage 0 in progress
    expect(stageStatus(0, [0])).toBe("in-progress");
    // both lessons of stage 0 done → done
    expect(stageStatus(0, [0, 1])).toBe("done");
    expect(stageStatus(1, [0, 1])).toBe("upcoming");
  });
});

describe("mastery ladder", () => {
  it("maps quiz score 0-7 onto the 3 levels", () => {
    expect(masteryLevel(0)).toBe(1);
    expect(masteryLevel(2)).toBe(1);
    expect(masteryLevel(3)).toBe(2);
    expect(masteryLevel(5)).toBe(2);
    expect(masteryLevel(6)).toBe(3);
    expect(masteryLevel(7)).toBe(3);
  });
});

describe("identity helpers", () => {
  it("takes the first letter for the avatar", () => {
    expect(avatarLetter("alice")).toBe("A");
    expect(avatarLetter("")).toBe("?");
  });

  it("prefers the full name, falls back to the email local part", () => {
    expect(displayName("user@example.com", "Alice")).toBe("Alice");
    expect(displayName("user@example.com", null)).toBe("user");
    expect(displayName("user@example.com", "  ")).toBe("user");
  });
});

describe("quote rotation", () => {
  it("returns the same quote for the same day", () => {
    const date = new Date("2026-10-02T12:00:00Z");
    expect(quoteOfTheDay(date)).toEqual(quoteOfTheDay(date));
  });

  it("rotates across days deterministically", () => {
    const day1 = quoteOfTheDay(new Date("2026-10-02T00:00:00Z"));
    const day2 = quoteOfTheDay(new Date("2026-10-03T00:00:00Z"));
    expect(day1).not.toEqual(day2);
  });

  it("encouragements cycle per lesson number", () => {
    expect(encouragementFor(1)).toBe(encouragementFor(5));
    expect(encouragementFor(1)).not.toBe(encouragementFor(2));
  });
});

describe("category tags", () => {
  it("carries the reference's eight subject/topic pairs", () => {
    expect(CATEGORY_TAGS).toHaveLength(8);
    expect(CATEGORY_TAGS[0]).toEqual({ subject: "History", topic: "World War II" });
    expect(CATEGORY_TAGS[4]).toEqual({ subject: "Programming", topic: "Python" });
  });
});
