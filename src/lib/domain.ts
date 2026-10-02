// Pure domain seam for the 3-stage × 2-lesson mastery grid and progress
// math. No I/O — unit-tested by tests/domain.test.ts.

export const QUESTIONS_PER_LESSON = 8;
export const LESSONS_PER_COURSE = 6;
export const STAGES_PER_COURSE = 3;

export type RoadmapStage = { title: string; description: string };
export type Roadmap = RoadmapStage[];

export type LessonMeta = {
  index: number; // 0..5
  number: number; // 1..6
  stage: number; // 0..2 (display 1..3)
  level: number; // 0..1 (display 1..2)
};

/** The Hub's default lesson titles (the reference's demo roadmap). */
export const DEFAULT_LESSON_TITLES = [
  "Introduction",
  "Key Concepts",
  "Real Examples",
  "Problem Solving",
  "Deep Dive",
  "Mastery Check",
] as const;

/** Map a lesson index onto the 3-stage × 2-level grid. */
export function lessonMeta(index: number): LessonMeta {
  const clamped = Math.max(0, Math.min(LESSONS_PER_COURSE - 1, Math.trunc(index)));
  return {
    index: clamped,
    number: clamped + 1,
    stage: Math.floor(clamped / 2),
    level: clamped % 2,
  };
}

/** Human label for the lessons sheet — the live prints the STAGE number for
 * both slots ("Stage 2 · Level 2" for lessons 3-4). */
export function stageLevelLabel(index: number): string {
  const { stage } = lessonMeta(index);
  return `Stage ${stage + 1} · Level ${stage + 1}`;
}

/** Parse the persisted roadmap JSON (invalid input → empty roadmap). */
export function parseRoadmap(json: string | null | undefined): Roadmap {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (s): s is RoadmapStage =>
          typeof s === "object" &&
          s !== null &&
          typeof (s as RoadmapStage).title === "string",
      )
      .map((s) => ({
        title: s.title,
        description: typeof s.description === "string" ? s.description : "",
      }))
      .slice(0, STAGES_PER_COURSE);
  } catch {
    return [];
  }
}

/** Per-stage lesson-title suffix pairs — the live's Kh expansion (mined
 * verbatim: [["Basics","In Practice"],["Fundamentals","Application"],
 * ["Deep Dive","Mastery"]]). */
export const LEVEL_SUFFIXES: ReadonlyArray<readonly [string, string]> = [
  ["Basics", "In Practice"],
  ["Fundamentals", "Application"],
  ["Deep Dive", "Mastery"],
];

/**
 * Lesson titles for the dashboard's "Course Lessons" list and the Hub
 * sidebar. The reference expands each roadmap stage into two lessons with
 * the per-stage suffix pairs above and falls back to the default grid.
 */
export function lessonTitles(roadmap: Roadmap): string[] {
  const out: string[] = [];
  for (let i = 0; i < LESSONS_PER_COURSE; i += 1) {
    const { stage, level } = lessonMeta(i);
    const stageTitle = roadmap[stage]?.title;
    const suffix = LEVEL_SUFFIXES[stage]?.[level] ?? LEVEL_SUFFIXES[0][level];
    out.push(stageTitle ? `${stageTitle}: ${suffix}` : DEFAULT_LESSON_TITLES[i]);
  }
  return out;
}

/** Lessons completed over a course (unique completed LessonProgress rows).
 * NOTE: the DASHBOARD surfaces no longer consume this (they use the quiz-
 * derived model below, like the reference); the Hub keeps its own honest
 * per-lesson tracking for the completion POST. */
export function completedLessonCount(progress: { completed: boolean }[]): number {
  return progress.filter((p) => p.completed).length;
}

// ---------------------------------------------------------------------------
// Quiz-derived progress — the reference's dashboard model (session-3 finding
// F24). The live's CourseEnrollment entity carries NO per-lesson progress;
// every dashboard number derives from the diagnostic quiz score:
//   E       = quiz_completed ? Math.round(quiz_score/5*100) : 0
//   lessons = Math.round(E/100*6)         (the "N/6 lessons" counts)
//   stage   = Math.floor(lessons/2)       (the roadmap's current stage)
// The demo's famous "60%" is round(3/5*100) with quiz_score 3 — not a pin.
// ---------------------------------------------------------------------------

/** Course progress percent derived from the diagnostic quiz (clamped at 100
 * — the live prints >100% for scores above 5, a bug the clone fixes). */
export function quizProgressPercent(
  quizScore: number | null | undefined,
  quizCompleted: boolean | null | undefined,
): number {
  if (!quizCompleted) return 0;
  const score = Math.floor(quizScore ?? 0) || 0;
  return Math.min(100, Math.round((score / 5) * 100));
}

/** "Lessons completed" derived from the progress percent (max 6). */
export function derivedLessonsCompleted(progressPct: number): number {
  const pct = Math.floor(progressPct) || 0;
  return Math.min(LESSONS_PER_COURSE, Math.round((pct / 100) * LESSONS_PER_COURSE));
}

/** The roadmap's current (in-progress) stage index — floor(lessons/2).
 * Returns 3 when everything is complete (past the last stage). */
export function roadmapCurrentStage(lessonsCompleted: number): number {
  return Math.floor(Math.max(0, lessonsCompleted) / 2);
}

