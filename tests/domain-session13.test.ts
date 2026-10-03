import { describe, expect, it } from "vitest";
import { isStageObject, parseRoadmap } from "@/lib/domain";

// Session-13 R2 — the dual-shape roadmap contract (S13-F5): the live stores
// the submit-time LLM answer as a STRING array (`"Step 1: Core Foundations —
// build the base"`) while the generate-time flow stores objects — and the
// live's renderers (the roadmap card's name/label mapper + the Kh lesson-title
// expansion) handle BOTH. The clone's parseRoadmap filtered strings out (a
// live-shaped roadmap parsed to [] → the static fallback). These pins
// replicate the live's exact split semantics:
//   strip /^(Lesson|Step)\s*\d+[:\.\-\s]*/i, then split on " — " (title
//   before, description after), else split on ": " when the index < 40,
//   else the whole string with "".
describe("parseRoadmap — the dual-shape contract (S13-F5)", () => {
  it("maps a string step with an em-dash split", () => {
    const road = parseRoadmap(
      JSON.stringify(["Step 1: Core Foundations — build the base"]),
    );
    expect(road).toEqual([
      { title: "Core Foundations", description: "build the base" },
    ]);
  });

  it("maps a string step with a colon split (index < 40)", () => {
    const road = parseRoadmap(JSON.stringify(["Step 2: Reading: strategies"]));
    expect(road).toEqual([{ title: "Reading", description: "strategies" }]);
  });

  it("maps a bare string step (no separators) to title + empty description", () => {
    const road = parseRoadmap(JSON.stringify(["Step 3: Plain title"]));
    expect(road).toEqual([{ title: "Plain title", description: "" }]);
  });

  it("keeps a late colon (> 40 chars) as the whole title (the card's G < 40 rule)", () => {
    const long =
      "A very long stage title that goes on and on and on until a colon: late";
    const road = parseRoadmap(JSON.stringify([long]));
    expect(road).toEqual([{ title: long, description: "" }]);
  });

  it("strips the Lesson prefix too (Kh's broader regex)", () => {
    const road = parseRoadmap(JSON.stringify(["Lesson 4: Applied Topic"]));
    expect(road).toEqual([{ title: "Applied Topic", description: "" }]);
  });

  it("parses mixed arrays (objects + strings) in order", () => {
    const road = parseRoadmap(
      JSON.stringify([
        { title: "Object Stage", description: "kept" },
        "Step 2: String Stage — mapped",
      ]),
    );
    expect(road).toEqual([
      { title: "Object Stage", description: "kept" },
      { title: "String Stage", description: "mapped" },
    ]);
  });

  it("keeps the object-only behavior (backward compatible)", () => {
    const road = parseRoadmap(
      JSON.stringify([
        { title: "A", description: "a" },
        { title: "B", description: "b" },
      ]),
    );
    expect(road).toHaveLength(2);
    expect(road[0]).toEqual({ title: "A", description: "a" });
  });

  it("caps at 3 stages (the existing slice, both shapes)", () => {
    const road = parseRoadmap(
      JSON.stringify(["Step 1: A", "Step 2: B", "Step 3: C", "Step 4: D"]),
    );
    expect(road).toHaveLength(3);
  });
});

// S14-F3: the shared OBJECT-arm predicate — one guard consumed by BOTH
// parseRoadmap's object branch and the AI seam's dual-shape element
// validator (the two sites hand-rolled the identical check before the
// extraction). These pins pin the guard itself.
describe("isStageObject — the dual-shape OBJECT arm (S14-F3)", () => {
  it("accepts a title-bearing object (description optional)", () => {
    expect(isStageObject({ title: "A", description: "a" })).toBe(true);
    expect(isStageObject({ title: "A" })).toBe(true);
  });

  it("rejects null, arrays, primitives, and title-less objects", () => {
    expect(isStageObject(null)).toBe(false);
    expect(isStageObject(undefined)).toBe(false);
    expect(isStageObject("Step 1: A")).toBe(false);
    expect(isStageObject(3)).toBe(false);
    expect(isStageObject(["A"])).toBe(false);
    expect(isStageObject({ description: "no title" })).toBe(false);
    expect(isStageObject({ title: 42 })).toBe(false);
  });
});
