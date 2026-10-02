import { describe, expect, it } from "vitest";

import {
  avatarLetter,
  courseContextLine,
  isCustomSource,
} from "@/lib/domain";

// Session-5 parity pins — the custom-source predicate shared by the m_
// context line and the CoursePill tile icons (the live's `p_` uses the same
// "custom"|"material" membership check for BookOpen vs Sparkles), decoded
// from the live bundle + driven DOM:
//   courseContextLine(subject, source) = "{subject} · Custom material" for
//   custom/material sources (session-4 pin, regression-kept here).
//   avatarLetter = the m_/mobile-menu avatar ("?" for the null-name hub quirk).

describe("isCustomSource (the shared custom-source predicate)", () => {
  it("is true for the material source", () => {
    expect(isCustomSource("material")).toBe(true);
  });

  it("is true for the custom source", () => {
    expect(isCustomSource("custom")).toBe(true);
  });

  it("is false for the topic source", () => {
    expect(isCustomSource("topic")).toBe(false);
  });

  it("is false for null and undefined", () => {
    expect(isCustomSource(null)).toBe(false);
    expect(isCustomSource(undefined)).toBe(false);
  });

  it("is false for an empty string", () => {
    expect(isCustomSource("")).toBe(false);
  });
});

describe("courseContextLine regression (consumes isCustomSource)", () => {
  it("renders the custom-material suffix for material sources", () => {
    expect(courseContextLine("Economics", "material")).toBe(
      "Economics · Custom material",
    );
  });

  it("renders the default suffix for topic sources", () => {
    expect(courseContextLine("Economics", "topic")).toBe("Economics · Default");
  });

  it("renders Default alone for a null subject", () => {
    expect(courseContextLine(null, "topic")).toBe("Default");
  });
});

describe("avatarLetter (the menu avatar character)", () => {
  it("uppercases the first letter", () => {
    expect(avatarLetter("sepnetflix2023")).toBe("S");
  });

  it("returns the question mark for null-ish names (the live hub quirk)", () => {
    expect(avatarLetter("")).toBe("?");
    expect(avatarLetter("   ")).toBe("?");
  });
});
