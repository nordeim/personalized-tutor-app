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

/** Human label for the lessons sheet: "Stage 1 · Level 1". */
export function stageLevelLabel(index: number): string {
  const { stage, level } = lessonMeta(index);
  return `Stage ${stage + 1} · Level ${level + 1}`;
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

/**
 * Lesson titles for the dashboard's "Course Lessons" list. The reference
 * derives per-lesson titles from the roadmap when present ("{Stage}: Basics"
 * / "{Stage}: In Practice" pattern) and falls back to the default grid.
 */
export function lessonTitles(roadmap: Roadmap): string[] {
  const out: string[] = [];
  for (let i = 0; i < LESSONS_PER_COURSE; i += 1) {
    const { stage, level } = lessonMeta(i);
    const stageTitle = roadmap[stage]?.title;
    out.push(
      stageTitle
        ? `${stageTitle}: ${level === 0 ? "Basics" : "In Practice"}`
        : DEFAULT_LESSON_TITLES[i],
    );
  }
  return out;
}

/** Lessons completed over a course (unique completed LessonProgress rows). */
export function completedLessonCount(progress: { completed: boolean }[]): number {
  return progress.filter((p) => p.completed).length;
}

/** Course progress percent: completed lessons / 6, rounded. */
export function courseProgressPercent(completed: number): number {
  if (completed <= 0) return 0;
  if (completed >= LESSONS_PER_COURSE) return 100;
  return Math.round((completed / LESSONS_PER_COURSE) * 100);
}

/**
 * Roadmap stage status: a stage is done when both its lessons are done;
 * in-progress when its first lesson is done (or it is the first incomplete
 * stage with zero progress elsewhere).
 */
export type StageStatus = "done" | "in-progress" | "upcoming";
export function stageStatus(
  stage: number,
  completedLessonIndexes: number[],
): StageStatus {
  const own = [stage * 2, stage * 2 + 1];
  const done = own.filter((i) => completedLessonIndexes.includes(i)).length;
  if (done === 2) return "done";
  if (done === 1) return "in-progress";
  // Stage 0 is in-progress when nothing is completed yet (course started).
  if (stage === 0 && completedLessonIndexes.length === 0) return "in-progress";
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

/** The h1 typewriter topics (cycled "Dive into {topic}" on the dashboard). */
export const DIVE_TOPICS = [
  "Finance",
  "History",
  "Literature",
  "Philosophy",
  "Marketing",
  "Economics",
  "Biology",
  "Music Theory",
] as const;

/** Initials avatar letter (the reference shows the first character). */
export function avatarLetter(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

/** Display name: local part of an email when no full name exists. */
export function displayName(email: string, fullName: string | null): string {
  if (fullName && fullName.trim()) return fullName.trim();
  const local = email.split("@")[0] ?? email;
  return local;
}
