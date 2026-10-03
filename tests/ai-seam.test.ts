import { describe, expect, it, vi, beforeEach } from "vitest";

// The AI seam's LLM transport, mocked: every `complete()` call answers with
// `reply.current` (null = SDK failure → the fallback path). vi.hoisted keeps
// the mutable holders available to the hoisted mock factory.
const reply = vi.hoisted(() => ({ current: "__UNSET__" as string | null }));
// S14-F1: the transport's REQUESTS, captured — the mocked
// `completions.create(req)` receives `req.messages` (the user prompt LAST —
// `complete()` appends it after the optional system message), so recording
// the final message's content pins each generator's PROMPT verbatim (the
// R1 contract the session-13 vacuous test never observed).
const prompts = vi.hoisted(() => [] as string[]);

vi.mock("z-ai-web-dev-sdk", () => ({
  default: {
    create: async () => ({
      chat: {
        completions: {
          create: async (req: unknown) => {
            const messages = (req as { messages?: { content?: string }[] })
              ?.messages;
            prompts.push(
              Array.isArray(messages)
                ? (messages[messages.length - 1]?.content ?? "")
                : "",
            );
            return {
              choices:
                reply.current === null || reply.current === "__UNSET__"
                  ? []
                  : [{ message: { content: reply.current } }],
            };
          },
        },
      },
    }),
  },
}));

import { generateCourseStages } from "@/lib/ai";

// Session-13 R0/R1: the roadmap generator's prompt split (the generate-time
// OBJECT schema vs the submit-time STRING schema — the live's decoded
// contract) and the wrapper-response parsing (the {steps: [...]} object, the
// bare array, AND the malformed shapes that must DEGRADE, never crash —
// S13-F1's 500 was an invariant violation).
describe("generateCourseStages — the response-shape contract (S13-F1/F5)", () => {
  beforeEach(() => {
    reply.current = "__UNSET__";
    prompts.length = 0;
  });

  it("parses the {steps: [objects]} wrapper (the generate-time shape)", async () => {
    reply.current = JSON.stringify({
      steps: [
        { title: "Foundations", description: "The base." },
        { title: "Application", description: "The practice." },
        { title: "Mastery", description: "The peak." },
      ],
    });
    const { stages, aiGenerated } = await generateCourseStages("Botany");
    expect(aiGenerated).toBe(true);
    expect(stages).toHaveLength(3);
  });

  it("parses the bare object array (the legacy shape)", async () => {
    reply.current = JSON.stringify([
      { title: "Foundations", description: "The base." },
      { title: "Application", description: "The practice." },
      { title: "Mastery", description: "The peak." },
    ]);
    const { stages, aiGenerated } = await generateCourseStages("Botany");
    expect(aiGenerated).toBe(true);
    expect(stages).toHaveLength(3);
  });

  it("parses the {steps: [strings]} wrapper (the live's submit-time schema)", async () => {
    reply.current = JSON.stringify({
      steps: [
        "Step 1: Core Foundations — build the base",
        "Step 2: Build & Apply",
        "Step 3: Master & Synthesize",
      ],
    });
    const { stages, aiGenerated } = await generateCourseStages("Botany", { pct: 40 });
    expect(aiGenerated).toBe(true);
    expect(stages).toHaveLength(3);
  });

  it("parses the bare string array (the submit-time legacy shape)", async () => {
    reply.current = JSON.stringify(["A — one", "B — two", "C — three"]);
    const { stages, aiGenerated } = await generateCourseStages("Botany", { pct: 40 });
    expect(aiGenerated).toBe(true);
    expect(stages).toHaveLength(3);
  });

  // S13-F1's exact crash: a lazy string reply must DEGRADE, never throw.
  it("degrades (never crashes) on a string-valued steps", async () => {
    reply.current = JSON.stringify({
      steps: "Foundation, Application, Mastery",
    });
    const { stages, aiGenerated } = await generateCourseStages("Botany");
    expect(aiGenerated).toBe(false);
    expect(stages).toHaveLength(3); // the static fallback
  });

  it("degrades on an empty steps array", async () => {
    reply.current = JSON.stringify({ steps: [] });
    const { stages, aiGenerated } = await generateCourseStages("Botany");
    expect(aiGenerated).toBe(false);
    expect(stages).toHaveLength(3);
  });

  it("degrades on a null/absent reply (SDK failure)", async () => {
    reply.current = null;
    const { stages, aiGenerated } = await generateCourseStages("Botany");
    expect(aiGenerated).toBe(false);
    expect(stages).toHaveLength(3);
  });

  it("degrades on a two-step answer (the >= 3 gate)", async () => {
    reply.current = JSON.stringify({
      steps: ["Step 1: Only", "Step 2: Two"],
    });
    const { aiGenerated } = await generateCourseStages("Botany", { pct: 60 });
    expect(aiGenerated).toBe(false);
  });
});