/**
 * Roadmap stage status under the quiz-derived model: stages BEFORE the
 * current one are done; the current one is in-progress; stages after are
 * "upcoming" — which the live renders with NO status text at 45% opacity.
 */
export type StageStatus = "done" | "in-progress" | "upcoming";
export function roadmapStageStatus(stage: number, currentStage: number): StageStatus {
  if (stage < currentStage) return "done";
  if (stage === currentStage) return "in-progress";
  return "upcoming";
}

/** Quiz score → mastery level (the reference's 3-level ladder, 0-7 scale). */
export function masteryLevel(quizScore: number): 1 | 2 | 3 {
  if (quizScore >= 6) return 3;
  if (quizScore >= 3) return 2;
  return 1;
}

/** The category chips on the onboarding panel (measured off the live app). */
export const CATEGORY_TAGS = [
  { subject: "History", topic: "World War II" },
  { subject: "Economics", topic: "Microeconomics" },
  { subject: "Psychology", topic: "Social Psychology" },
  { subject: "Math", topic: "Calculus" },
  { subject: "Programming", topic: "Python" },
  { subject: "Philosophy", topic: "Ethics" },
  { subject: "Biology", topic: "Genetics" },
  { subject: "Marketing", topic: "Digital Marketing" },
] as const;

/**
 * The h1 typewriter topics (cycled "Dive into {topic}" on the dashboard).
 * Mined verbatim from the reference bundle (const $i=[...]) — order matters
 * because the live typewriter starts on "Literature".
 */
export const DIVE_TOPICS = [
  "Literature",
  "Finance",
  "History",
  "Psychology",
  "Marketing",
  "Philosophy",
  "Economics",
  "Biology",
] as const;

/** Initials avatar letter (the reference shows the first character). */
export function avatarLetter(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

// ---------------------------------------------------------------------------
// Subject icon mapper — the courses-page card's keyword buckets (mined from
// the live bundle's bO function; lucide icon names). Custom material and the
// fallback both use the book.
// ---------------------------------------------------------------------------

const SUBJECT_ICON_BUCKETS: ReadonlyArray<readonly [readonly RegExp[], string]> = [
  [[/math/i, /calculus/i, /algebra/i], "Calculator"],
  [[/biology/i, /genetics/i, /life/i], "Leaf"],
  [[/physics/i, /chemistry/i, /science/i, /atom/i], "Atom"],
  [[/history/i, /war/i, /ancient/i], "Landmark"],
  [[/psychology/i, /mind/i, /mental/i], "Brain"],
  [[/economics/i, /finance/i, /money/i, /invest/i], "ChartColumnIncreasing"],
  [[/programming/i, /python/i, /code/i, /software/i], "Cpu"],
  [[/music/i, /theory/i, /harmony/i], "Music"],
  [[/art/i, /design/i, /visual/i], "Palette"],
  [[/philosophy/i, /ethics/i, /logic/i], "Scale"],
  [[/marketing/i, /business/i, /brand/i], "Megaphone"],
  [[/geography/i, /world/i, /global/i], "Globe"],
];

/** Map a course name (or content source) onto its lucide subject icon. */
export function subjectIconName(
  courseName: string | null | undefined,
  contentSource: string | null | undefined,
): string {
  if (contentSource === "custom") return "BookOpen";
  const name = (courseName ?? "").toLowerCase();
  for (const [patterns, icon] of SUBJECT_ICON_BUCKETS) {
    if (patterns.some((p) => p.test(name))) return icon;
  }
  return "BookOpen";
}

/** Display name: local part of an email when no full name exists. */
export function displayName(email: string, fullName: string | null): string {
  if (fullName && fullName.trim()) return fullName.trim();
  const local = email.split("@")[0] ?? email;
  return local;
}

// ---------------------------------------------------------------------------
// Gamification math — mined from the reference's dashboard right card
// (Study Streak / Total XP) and its confetti triggers. Pinned by
// tests/parity-session2.test.ts.
// ---------------------------------------------------------------------------

/**
 * Study Streak "days": the reference caps the diagnostic quiz score at 7
 * (Math.min(quizScore, 7)) and renders that as the streak's day count.
 */
export function studyStreakDays(quizScore: number): number {
  return Math.min(Math.max(0, Math.floor(quizScore) || 0), 7);
}

/** Total XP: scorePercent*10 + quizScore*50 — the reference's exact formula. */
export function totalXp(scorePercent: number, quizScore: number): number {
  return (Math.floor(scorePercent) || 0) * 10 + (Math.floor(quizScore) || 0) * 50;
}

/**
 * The reference fires confetti when the quiz score CROSSES 3 or 7 (upward
 * only; the first observation initializes the ref without firing).
 */
export function confettiAt(prevScore: number | null, nextScore: number): boolean {
  if (prevScore === null) return false;
  if (nextScore <= prevScore) return false;
  return (prevScore < 3 && nextScore >= 3) || (prevScore < 7 && nextScore >= 7);
}

/** A lesson quiz question (the shape /api/lessons/content returns). */
export type LessonQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
};

/**
 * "Retry later" semantics: the missed question is re-queued at the END of the
 * list (the reference appends a copy; its id field exists only for React
 * keys — this clone keys by index). The original array is never mutated.
 */
export function requeueQuestion<T extends object>(questions: T[], q: T): T[] {
  return [...questions, { ...q }];
}
