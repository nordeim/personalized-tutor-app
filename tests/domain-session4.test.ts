import { describe, expect, it } from "vitest";

import {
  ADD_COURSE_TAGS,
  CATEGORY_TAGS,
  courseContextLine,
  tagTopic,
} from "@/lib/domain";

// Session-4 parity pins — the reference's Q5 "Add a Course" modal and the m_
// user-dropdown header, decoded from the live bundle + driven DOM:
//   Q5 quick tags = a 6-entry subset of the onboarding chips, single-label
//   pills whose click sets the topic to "Subject: Sub".
//   m_ header context line = "{current_subject} · Default" (or "· Custom
//   material" when the student's content_source is custom).

describe("ADD_COURSE_TAGS (the Q5 modal's quick-tag list)", () => {
  it("is the reference's exact 6-pair list, order included", () => {
    expect(ADD_COURSE_TAGS.map((t) => [t.subject, t.sub])).toEqual([
      ["History", "World War II"],
      ["Economics", "Microeconomics"],
      ["Psychology", "Social Psychology"],
      ["Math", "Calculus"],
      ["Programming", "Python"],
      ["Biology", "Genetics"],
    ]);
  });

  it("is a subset of the onboarding category chips (same subject labels)", () => {
    const onboarding = new Set(CATEGORY_TAGS.map((t) => `${t.subject}`));
    for (const tag of ADD_COURSE_TAGS) {
      expect(onboarding.has(tag.subject)).toBe(true);
    }
  });
});

describe("tagTopic (the tag-click topic format)", () => {
  it("formats as 'Subject: Sub' exactly like the reference's onClick", () => {
    expect(tagTopic("History", "World War II")).toBe("History: World War II");
    expect(tagTopic("Programming", "Python")).toBe("Programming: Python");
  });
});

describe("courseContextLine (the m_ user-dropdown header line)", () => {
  it("renders '{subject} · Default' for the default content source", () => {
    expect(courseContextLine("Economics", "financial_education")).toBe(
      "Economics · Default",
    );
  });

  it("renders '{subject} · Custom material' for custom material", () => {
    expect(courseContextLine("My Notes", "custom")).toBe("My Notes · Custom material");
    expect(courseContextLine("My Notes", "material")).toBe("My Notes · Custom material");
  });

  it("renders 'Default' alone when the subject is missing (guest/null)", () => {
    expect(courseContextLine(null, "financial_education")).toBe("Default");
    expect(courseContextLine(undefined, undefined)).toBe("Default");
  });
});
