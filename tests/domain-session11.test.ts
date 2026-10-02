import { describe, expect, it } from "vitest";
import {
  diagnosticScore,
  headerOrigin,
  quizDotState,
  quizMarkerPct,
} from "@/lib/domain";

// Session-11 pins — the diagnostic-quiz surface decoded from the live bundle
// (E3 + wO, index-CkEI9gsZ.js).

describe("diagnosticScore — the live's client-side correct count (S11-F2)", () => {
  it("(a) counts every correct pick", () => {
    expect(diagnosticScore([0, 1, 2, 3, 0], [0, 1, 2, 3, 0])).toBe(5);
  });

  it("(b) one wrong pick scores length-1", () => {
    expect(diagnosticScore([0, 1, 0, 3, 0], [0, 1, 2, 3, 0])).toBe(4);
  });

  it("(c) unanswered (-1) entries never count", () => {
    expect(diagnosticScore([-1, -1, -1, -1, -1], [0, 1, 2, 3, 0])).toBe(0);
  });

  it("(d) mismatched lengths count the overlap", () => {
    expect(diagnosticScore([0, 1], [0, 1, 2, 3, 0])).toBe(2);
  });

  it("(e) empty → 0", () => {
    expect(diagnosticScore([], [])).toBe(0);
  });
});

describe("quizMarkerPct — the star/fill position (S11-F1.3)", () => {
  it("(a) first of five → 20", () => {
    expect(quizMarkerPct(0, 5)).toBe(20);
  });

  it("(b) last of five → 100", () => {
    expect(quizMarkerPct(4, 5)).toBe(100);
  });

  it("(c) single question → 100", () => {
    expect(quizMarkerPct(0, 1)).toBe(100);
  });

  it("(d) total 0 → 0 (guard)", () => {
    expect(quizMarkerPct(0, 0)).toBe(0);
  });
});

describe("quizDotState — the dot strip (S11-F1.8)", () => {
  it("(a) the active dot: 24px, yellow", () => {
    expect(quizDotState(2, 2)).toEqual({ w: 24, bg: "#FFFD73" });
  });

  it("(b) a done dot: 6px, #C0C0C0", () => {
    expect(quizDotState(1, 2)).toEqual({ w: 6, bg: "#C0C0C0" });
  });

  it("(c) a future dot: 6px, #4A4A4A", () => {
    expect(quizDotState(3, 2)).toEqual({ w: 6, bg: "#4A4A4A" });
  });
});

describe("headerOrigin — the login page's origin construction (S11-F8)", () => {
  it("(a) https proto → https origin", () => {
    expect(headerOrigin("a.com", "https")).toBe("https://a.com");
  });

  it("(b) http proto → http origin", () => {
    expect(headerOrigin("a.com", "http")).toBe("http://a.com");
  });

  it("(c) a comma-list proto takes the first token", () => {
    expect(headerOrigin("a.com", "https,http")).toBe("https://a.com");
  });

  it("(d) no proto defaults to https", () => {
    expect(headerOrigin("a.com", null)).toBe("https://a.com");
  });

  it("(e) empty host → empty origin", () => {
    expect(headerOrigin("", "https")).toBe("");
  });
});
