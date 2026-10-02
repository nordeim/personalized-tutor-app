import { describe, expect, it } from "vitest";
import {
  CATEGORY_TAGS,
  DEFAULT_LESSON_TITLES,
  lessonMeta,
  lessonTitles,
  masteryLevel,
  parseRoadmap,
  quizProgressPercent,
  derivedLessonsCompleted,
  roadmapCurrentStage,
  roadmapStageStatus,
  subjectIconName,
  stageLevelLabel,
  avatarLetter,
  displayName,
} from "@/lib/domain";
import { encouragementFor } from "@/lib/quotes";

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

  it("renders the sheet label with the stage number twice (the live's pattern)", () => {
    // The live mobile sheet prints floor(i/2)+1 for BOTH numbers.
    expect(stageLevelLabel(0)).toBe("Stage 1 · Level 1");
    expect(stageLevelLabel(1)).toBe("Stage 1 · Level 1");
    expect(stageLevelLabel(2)).toBe("Stage 2 · Level 2");
    expect(stageLevelLabel(4)).toBe("Stage 3 · Level 3");
    expect(stageLevelLabel(5)).toBe("Stage 3 · Level 3");
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

describe("lessonTitles — per-stage suffix pairs (the live Kh expansion)", () => {
  it("derives titles with the reference's per-stage suffixes", () => {
    const roadmap = [
      { title: "Foundations of Microeconomics", description: "" },
      { title: "Macroeconomic Principles", description: "" },
      { title: "Global Economic Systems", description: "" },
    ];
    const titles = lessonTitles(roadmap);
    expect(titles[0]).toBe("Foundations of Microeconomics: Basics");
    expect(titles[1]).toBe("Foundations of Microeconomics: In Practice");
    expect(titles[2]).toBe("Macroeconomic Principles: Fundamentals");
    expect(titles[3]).toBe("Macroeconomic Principles: Application");
    expect(titles[4]).toBe("Global Economic Systems: Deep Dive");
    expect(titles[5]).toBe("Global Economic Systems: Mastery");
  });

  it("falls back to the default grid for stages without titles", () => {
    const titles = lessonTitles([{ title: "Foundations", description: "" }]);
    expect(titles[0]).toBe("Foundations: Basics");
    expect(titles[1]).toBe("Foundations: In Practice");
    expect(titles[2]).toBe(DEFAULT_LESSON_TITLES[2]);
  });

  it("falls back to the default grid with an empty roadmap", () => {
    expect(lessonTitles([])).toEqual([...DEFAULT_LESSON_TITLES]);
  });
});

describe("quiz-derived progress (the reference's F24 model)", () => {
  it("computes the course progress percent from the quiz score", () => {
    expect(quizProgressPercent(3, true)).toBe(60); // the demo's 60%
    expect(quizProgressPercent(4, true)).toBe(80); // the seeded course
    expect(quizProgressPercent(5, true)).toBe(100);
    expect(quizProgressPercent(0, true)).toBe(0);
    // the live prints 140% for score 7 (no clamp) — the clone clamps.
    expect(quizProgressPercent(7, true)).toBe(100);
    // uncompleted quizzes read as zero progress.
    expect(quizProgressPercent(4, false)).toBe(0);
    expect(quizProgressPercent(null, true)).toBe(0);
  });

  it("derives the lessons-completed count from the percent", () => {
    expect(derivedLessonsCompleted(60)).toBe(4); // the demo's 4/6
    expect(derivedLessonsCompleted(80)).toBe(5); // round(4.8) = 5
    expect(derivedLessonsCompleted(100)).toBe(6);
    expect(derivedLessonsCompleted(0)).toBe(0);
    expect(derivedLessonsCompleted(50)).toBe(3);
  });

  it("keys the roadmap stage statuses off the derived count", () => {
    expect(roadmapCurrentStage(4)).toBe(2); // demo: stage 3 (0-based 2) in progress
    expect(roadmapCurrentStage(0)).toBe(0);
    expect(roadmapCurrentStage(5)).toBe(2);
    expect(roadmapCurrentStage(6)).toBe(3); // all done → past the last stage

    // demo state ($ = 4, current = 2): stages 0/1 done, stage 2 in progress
    expect(roadmapStageStatus(0, 2)).toBe("done");
    expect(roadmapStageStatus(1, 2)).toBe("done");
    expect(roadmapStageStatus(2, 2)).toBe("in-progress");
    // fresh course: stage 0 is the current one
    expect(roadmapStageStatus(0, 0)).toBe("in-progress");
    expect(roadmapStageStatus(1, 0)).toBe("upcoming");
    expect(roadmapStageStatus(2, 0)).toBe("upcoming");
    // finished course: everything done
    expect(roadmapStageStatus(2, 3)).toBe("done");
  });
});

describe("subject icon mapper (the courses card's keyword buckets)", () => {
  it("maps course names onto lucide subject icons", () => {
    expect(subjectIconName("Calculus", "financial_education")).toBe("Calculator");
    expect(subjectIconName("Genetics", "financial_education")).toBe("Leaf");
    expect(subjectIconName("Quantum Physics", "financial_education")).toBe("Atom");
    expect(subjectIconName("World War II", "financial_education")).toBe("Landmark");
    expect(subjectIconName("Social Psychology", "financial_education")).toBe("Brain");
    expect(subjectIconName("Microeconomics", "financial_education")).toBe("ChartColumnIncreasing");
    expect(subjectIconName("Personal Finance", "financial_education")).toBe("ChartColumnIncreasing");
    expect(subjectIconName("Python Programming", "financial_education")).toBe("Cpu");
    expect(subjectIconName("Music Theory", "financial_education")).toBe("Music");
    expect(subjectIconName("Visual Design", "financial_education")).toBe("Palette");
    expect(subjectIconName("Ethics", "financial_education")).toBe("Scale");
    expect(subjectIconName("Digital Marketing", "financial_education")).toBe("Megaphone");
    expect(subjectIconName("World Geography", "financial_education")).toBe("Globe");
    expect(subjectIconName("Whatever Else", "financial_education")).toBe("BookOpen");
  });

  it("routes custom material to the book", () => {
    expect(subjectIconName("My Notes", "custom")).toBe("BookOpen");
    expect(subjectIconName(null, null)).toBe("BookOpen");
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

describe("encouragement picks (the 99-line pool lives in tests/parity-session2.test.ts)", () => {
  it("encouragements are deterministic per lesson number", () => {
    expect(encouragementFor(1)).toBe(encouragementFor(51));
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
