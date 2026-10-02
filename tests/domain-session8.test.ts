import { describe, expect, it } from "vitest";
import { hubLessonSubject, parsePendingSetup } from "@/lib/domain";

// Session-8 pins — the hub LessonView h2 subject decode + the public
// onboarding's pending_student_setup payload contract.

// S8-F4: the live's hub computes the lesson-view h2 subject as
// ce = (student?.current_subject) || "General" and passes it to Y2 as the
// `subject` prop — the COURSE NAME is deliberately NOT a fallback (a
// student whose current_subject ≠ the active course name still sees the
// student's subject on level 1). The clone's HubCourse.currentSubject is
// exactly the student's current_subject.
describe("hubLessonSubject (S8-F4)", () => {
  it("renders the student's current_subject when present", () => {
    expect(
      hubLessonSubject({ currentSubject: "Economics", courseName: "Economics" }),
    ).toBe("Economics");
  });

  it("falls back to General for a null course (the live's 0-course hub)", () => {
    expect(hubLessonSubject(null)).toBe("General");
  });

  it("falls back to General for a null/blank current_subject — never the course name", () => {
    // The live's `||` semantics: an empty subject renders "General", NOT
    // course.courseName (the deliberate divergence from the session-3
    // courseName fallback that this session removes).
    expect(hubLessonSubject({ currentSubject: null, courseName: "World History" })).toBe("General");
    expect(hubLessonSubject({ currentSubject: "   ", courseName: "World History" })).toBe("General");
  });

  it("prefers the student's subject over the course name in the switched state", () => {
    // The multi-course pin: the student's current_subject is "Economics"
    // while the ACTIVE course is "World History" — the live renders the
    // student's subject.
    expect(
      hubLessonSubject({ currentSubject: "Economics", courseName: "World History" }),
    ).toBe("Economics");
  });
});

// S8-F1: the public onboarding's anonymous Continue stores the form as
// pending_student_setup (sessionStorage, the live's key name) and the
// post-login pickup parses it back. The parser is defensive — the live's
// X2 wraps JSON.parse in a try/catch and the clone's storage seam can hold
// anything.
describe("parsePendingSetup (S8-F1)", () => {
  it("round-trips the stored payload", () => {
    const raw = JSON.stringify({
      mode: "topic",
      topic: "Python programming",
      courseName: "",
      contentText: "",
      name: "Alex Johnson",
    });
    const parsed = parsePendingSetup(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.mode).toBe("topic");
    expect(parsed?.topic).toBe("Python programming");
    expect(parsed?.name).toBe("Alex Johnson");
  });

  it("parses the material mode payload", () => {
    const raw = JSON.stringify({
      mode: "material",
      topic: "",
      courseName: "My History Notes",
      contentText: "Four score and twenty years ago…",
      name: "Alex",
    });
    const parsed = parsePendingSetup(raw);
    expect(parsed?.mode).toBe("material");
    expect(parsed?.courseName).toBe("My History Notes");
    expect(parsed?.contentText).toContain("Four score");
  });

  it("returns null for invalid JSON", () => {
    expect(parsePendingSetup("{not json")).toBeNull();
  });

  it("returns null for non-object JSON", () => {
    expect(parsePendingSetup('"a string"')).toBeNull();
    expect(parsePendingSetup("42")).toBeNull();
    expect(parsePendingSetup("null")).toBeNull();
  });

  it("normalizes an unknown mode to topic and trims the name", () => {
    const raw = JSON.stringify({ mode: "banana", name: "  Alex  " });
    const parsed = parsePendingSetup(raw);
    expect(parsed?.mode).toBe("topic");
    expect(parsed?.name).toBe("Alex");
  });
});