describe("generateCourseStages — the prompt split (S13-F5/F8, verbatim parity)", () => {
  beforeEach(() => {
    reply.current = "__UNSET__";
    prompts.length = 0;
  });

  // S14-F1: the session-13 version of this test was VACUOUS
  // (`expect(true).toBe(true)` — "the mock's call history is not directly
  // exposed" was wrong: the mocked `completions.create(req)` receives
  // `req.messages`). These pins assert each branch's prompt VERBATIM — a
  // regression that collapses the split back onto either single schema
  // fails (a)/(b) and the bidirectional negatives (d) immediately.
  it("generate-time (no pct): the stages wording + the verbatim OBJECT schema tail", async () => {
    reply.current = JSON.stringify({
      steps: [
        { title: "Foundations", description: "The base." },
        { title: "Application", description: "The practice." },
        { title: "Mastery", description: "The peak." },
      ],
    });
    await generateCourseStages("Botany");
    expect(prompts).toHaveLength(1);
    const prompt = prompts[0];
    expect(prompt).toContain('Create exactly 3 progressive learning stages for the course "Botany".');
    // S13-F8: the live's verbatim object tail — "2-3 sentence description."
    expect(prompt).toContain(
      'Return JSON: { "steps": [{ "title": "Stage title", "description": "2-3 sentence description." }] }',
    );
    // bidirectional: the generate branch must NOT carry the string schema
    expect(prompt).not.toContain('"steps": ["Step 1:');
  });

  it("submit-time (pct present): the focus-areas wording + the verbatim STRING schema tail", async () => {
    reply.current = JSON.stringify({
      steps: ["Step 1: A", "Step 2: B", "Step 3: C"],
    });
    await generateCourseStages("Botany", { pct: 60 });
    expect(prompts).toHaveLength(1);
    const prompt = prompts[0];
    expect(prompt).toContain("Based on someone scoring 60% on a diagnostic quiz about Botany");
    expect(prompt).toContain(
      'Return JSON: { "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."] }',
    );
    // bidirectional: the submit branch must NOT carry the object schema
    expect(prompt).not.toContain('"2-3 sentence description."');
  });

  it("submit-time + material: the subject swaps to the uploaded-material wording", async () => {
    reply.current = JSON.stringify({
      steps: ["Step 1: A", "Step 2: B", "Step 3: C"],
    });
    await generateCourseStages("Botany", { pct: 60, material: "  chapter 1 notes  " });
    const prompt = prompts[0];
    expect(prompt).toContain("Based on someone scoring 60% on a diagnostic quiz about their uploaded material");
    expect(prompt).toContain('"Custom Material"');
    expect(prompt).not.toContain("diagnostic quiz about Botany");
  });

  it("keeps the submit-time string schema when pct is present (round-trip)", async () => {
    reply.current = JSON.stringify({
      steps: ["Step 1: A", "Step 2: B", "Step 3: C"],
    });
    const { stages, aiGenerated } = await generateCourseStages("Botany", { pct: 40 });
    expect(aiGenerated).toBe(true);
    // The raw steps round-trip: the submit branch returns the LLM's own
    // string answers (the live stores them verbatim).
    expect(stages.every((s) => typeof s === "string")).toBe(true);
  });

  it("keeps the generate-time object shape (round-trip)", async () => {
    reply.current = JSON.stringify({
      steps: [
        { title: "Foundations", description: "The base." },
        { title: "Application", description: "The practice." },
        { title: "Mastery", description: "The peak." },
      ],
    });
    const { stages } = await generateCourseStages("Botany");
    expect(stages.every((s) => typeof s === "object")).toBe(true);
  });
});
