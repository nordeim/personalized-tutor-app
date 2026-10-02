import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import {
  DEFAULT_LESSON_TITLES,
  LESSONS_PER_COURSE,
  QUESTIONS_PER_LESSON,
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

const AI_TIMEOUT_MS = 45_000;

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

export async function generateCourseStages(
  courseName: string,
): Promise<{ stages: StageDraft[]; aiGenerated: boolean }> {
  const raw = await complete(
    `Create exactly 3 progressive learning stages for the course "${courseName}". ` +
      `Return ONLY a JSON array of 3 objects with keys "title" and "description". ` +
      `Titles are short (max 4 words). Descriptions are 1-2 sentences about what the learner covers.`,
  );
  const parsed = extractJson<StageDraft[]>(raw);
  if (parsed && parsed.length >= 3 && parsed.every((s) => typeof s.title === "string")) {
    return { stages: parsed.slice(0, 3), aiGenerated: true };
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
/* 2. Diagnostic quiz — 7 questions, 4 options each                     */
/* ------------------------------------------------------------------ */

export async function generateDiagnosticQuiz(
  subject: string,
): Promise<{ questions: QuizQuestion[]; aiGenerated: boolean }> {
  const raw = await complete(
    `Create a 7-question multiple-choice diagnostic quiz assessing general knowledge of "${subject}". ` +
      `Return ONLY a JSON array of 7 objects with keys "question", "options" (array of exactly 4 strings), "correctIndex" (0-3). ` +
      `Questions must span difficulty from foundational to advanced.`,
  );
  const parsed = extractJson<QuizQuestion[]>(raw);
  if (
    parsed &&
    parsed.length >= 5 &&
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
    return { questions: parsed.slice(0, 7), aiGenerated: true };
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
    mk(`Applying ${subject} concepts to unfamiliar problems requires:`, [
      "Copying solved examples exactly",
      "Abstracting principles from specifics",
      "Avoiding estimation and approximation",
      "Repeating the same exercise type",
    ], 1),
    mk(`Long-term retention of ${subject} material is strongest when review is:`, [
      "Crammed into a single session",
      "Spaced out over increasing intervals",
      "Done only when feeling motivated",
      "Limited to the night before tests",
    ], 1),
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
  lessonNumber: number,
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
  return fallbackLesson(level, subject, lessonFocus, lessonNumber);
}

function fallbackLesson(
  level: number,
  subject: string,
  lessonFocus: string,
  lessonNumber: number,
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

export async function generateGapAnalysis(
  subject: string,
  score: number,
): Promise<{ analysis: string; aiGenerated: boolean }> {
  const raw = await complete(
    `Write a 2-3 sentence gap analysis for a learner who scored ${score}/7 on a ${subject} diagnostic quiz. ` +
      `Note what the score suggests about their current level and what to focus on. Plain text only.`,
  );
  if (raw && raw.trim()) {
    return { analysis: raw.trim(), aiGenerated: true };
  }
  const level =
    score >= 6 ? "strong" : score >= 3 ? "developing" : "foundational";
  return {
    analysis: `Your ${score}/7 score suggests a ${level} grasp of ${subject}. The personalized roadmap below balances your learning path, covering core areas progressively.`,
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
