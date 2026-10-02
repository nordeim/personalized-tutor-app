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

/** S9-F1: the Hub's Lesson Progress card label — the live's qP computes
 * `[c + 1, "/", d]` UNCLAMPED (c = the session's correct count, d = 8): at
 * the completing 8th correct the live renders "9/8" (observed through the
 * Level-Up interstitial). Do NOT reintroduce a Math.min clamp — the
 * over-8 label is the reference's own arithmetic. */
export function lessonProgressLabel(answered: number): string {
  return `${answered + 1}/8`;
}

/** S9-F1: the card's bar percent — the live's `Math.round(c / d * 100)`
 * (unclamped like the label; answered never exceeds 8 because the lesson
 * completes at 8 correct). */
export function lessonProgressPct(answered: number): number {
  return Math.round((answered / 8) * 100);
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

/**
 * The Course Lessons card's row status under the quiz-derived model
 * (session-7 decode): rows BELOW the derived count are done, the row AT the
 * count is the next one (the live's white card with the black border), and
 * rows after are later. The dashboard renders a lucide icon per status —
 * CircleCheckBig (done, text-black), Circle (next, text-black), Circle
 * (later, text-black/40) — never a numbered circle.
 */
export type LessonRowStatus = "done" | "next" | "later";
export function lessonRowStatus(index: number, lessonsCompleted: number): LessonRowStatus {
  if (index < lessonsCompleted) return "done";
  if (index === lessonsCompleted) return "next";
  return "later";
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

/**
 * The Q5 "Add a Course" modal's quick-tag list (session-4). The reference
 * renders 6 single-label pills (just the `sub` text) inside the compact
 * modal; clicking one sets the topic input to `"Subject: Sub"`. It is a
 * 6-entry subset of the onboarding chips (no Philosophy, no Marketing),
 * order mined from the live bundle's inline array.
 */
export const ADD_COURSE_TAGS = [
  { subject: "History", sub: "World War II" },
  { subject: "Economics", sub: "Microeconomics" },
  { subject: "Psychology", sub: "Social Psychology" },
  { subject: "Math", sub: "Calculus" },
  { subject: "Programming", sub: "Python" },
  { subject: "Biology", sub: "Genetics" },
] as const;

/** The Q5 tag-click topic format: "Subject: Sub" (the reference's onClick). */
export function tagTopic(subject: string, sub: string): string {
  return `${subject}: ${sub}`;
}

/**
 * The shared custom-source predicate (session-5): the m_ context line
 * ("Custom material") and the CoursePill's BookOpen-vs-Sparkles tile both
 * branch on "custom" | "material" membership (the live's `p_` uses the
 * same check).
 */
export function isCustomSource(
  contentSource: string | null | undefined,
): boolean {
  return contentSource === "custom" || contentSource === "material";
}

/**
 * The CO course-card's source label (session-6, S6-F7): the reference's
 * bundle renders `content_source === "custom" ? "Custom Material"
 * : "AI-Generated Course"` — custom ONLY. Deliberately NARROWER than
 * `isCustomSource` (which the p_ CoursePill icon uses for custom‖material):
 * "material" courses get the BookOpen pill icon but still label as
 * AI-Generated on the card. Pinned in tests/domain-session6.test.ts.
 */
export function courseSourceLabel(
  contentSource: string | null | undefined,
): "Custom Material" | "AI-Generated Course" {
  return contentSource === "custom" ? "Custom Material" : "AI-Generated Course";
}

/**
 * The m_ user-dropdown header's context line (session-4):
 * "{current_subject} · Default" or "· Custom material" for custom sources;
 * the guest/null student renders "Default" alone (the live renders the
 * `·` join against a null subject the same way).
 */
export function courseContextLine(
  subject: string | null | undefined,
  contentSource: string | null | undefined,
): string {
  const suffix = isCustomSource(contentSource) ? "Custom material" : "Default";
  return subject ? `${subject} · ${suffix}` : suffix;
}

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

/**
 * S8-F4: the hub LessonView h2 subject — the live computes
 * ce = (student?.current_subject) || "General" and passes it to the lesson
 * view as the `subject` prop (level 1 renders it directly; the course NAME is
 * never a fallback — a student whose current_subject differs from the active
 * course still sees the student's subject). The clone's HubCourse
 * .currentSubject is exactly the student's current_subject.
 */
export function hubLessonSubject(course: {
  currentSubject?: string | null;
  courseName?: string | null;
} | null): string {
  return course?.currentSubject?.trim() || "General";
}

/**
 * S8-F1: the public onboarding's pending_student_setup payload — the
 * anonymous Continue stores the form (sessionStorage, the live's key name)
 * and the post-login pickup parses it back to auto-generate. Defensive like
 * the live's X2 try/catch: anything unparseable yields null and the normal
 * onboarding renders.
 */
export function parsePendingSetup(raw: string | null): {
  mode: "topic" | "material";
  topic: string;
  courseName: string;
  contentText: string;
  name: string;
} | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const p = parsed as Record<string, unknown>;
    const mode = p.mode === "material" ? "material" : "topic";
    return {
      mode,
      topic: typeof p.topic === "string" ? p.topic : "",
      courseName: typeof p.courseName === "string" ? p.courseName : "",
      contentText: typeof p.contentText === "string" ? p.contentText : "",
      name: typeof p.name === "string" ? p.name.trim() : "",
    };
  } catch {
    return null;
  }
}

