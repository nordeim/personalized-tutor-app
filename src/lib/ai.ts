import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import {
  DEFAULT_LESSON_TITLES,
  isStageObject,
  LESSONS_PER_COURSE,
  QUESTIONS_PER_LESSON,
  STAGES_PER_COURSE,
} from "@/lib/domain";

// AI seam (server-only): wraps z-ai-web-dev-sdk chat completions with the
// reference app's InvokeLLM prompts. Every generator degrades to a static
// fallback when the SDK is unavailable (no credentials / offline sandbox) —
// the clone doctrine: honest fallback beats a broken flow, and the UI shows
// an explanatory note when AI is degraded.

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type LessonQuestion = QuizQuestion & {
  /** "video" renders the shimmer placeholder + caption; "text" the reading card. */
  contentType: "video" | "text";
  /** Video caption label, or the reading card's paragraphs (split on newlines). */
  contentText: string;
};

export type LessonContent = {
  /** The 3-5 word level title (the h2 for levels 2 and 3). */
  title: string;
  /** 1-2 sentence core idea — the Level-1 "Core Concept" card. */
  concept: string;
  /** 1-sentence real-world scenario — the Level-2 card (empty elsewhere). */
  scenario: string;
  /** Deep mastery challenge intro — the Level-3 card (empty elsewhere). */
  challenge: string;
  questions: LessonQuestion[];
  aiGenerated: boolean;
};

// The per-call budget every generator races against. EXPORTED (session-23,
// S23-F1): the test infrastructure's budget family pins against the actual
// value (tests/ai-budget.test.ts — the shard-plan weight mirror + the
// trap-39 headroom invariant); a comment claiming they match pins nothing
// (trap 47's doctrine).
export const AI_TIMEOUT_MS = 45_000;

