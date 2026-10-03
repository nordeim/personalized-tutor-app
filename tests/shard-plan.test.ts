import { describe, expect, it } from "vitest";

import {
  AI_ROUTE_PATTERN,
  AI_WEIGHT_SECONDS,
  countSpecSignals,
  planShards,
  specWeight,
} from "./e2e/shard-plan";

// SESSION-19 (S19-F2) — the pins for the balanced-shard plan derivation.
// The module is PURE (strings + numbers in, file groups out — no I/O), so
// every property below is pinned on synthetic inputs. The wrapper
// (scripts/e2e-sharded.mjs) feeds it playwright's own --list enumeration
// plus the spec sources; these pins hold it to the contract.

describe("specWeight (the cost model)", () => {
  it("weights each AI-route mention at the 45s slow-regime budget plus the test ballast", () => {
    // 45 = AI_TIMEOUT_MS / 1000 (src/lib/ai.ts) — the documented slow-LLM
    // per-call budget; the ballast term keeps non-AI files balanced too.
    expect(AI_WEIGHT_SECONDS).toBe(45);
    expect(specWeight({ file: "a.spec.ts", tests: 4, aiMentions: 8 })).toBe(8 * 45 + 4);
    expect(specWeight({ file: "b.spec.ts", tests: 12, aiMentions: 0 })).toBe(12);
    expect(specWeight({ file: "c.spec.ts", tests: 0, aiMentions: 0 })).toBe(0);
  });
});

describe("countSpecSignals (the static spec scanner)", () => {
  it("counts top-level test() declarations but NOT test.describe(", () => {
    const src = [
      "test.describe(\"group\", () => {", // NOT a test
      "  test(\"inner\", async ({ page }) => {});", // counts
      "});",
      "test(\"top\", async ({ page }) => {});", // counts
    ].join("\n");
    const { tests, aiMentions } = countSpecSignals(src);
    expect(tests).toBe(2);
    expect(aiMentions).toBe(0);
  });

  it("counts AI-route path mentions across request calls and flow comments", () => {
    const src = [
      "await page.request.post(\"/api/courses/generate\", { data: {} });",
      "// drives /api/quiz/generate on mount",
      "expect(route).toBe(\"/api/chat\");",
      "await request.post(\"/api/quiz/submit\");",
      "page.goto(\"/hub\");", // a UI mount, NOT a route mention
    ].join("\n");
    const { aiMentions } = countSpecSignals(src);
    expect(aiMentions).toBe(4);
  });

  it("matches exactly the six AI-backed routes the conventions scanner knows", () => {
    const routes = [
      "/api/courses/generate",
      "/api/quiz/generate",
      "/api/quiz/submit",
      "/api/quiz/skip",
      "/api/chat",
      "/api/challenge",
      "/api/lessons/content",
    ];
    expect(routes.filter((r) => AI_ROUTE_PATTERN.test(r))).toHaveLength(7);
    // non-AI routes never match
    for (const r of ["/api/student", "/api/courses", "/api/health", "/api/auth/login"]) {
      expect(AI_ROUTE_PATTERN.test(r)).toBe(false);
    }
  });
});

describe("planShards (the LPT assignment)", () => {
  it("places every input file in exactly one output group", () => {
    const files = [
      { file: "a.spec.ts", tests: 6, aiMentions: 3 },
      { file: "b.spec.ts", tests: 12, aiMentions: 0 },
      { file: "c.spec.ts", tests: 4, aiMentions: 8 },
      { file: "d.spec.ts", tests: 5, aiMentions: 5 },
      { file: "e.spec.ts", tests: 11, aiMentions: 0 },
    ];
    const groups = planShards(files, 3);
    expect(groups).toHaveLength(3);
    const all = groups.flat();
    expect(all.sort()).toEqual(files.map((f) => f.file).sort());
    // no duplicates
    expect(new Set(all).size).toBe(all.length);
  });

  it("balances heavy files across shards (the LPT property)", () => {
    // weights: A=100, B=90, C=80, D=10 → LPT lands A+D (110) vs B+C (170),
    // NOT the naive A+B (190) vs C+D (90) — the heaviest file pairs with
    // the lightest as greedy bin-packing dictates.
    const files = [
      { file: "a.spec.ts", tests: 10, aiMentions: 2 }, // 100
      { file: "b.spec.ts", tests: 90, aiMentions: 0 }, // 90
      { file: "c.spec.ts", tests: 80, aiMentions: 0 }, // 80
      { file: "d.spec.ts", tests: 10, aiMentions: 0 }, // 10
    ];
    const groups = planShards(files, 2);
    const weights = groups.map((g) =>
      g.reduce((sum, f) => {
        const spec = files.find((x) => x.file === f)!;
        return sum + specWeight(spec);
      }, 0),
    );
    expect(Math.max(...weights) / Math.min(...weights)).toBeLessThan(190 / 90);
    expect(groups.some((g) => g.includes("a.spec.ts") && g.includes("d.spec.ts"))).toBe(true);
  });

  it("is deterministic — ties break weight-desc, then name-asc, then lowest shard index", () => {
    const files = [
      { file: "m.spec.ts", tests: 5, aiMentions: 5 },
      { file: "k.spec.ts", tests: 5, aiMentions: 5 },
      { file: "z.spec.ts", tests: 1, aiMentions: 0 },
    ];
    expect(planShards(files, 2)).toEqual(planShards(files, 2));
    // the equal-weight pair spreads across shards (the lighter-shard rule),
    // and the name-asc sort puts k first — so k is planned before m
    const groups = planShards(files, 2);
    const kGroup = groups.find((g) => g.includes("k.spec.ts"));
    const mGroup = groups.find((g) => g.includes("m.spec.ts"));
    expect(kGroup).toBeDefined();
    expect(mGroup).toBeDefined();
    expect(kGroup).not.toBe(mGroup); // different shards (array identity)
  });

  it("produces a spec-only file list (auth.setup.ts is the wrapper's job, never planned)", () => {
    const files = [{ file: "auth.setup.ts", tests: 1, aiMentions: 0 }];
    const groups = planShards(files, 2);
    // a setup-only inventory still plans without throwing — the wrapper
    // prepends the setup file to every shard regardless
    expect(groups.flat()).toEqual(["auth.setup.ts"]);
  });

  it("allows an empty group when there are fewer files than shards", () => {
    const files = [{ file: "a.spec.ts", tests: 3, aiMentions: 1 }];
    const groups = planShards(files, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual(["a.spec.ts"]);
    expect(groups[1]).toEqual([]);
  });

  it("throws on a shard count below 2 (one shard IS the serial mode)", () => {
    const files = [{ file: "a.spec.ts", tests: 1, aiMentions: 0 }];
    expect(() => planShards(files, 1)).toThrow(/count/);
    expect(() => planShards(files, 0)).toThrow(/count/);
  });

  it("throws on an empty file inventory (a caller bug, not a plan state)", () => {
    expect(() => planShards([], 3)).toThrow(/file/i);
  });
});