// --- Session 10: the from_url contract + the onboarding validity predicate ---

/**
 * The ONE from_url writer template (session-10, S10-F1/F8): the live's
 * client-side navigateToLogin() = redirectToLogin(window.location.href) —
 * the CURRENT URL's path AND query ride on the login redirect. The clone's
 * three writers (the desktop Sign In pill, the mobile Sign In item, the
 * onboarding Continue deferral) all build their push through this helper so
 * the query string survives the login round-trip (an anonymous visitor at
 * /?course=X returns to /?course=X, not /).
 */
export function loginRedirectUrl(pathname: string | null | undefined, search: string | null | undefined): string {
  const path = pathname && pathname.length > 0 ? pathname : "/";
  const rawQuery = search && search.length > 0 ? search : "";
  // normalize: useSearchParams().toString() has NO leading "?" — prepend it
  // so the query rides as a query, never as a path segment.
  const query = rawQuery.length > 0 && !rawQuery.startsWith("?") ? `?${rawQuery}` : rawQuery;
  return `/login?from_url=${encodeURIComponent(path + query)}`;
}

/**
 * The login page's from_url consumer (session-10, R8): relative same-app
 * paths pass through; an ABSOLUTE url is tolerated (the live's own format —
 * from_url=https://host/path?query) only when its origin matches, decoding
 * to path+search. Foreign origins, protocol-relative ("//"), malformed
 * values, and empty inputs all collapse to "/" — the open-redirect FIX for
 * a contract the live ships as a vulnerability (clone doctrine: fix it AND
 * pin it — see tests/e2e/session10-public.spec.ts).
 */
export function sameOriginRedirectTarget(raw: string | null | undefined, origin: string): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.origin === origin) return parsed.pathname + parsed.search;
  } catch {
    // not a parseable absolute URL — fall through to the safe default
  }
  return "/";
}

/**
 * The onboarding validity predicate (session-10, S10-F7 — the session-9 R5
 * completion): ONE home for the ≥2/≥2/≥20 thresholds, consumed by BOTH the
 * Continue gate (topic ≥ 2, or material's courseName ≥ 2 AND contentText ≥
 * 20) and the post-login pending-setup pickup. The component maps its
 * materialText state onto contentText.
 */
export function onboardingInputsValid(input: {
  mode: "topic" | "material";
  topic: string;
  courseName: string;
  contentText: string;
}): boolean {
  return input.mode === "topic"
    ? input.topic.trim().length >= 2
    : input.courseName.trim().length >= 2 && input.contentText.trim().length >= 20;
}

// ---- Session-11: the diagnostic-quiz surface (E3 + wO, bundle-decoded) ----

/**
 * The live's client-side diagnostic score (S11-F2): the count of picks that
 * match the correct index — NOT the count of answered questions (the
 * session-1 server-side derivation scored every answered question correct,
 * so a completed quiz always scored "perfect"). E3 computes
 * `Z.filter((G, re) => G === c[re].ans).length` before submitting.
 */
export function diagnosticScore(picked: number[], correct: number[]): number {
  let n = 0;
  for (let i = 0; i < picked.length && i < correct.length; i++) {
    if (picked[i] >= 0 && picked[i] === correct[i]) n++;
  }
  return n;
}

/**
 * The quiz progress row's fill/star position (S11-F1.3): the live computes
 * width `${(g + 1) / c.length * 100}%` — the CURRENT question counts, with
 * no reveal bump.
 */
export function quizMarkerPct(current: number, total: number): number {
  if (total <= 0) return 0;
  return ((current + 1) / total) * 100;
}

/**
 * The quiz dot strip (S11-F1.8): the active dot is 24px yellow, done dots
 * 6px #C0C0C0, future dots 6px #4A4A4A.
 */
export function quizDotState(
  i: number,
  current: number,
): { w: number; bg: string } {
  if (i === current) return { w: 24, bg: "#FFFD73" };
  if (i < current) return { w: 6, bg: "#C0C0C0" };
  return { w: 6, bg: "#4A4A4A" };
}

/**
 * The login page's origin construction (S11-F8): headers() gives a host and
 * possibly a comma-list `x-forwarded-proto`; normalize to the first token,
 * default https. Empty host → empty origin (the same-origin guard collapses
 * absolute from_urls to "/" — fail-closed).
 */
export function headerOrigin(
  host: string | null | undefined,
  forwardedProto: string | null | undefined,
): string {
  if (!host) return "";
  const proto = forwardedProto?.split(",")[0]?.trim() || "https";
  return `${proto}://${host}`;
}
