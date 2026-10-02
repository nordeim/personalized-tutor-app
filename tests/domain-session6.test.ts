import { describe, expect, it } from "vitest";

import { courseSourceLabel, isCustomSource } from "@/lib/domain";

// Session-6 pins — S6-F7: the CO course card's source label. The reference's
// bundle renders `content_source === "custom" ? "Custom Material"
// : "AI-Generated Course"` — custom ONLY (deliberately narrower than
// `isCustomSource`, which the p_ CoursePill icon uses for custom‖material).
// The helper names and pins that intentional predicate split.
describe("courseSourceLabel (S6-F7)", () => {
  it("renders Custom Material for custom sources", () => {
    expect(courseSourceLabel("custom")).toBe("Custom Material");
  });

  it("renders AI-Generated Course for material sources — the label predicate is NOT isCustomSource", () => {
    // The intentional split: the p_ icon treats material as custom-flavored,
    // but the CO card label does not. Pins the divergence from
    // isCustomSource so a future "consolidation" cannot silently change it.
    expect(courseSourceLabel("material")).toBe("AI-Generated Course");
    expect(isCustomSource("material")).toBe(true);
  });

  it("renders AI-Generated Course for topic sources", () => {
    expect(courseSourceLabel("topic")).toBe("AI-Generated Course");
  });

  it("renders AI-Generated Course for null/unknown sources", () => {
    expect(courseSourceLabel(null)).toBe("AI-Generated Course");
    expect(courseSourceLabel("whatever")).toBe("AI-Generated Course");
  });
});