async function complete(prompt: string, system?: string): Promise<string | null> {
  try {
    const zai = await ZAI.create();
    const messages = [
      ...(system ? [{ role: "assistant" as const, content: system }] : []),
      { role: "user" as const, content: prompt },
    ];
    const response = await Promise.race([
      zai.chat.completions.create({
        messages,
        stream: false,
        thinking: { type: "disabled" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), AI_TIMEOUT_MS),
      ),
    ]);
    return response.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/** Extract the first JSON array/object embedded in an LLM reply. */
function extractJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start < 0) return null;
  const opener = cleaned[start];
  const closer = opener === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(closer);
  if (end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* 1. Roadmap — "Create exactly 3 progressive learning stages"          */
/* ------------------------------------------------------------------ */

export type StageDraft = { title: string; description: string };

/** A roadmap step as the LLM answered it: the generate-time OBJECT shape
 * ({title, description}) or the submit-time STRING shape ("Step 1: Title —
 * desc"). The routes store whichever arrived verbatim (the live's contract:
 * `roadmap_steps: JSON.stringify(steps)`); `parseRoadmap` maps both. */
export type RawStage = string | StageDraft;

export async function generateCourseStages(
  courseName: string,
  opts?: { pct?: number; material?: string | null },
): Promise<{ stages: RawStage[]; aiGenerated: boolean }> {
  // S12-F4 + S13-F5: the live carries THREE distinct roadmap prompts — the
  // GENERATE-time shape (G5's empty-roadmap effect, the onboarding/create
  // path: "Create exactly 3 progressive learning stages for the course…",
  // course name only, NO material context, OBJECT response schema) and the
  // SUBMIT-time shape (E3, pct-aware: "Based on someone scoring {pct}%…
  // create exactly 3 progressive learning focus areas… (one per arena
  // level)", material-aware, STRING response schema — the live's
  // response_json_schema is an array of strings and its own writers store
  // them verbatim). The THIRD (the skip-time variant the live's wO onSkip
  // fires) is DISCARDED by the live's own code — its LLM result is computed
  // and never used — so the clone skips the wasted call (the fix-and-pin
  // doctrine). The session-11 port collapsed the first two onto the submit
  // wording; the session-12 split restored the bodies; the session-13 pass
  // restored each branch's RESPONSE schema to the decode.
  const hasMaterial = !!opts?.material && opts.material.trim().length > 0;
  const prompt =
    typeof opts?.pct === "number"
      ? `Based on someone scoring ${opts.pct}% on a diagnostic quiz about ${
          hasMaterial ? "their uploaded material" : courseName
        }, create exactly 3 progressive learning focus areas for the subject "${hasMaterial ? "Custom Material" : courseName}" (one per arena level). ` +
        `Return JSON: { "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."] }`
      : `Create exactly 3 progressive learning stages for the course "${courseName}". ` +
        `Each stage needs a short title (2-3 words) and a description (2-3 sentences explaining what the student will learn in this stage). ` +
        `Return JSON: { "steps": [{ "title": "Stage title", "description": "2-3 sentence description." }] }`;
  const raw = await complete(prompt);
  // The live's response_json_schema wraps the array in { "steps": [...] } —
  // the LLM may answer with the wrapper object OR a bare array; accept both.
  // S13-F1: `parsed?.steps` must be ARRAY-checked — a lazy string reply
  // (`{"steps": "Foundation, …"}`) passes `.length >= 3` and then crashes
  // `.every` (a 500 from the route — the "AI may degrade, never fail"
  // invariant violation). The sibling quiz parser already applied this
  // check; the stages parser now mirrors it.
  const parsed = extractJson<RawStage[] | { steps?: RawStage[] }>(raw);
  const stages = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.steps)
      ? parsed.steps
      : null;
  if (
    stages &&
    stages.length >= STAGES_PER_COURSE &&
    stages.every((s) => {
      if (typeof s === "string") return s.trim().length > 0;
      return isStageObject(s);
    })
  ) {
    return { stages: stages.slice(0, STAGES_PER_COURSE), aiGenerated: true };
  }
  return {
    stages: fallbackStages(courseName),
    aiGenerated: false,
  };
}

function fallbackStages(courseName: string): StageDraft[] {
  return [
    {
      title: "Foundations",
      description: `Build a solid base in ${courseName} by learning the core concepts, essential terminology, and the fundamental principles that everything else builds upon.`,
    },
    {
      title: "Application",
      description: `Apply what you learned through worked examples, practical exercises, and real-world scenarios that deepen your understanding of ${courseName}.`,
    },
    {
      title: "Mastery",
      description: `Consolidate and extend your knowledge of ${courseName} with advanced material, edge cases, and synthesis across everything covered so far.`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* 2. Diagnostic quiz — 5 questions, 4 options each (S11-F4: the live's  */
/*    E3 asks for "exactly 5" — 2 easy, 2 medium, 1 harder, ≤ 20 words, */
/*    with a custom-material context variant)                           */
/* ------------------------------------------------------------------ */

export async function generateDiagnosticQuiz(
  subject: string,
  material?: string | null,
): Promise<{ questions: QuizQuestion[]; aiGenerated: boolean }> {
  // The live's O() preamble: the material rides when the enrollment is
  // custom-sourced, otherwise the topic line (bundle: E3's O async).
  const context =
    material && material.trim().length > 0
      ? `The learner has provided this material to study:\n\n${material.slice(0, 3000)}`
      : `The topic is: ${subject}.`;
  const raw = await complete(
    `Generate exactly 5 diagnostic multiple-choice questions for an adult learner.\n${context}\n\n` +
      `Requirements:\n- Questions should assess baseline knowledge across different areas of the topic\n` +
      `- Each question should have exactly 4 answer options\n- Vary difficulty (2 easy, 2 medium, 1 harder)\n` +
      `- Keep question text concise (max 20 words)\n\n` +
      `Return JSON with a "questions" array of 5 objects, each with:\n` +
      `- "q": question text\n- "opts": array of 4 strings\n- "ans": index (0-3) of the correct answer`,
  );
  // The LLM returns the live's {q, opts, ans} field names inside either a
  // bare array or the live's {questions: [...]} wrapper (its
  // response_json_schema) — accept BOTH, plus the clone's historical
  // {question, options, correctIndex} (the validation gate is identical).
  const rawParsed = extractJson<
    | Array<QuizQuestion | { q: string; opts: string[]; ans: number }>
    | { questions: Array<QuizQuestion | { q: string; opts: string[]; ans: number }> }
  >(raw);
  const rawList = Array.isArray(rawParsed)
    ? rawParsed
    : rawParsed && Array.isArray(rawParsed.questions)
      ? rawParsed.questions
      : null;
  const parsed = rawList
    ? rawList.map((item) =>
        "question" in item
          ? (item as QuizQuestion)
          : {
              question: item.q,
              options: item.opts,
              correctIndex: item.ans,
            },
      )
    : null;
  if (
    parsed &&
    parsed.length === 5 &&
    parsed.every(
      (q) =>
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3,
    )
  ) {
    return { questions: parsed, aiGenerated: true };
  }
  return { questions: fallbackQuiz(subject), aiGenerated: false };
}

function fallbackQuiz(subject: string): QuizQuestion[] {
  const mk = (question: string, options: string[], correctIndex: number): QuizQuestion => ({
    question,
    options,
    correctIndex,
  });
  return [
    mk(`Which best describes the scope of ${subject}?`, [
      `A narrow technical specialty within ${subject}`,
      `A broad field with foundational principles and applications`,
      `A single method used in ${subject}`,
      `A historical period only`,
    ], 1),
    mk(`When first approaching ${subject}, the most effective study strategy is to:`, [
      "Memorize advanced material before basics",
      "Master core concepts before progressing",
      "Skip practice until theory is complete",
      "Avoid connecting ideas across topics",
    ], 1),
    mk(`Which skill most directly supports learning ${subject}?`, [
      "Isolating facts from context",
      "Connecting new information to prior knowledge",
      "Studying only right before assessments",
      "Avoiding questions until fully certain",
    ], 1),
    mk(`A learner who explains ${subject} concepts in their own words is demonstrating:`, [
      "Rote memorization",
      "Surface-level recognition",
      "Genuine understanding",
      "Guessing strategies",
    ], 2),
    mk(`Which practice best reveals gaps in ${subject} knowledge?`, [
      "Re-reading notes passively",
      "Highlighting key passages",
      "Self-testing with varied problems",
      "Watching videos at increased speed",
    ], 2),
    // S11-F4: the live asks exactly 5 — the 6th/7th fallback questions were
    // the session-1 7-question invention's padding.
  ];
}

/* ------------------------------------------------------------------ */
/* 3. Lesson content — the reference's exact Y2 prompt and schema        */
/* ------------------------------------------------------------------ */

type RawLesson = {
  title?: unknown;
  concept?: unknown;
  scenario?: unknown;
  challenge?: unknown;
  questions?: unknown;
};

export async function generateLessonContent(
  level: number,
  subject: string,
  lessonFocus: string,
  stageTitle?: string,
): Promise<LessonContent> {
  // The live's InvokeLLM prompt (mined verbatim from the bundle's Y2.O) —
  // level is the 1-based stage number, lessonFocus the specific lesson title.
  const raw = await complete(
    `Generate ${QUESTIONS_PER_LESSON} distinct multiple-choice questions for Level ${level} on the subject: "${subject}". ` +
      (stageTitle ? `Focus on this stage: ${stageTitle}. ` : "") +
      (lessonFocus
        ? `This specific lesson is: "${lessonFocus}". Make all questions closely related to this lesson topic.`
        : "") +
      ` Return a JSON object with: ` +
      `- title: string (short 3-5 word level title) ` +
      `- concept: string (1-2 sentence core idea for the level) ` +
      `- scenario: string (1-sentence real-world scenario, for level 2 only, else empty string) ` +
      `- challenge: string (a deep mastery challenge intro, for level 3 only, else empty string) ` +
      `- questions: array of exactly ${QUESTIONS_PER_LESSON} objects, each with: ` +
      `* "question": string (question text, max 15 words) ` +
      `* "options": array of exactly 4 strings (answer choices) ` +
      `* "correctIndex": number (0-3, index of the correct option) ` +
      `* "content_type": string, either "video" or "text" ` +
      `* "content_text": string — if content_type is "text", write 2-3 paragraphs explaining the concept; if content_type is "video", a short label describing what the video would cover ` +
      `Alternate between "video" and "text" content types across the ${QUESTIONS_PER_LESSON} questions.`,
  );
  const parsed = extractJson<RawLesson>(raw);
  if (
    parsed &&
    typeof parsed.title === "string" &&
    typeof parsed.concept === "string" &&
    Array.isArray(parsed.questions) &&
    parsed.questions.length >= 4 &&
    parsed.questions.every(
      (q) =>
        typeof q === "object" &&
        q !== null &&
        typeof (q as LessonQuestion).question === "string" &&
        Array.isArray((q as LessonQuestion).options) &&
        (q as LessonQuestion).options.length === 4 &&
        Number.isInteger((q as LessonQuestion).correctIndex) &&
        (q as LessonQuestion).correctIndex >= 0 &&
        (q as LessonQuestion).correctIndex <= 3,
    )
  ) {
    const questions: LessonQuestion[] = (parsed.questions as Array<Record<string, unknown>>)
      .slice(0, QUESTIONS_PER_LESSON)
      .map((q, i) => ({
        question: String(q.question),
        options: (q.options as string[]).map(String),
        correctIndex: Number(q.correctIndex),
        // alternate deterministically when the model skips the field
        contentType: q.content_type === "video" ? "video" : i % 2 === 0 ? "video" : "text",
        contentText: typeof q.content_text === "string" ? q.content_text : "",
      }));
    return {
      title: parsed.title,
      concept: parsed.concept,
      scenario: typeof parsed.scenario === "string" ? parsed.scenario : "",
      challenge: typeof parsed.challenge === "string" ? parsed.challenge : "",
      questions,
      aiGenerated: true,
    };
  }
  return fallbackLesson(level, subject, lessonFocus);
}

function fallbackLesson(
  level: number,
  subject: string,
  lessonFocus: string,
): LessonContent {
  // The observed live no-course content: "This level introduces the
  // foundational concepts and basic principles required for understanding
  // the subject." — mirrored here with per-level scenario/challenge fills.
  const concept =
    level === 1
      ? `This level introduces the foundational concepts and basic principles required for understanding ${subject}.`
      : level === 2
        ? `This level applies the core ${subject} ideas from ${lessonFocus} to concrete, real-world situations.`
        : `This level synthesizes everything covered in ${subject} so far into advanced, exam-ready mastery of ${lessonFocus}.`;
  const title =
    level === 1
      ? `${subject} Foundations`
      : level === 2
        ? `${subject} In Practice`
        : `${subject} Mastery`;
  const scenario =
    level === 2
      ? `A practical scenario: using ${lessonFocus} ideas to reason about a real ${subject} decision.`
      : "";
  const challenge =
    level === 3
      ? `Final challenge: synthesize the full ${subject} roadmap and explain ${lessonFocus} from first principles.`
      : "";
  const questions: LessonQuestion[] = Array.from(
    { length: QUESTIONS_PER_LESSON },
    (_, i) => ({
      question: `Which statement best captures the role of ${lessonFocus} in ${subject}?`,
      options: [
        `${lessonFocus} is a foundational ${subject} concept with broad application`,
        `${lessonFocus} applies only in isolated cases`,
        `${lessonFocus} has no practical use in ${subject}`,
        `${lessonFocus} is unrelated to earlier lessons`,
      ],
      correctIndex: 0,
      contentType: i % 2 === 0 ? "video" : "text",
      contentText:
        i % 2 === 0
          ? `An overview of ${lessonFocus} in ${subject}`
          : `${lessonFocus} is a core ${subject} topic.\n\nThis reading walks through why it matters, how it connects to the earlier stages, and where it shows up in practice.\n\nUse it as a refresher before answering.`,
    }),
  );
  return { title, concept, scenario, challenge, questions, aiGenerated: false };
}

/* ------------------------------------------------------------------ */
/* 4. Lesson titles (roadmap-aware, 6 unique progressive titles)        */
/* ------------------------------------------------------------------ */

export function lessonTitlesForStages(stages: StageDraft[]): string[] {
  const titles: string[] = [];
  for (let i = 0; i < LESSONS_PER_COURSE; i += 1) {
    const stageTitle = stages[Math.floor(i / 2)]?.title;
    titles.push(
      stageTitle
        ? `${stageTitle}: ${i % 2 === 0 ? "Basics" : "In Practice"}`
        : DEFAULT_LESSON_TITLES[i],
    );
  }
  return titles;
}

/* ------------------------------------------------------------------ */
/* 5. Nori — the Socratic tutor chat                                    */
/* ------------------------------------------------------------------ */

export async function chatWithNori(
  history: { role: "user" | "assistant"; content: string }[],
  subject: string | null,
): Promise<{ reply: string; aiGenerated: boolean }> {
  const system =
    `You are Nori, a warm, encouraging AI tutor inside a learning app called Thinkerwell. ` +
    `You use the Socratic method: guide the learner to discover answers rather than giving them directly. ` +
    `Keep replies concise (2-4 sentences), friendly, and concrete. ` +
    (subject ? `The learner is currently studying ${subject}. ` : "") +
    `If asked for a direct answer, give a small hint and ask a guiding question instead.`;
  const raw = await complete(history.map((m) => m.content).slice(-6).join("\n") || "Hello!", system);
  if (raw && raw.trim()) {
    return { reply: raw.trim(), aiGenerated: true };
  }
  return {
    reply:
      "I'm here to help you think it through! Start by telling me what you already know about the topic — what part feels most confusing right now?",
    aiGenerated: false,
  };
}

/* ------------------------------------------------------------------ */
/* 6. Gap analysis                                                      */
/* ------------------------------------------------------------------ */

export async function generateGapAnalysis(input: {
  subject: string;
  score: number;
  total?: number;
  name?: string;
  material?: string | null;
}): Promise<{ analysis: string; aiGenerated: boolean }> {
  const total = input.total && input.total > 0 ? input.total : 5;
  const pct = Math.round((input.score / total) * 100);
  // S11-F4b: the live's E3 prompt shape — "A professional named {name}
  // scored {score}/{total} ({pct}%) on a diagnostic quiz on {subject}…"
  // (the /7 hardcode and the name-less phrasing were session-1 drift).
  const context =
    input.material && input.material.trim().length > 0
      ? `based on their uploaded material: ${input.material.slice(0, 1000)}`
      : `on ${input.subject}`;
  const raw = await complete(
    `A professional named ${input.name || "the learner"} scored ${input.score}/${total} (${pct}%) on a diagnostic quiz ${context}. ` +
      `Write a brief 2-3 sentence gap analysis highlighting what they need to work on and what they already understand well. ` +
      `Keep language professional and encouraging. Plain text only.`,
  );
  if (raw && raw.trim()) {
    return { analysis: raw.trim(), aiGenerated: true };
  }
  const level =
    input.score >= total - 1
      ? "strong"
      : input.score >= Math.ceil(total / 2)
        ? "developing"
        : "foundational";
  return {
    analysis: `Your ${input.score}/${total} score suggests a ${level} grasp of ${input.subject}. The personalized roadmap below balances your learning path, covering core areas progressively.`,
    aiGenerated: false,
  };
}

/* ------------------------------------------------------------------ */
/* 7. Daily challenge                                                   */
/* ------------------------------------------------------------------ */

export async function generateDailyChallenge(
  subject: string,
): Promise<{
  question: string;
  hint: string;
  options: string[];
  correctIndex: number;
  aiGenerated: boolean;
}> {
  const raw = await complete(
    `Generate a quick daily challenge about "${subject}". ` +
      `Return ONLY a JSON object with keys "question" (the question text), "hint" (a short hint), ` +
      `"options" (exactly 4 strings), "correctIndex" (0-3 index of the right answer).`,
  );
  const parsed = extractJson<{
    question: string;
    hint: string;
    options: string[];
    correctIndex: number;
  }>(raw);
  if (
    parsed &&
    typeof parsed.question === "string" &&
    typeof parsed.hint === "string" &&
    Array.isArray(parsed.options) &&
    parsed.options.length === 4 &&
    Number.isInteger(parsed.correctIndex) &&
    parsed.correctIndex >= 0 &&
    parsed.correctIndex <= 3
  ) {
    return { ...parsed, aiGenerated: true };
  }
  return {
    question: "What is the term for a market structure with only one seller and many buyers?",
    hint: "Think about the prefix that means 'one'.",
    options: ["Oligopoly", "Monopoly", "Monopolistic competition", "Perfect competition"],
    correctIndex: 1,
    aiGenerated: false,
  };
}
