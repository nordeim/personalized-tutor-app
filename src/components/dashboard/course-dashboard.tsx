"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MascotWelcome } from "@/components/mascot";
import { X, CircleCheckBig, Circle } from "lucide-react";
import {
  derivedLessonsCompleted,
  lessonRowStatus,
  quizProgressPercent,
  roadmapCurrentStage,
  roadmapStageStatus,
  studyStreakDays,
  totalXp,
  type Roadmap,
} from "@/lib/domain";
import type { CourseDto, DashboardUser } from "@/components/dashboard/dashboard-app";
import { useToast } from "@/components/toast";

type CourseView = CourseDto & { roadmap: Roadmap; lessonTitles: string[] };

/** The mascot bubble line — picked at random per page load (reference semantics). */
export type BubbleQuote = { raw: string; text: string; author: string | null };

const FALLBACK_BUBBLE: BubbleQuote = {
  raw: '"An investment in knowledge pays the best interest." — Benjamin Franklin',
  text: "An investment in knowledge pays the best interest.",
  author: "Benjamin Franklin",
};

type Challenge = {
  question: string;
  hint: string;
  options: string[];
  correctIndex: number;
  aiGenerated: boolean;
};

const FALLBACK_CHALLENGE: Challenge = {
  question: "What is the term for a market structure with only one seller and many buyers?",
  hint: "Think about the prefix that means 'one'.",
  options: ["Oligopoly", "Monopoly", "Monopolistic competition", "Perfect competition"],
  correctIndex: 1,
  aiGenerated: false,
};

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const FLAME_TILE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.153.433-2.294 1-3a2.5 2.5 0 0 1 2.5-1 1.072 1.072 0 0 1-.5 2 2.5 2.5 0 0 0 .5 3.5c.387.387.5.947.5 1.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5" />
  </svg>
);

/** S9-F6a (R4): the dashboard's card icons pin the LIVE's lucide-react
 * 0.475 path data — BookOpen and Trophy were REDESIGNED upstream by the
 * clone's 0.525 (0.475 BookOpen = "M2 3h6…" vs 0.525 "M12 7v14…"; same for
 * Trophy), so importing today's lucide components would change the rendered
 * strokes AND break the session-8 e2e icon pins. Brain/Sparkles paths happen
 * to be identical across versions but ride the same pattern for consistency.
 * Do NOT swap these for lucide-react imports without re-probing the live's
 * paths. The size variants parameterize ONE component per shape (the
 * session-8 constants duplicated the full SVG per size). */
function BookOpenIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

/** S8-F6: the Course Progress tile renders lucide Trophy at 24px on the
 * live (the clone shipped TrendingUp — an icon-identity drift). */
function TrophyIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/** S8-F6: the Daily Challenge tile + modal header render lucide Brain on
 * the live (24px tile / 20px modal — the clone shipped Sparkles). */
function BrainIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

function SparklesIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

const BOOK_ICON = <BookOpenIcon className="lucide lucide-book-open h-6 w-6 flex-shrink-0" />;

/** S8-F6: the Course Lessons card header icon decodes at 16px on the
 * live (the stats-grid Subject tile is the 24px variant above). */
const BOOK_ICON_SM = <BookOpenIcon className="lucide lucide-book-open h-4 w-4 flex-shrink-0" />;

const TROPHY_ICON = <TrophyIcon className="lucide lucide-trophy h-6 w-6 flex-shrink-0" />;

const BRAIN_ICON = <BrainIcon className="lucide lucide-brain h-6 w-6 flex-shrink-0" />;

const BRAIN_ICON_SM = <BrainIcon className="lucide lucide-brain h-5 w-5 flex-shrink-0" />;

const SPARKLE_ICON = <SparklesIcon className="lucide lucide-sparkles h-6 w-6 flex-shrink-0" />;

export function CourseDashboard({
  user,
  course,
  bubbleQuote,
}: {
  user: DashboardUser;
  course: CourseView;
  courses: { id: string; name: string; current: boolean }[];
  /** Server-picked random bubble line (fresh each page load, like the reference). */
  bubbleQuote?: BubbleQuote;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const quote = bubbleQuote ?? FALLBACK_BUBBLE;
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  // The reference's quiz-derived progress model (session-3 F24): the
  // enrollment carries no per-lesson progress — every dashboard number
  // derives from the diagnostic quiz score (E = round(score/5×100),
  // lessons = round(E/100×6)). The demo's quiz 3 yields the live's exact
  // 60% / 4/6 / 750 XP / 3-day numbers naturally.
  const progressPct = quizProgressPercent(course.quizScore, course.quizCompleted);
  const completed = derivedLessonsCompleted(progressPct);
  const currentStage = roadmapCurrentStage(completed);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengePicked, setChallengePicked] = useState<number | null>(null);
  const [challengeRevealed, setChallengeRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/challenge", { method: "POST" });
        const json = (await res.json()) as
          | { ok: true; data: Challenge }
          | { ok: false };
        if (!cancelled && json.ok) setChallenge(json.data);
        else if (!cancelled) setChallenge(FALLBACK_CHALLENGE);
      } catch {
        if (!cancelled) setChallenge(FALLBACK_CHALLENGE);
      } finally {
        if (!cancelled) setChallengeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const roadmapLessonsPct = (completed / (course.lessonTitles.length || 6)) * 100;

  const streakDays = studyStreakDays(course.quizScore ?? 0);
  const xp = totalXp(progressPct, course.quizScore ?? 0);

  return (
    <div className="flex flex-1 flex-col gap-[4px] px-[4px] pb-[4px] pt-[4px] lg:flex-row" style={{ minHeight: 0 }}>
      {/* ---------------- left column ---------------- */}
      <div className="flex min-h-0 flex-col gap-[4px] lg:flex-[2]">
        {/* welcome hero */}
        <div
          className="relative flex min-h-[290px] items-end justify-between overflow-visible rounded-[20px] px-6 py-6 md:min-h-0 md:overflow-hidden md:px-8"
          style={{ backgroundColor: "rgb(248, 248, 248)" }}
        >
          <div className="absolute bottom-6 left-8">
            <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              {today}
            </p>
          </div>
          <div className="absolute left-8 top-6 flex flex-col">
            <p className="text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Welcome
            </p>
            <h1
              className="mt-1 font-normal text-black"
              style={{
                fontFamily: '"Funnel Sans", sans-serif',
                fontSize: "clamp(64px, 4.5vw, 120px)",
                letterSpacing: "-0.03em",
                lineHeight: 0.9,
              }}
            >
              {user.name}
            </h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-end gap-1">
              <div
                className="relative rounded-[14px] px-3 py-2 shadow-sm"
                style={{ backgroundColor: "rgb(235, 226, 255)", maxWidth: 260, minWidth: 120 }}
              >
                <p
                  className="text-xs font-light leading-snug text-black"
                  style={{
                    fontFamily: '"Funnel Sans", sans-serif',
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {quote.author ? (
                    <>
                      &ldquo;{quote.text}&rdquo; — {quote.author}
                    </>
                  ) : (
                    quote.text
                  )}
                </p>
                <div
                  style={{
                    position: "absolute",
                    bottom: -7,
                    right: 18,
                    width: 0,
                    height: 0,
                    borderLeft: "7px solid transparent",
                    borderRight: "7px solid transparent",
                    borderTop: "8px solid rgb(235, 226, 255)",
                  }}
                />
              </div>
              <div style={{ marginBottom: -17 }}>
                <MascotWelcome />
              </div>
            </div>
          </div>
        </div>

        {/* stats grid */}
        <div className="grid grid-cols-2 gap-[4px] md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-[20px] p-6" style={{ backgroundColor: "rgb(248, 248, 248)" }}>
            {BOOK_ICON}
            <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Subject
            </p>
            <p className="text-base font-normal leading-tight text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              {course.courseName}
            </p>
          </div>
          <div
            className="flex flex-col gap-2 rounded-[20px] p-6"
            style={{ backgroundColor: progressPct > 0 ? "rgb(255, 253, 115)" : "rgb(248, 248, 248)" }}
          >
            {TROPHY_ICON}
            <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Course Progress
            </p>
            <p className="text-3xl font-normal text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              {progressPct}%
            </p>
            <div className="h-1.5 overflow-hidden rounded-[9999px] bg-black/10">
              <div
                className="h-full rounded-[9999px] bg-black transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              {completed}/6 lessons completed
            </p>
          </div>
          <button
            type="button"
            onClick={() => challenge && setChallengeOpen(true)}
            disabled={!challenge}
            className="col-span-2 flex flex-col gap-2 rounded-[20px] p-6 text-left transition-all md:col-span-1"
            style={{ backgroundColor: "rgb(248, 248, 248)", cursor: challenge ? "pointer" : "default" }}
            aria-label="Daily challenge — open the challenge card"
          >
            {BRAIN_ICON}
            <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Daily Challenge
            </p>
            {challengeLoading ? (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-[9999px] border-2 border-black/30 border-t-black" />
                <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                  Generating challenge...
                </p>
              </div>
            ) : (
              <p
                className="text-sm font-normal leading-tight text-black"
                style={{
                  fontFamily: '"Funnel Sans", sans-serif',
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {challenge?.question}
              </p>
            )}
          </button>
        </div>

        {/* daily challenge modal — the reference's interactive card.
            S8-F6: the overlay is plain black/50 with NO backdrop blur, and
            the post-reveal state has NO banner — the Submit button swaps
            in place to "Close" (the reveal colors carry the feedback). */}
        {challengeOpen && challenge ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            // S8-F7 (Trap 8): the pinned surface uses inline rgba — v4's
            // bg-black/50 computes to oklab(0 0 0 / 0.5) while the live's
            // v3 alpha serializes rgba(0, 0, 0, 0.5). (S9-F6c: the dead
            // bg-black/50 class is gone — the inline style is the single
            // source of truth for this pinned surface.)
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setChallengeOpen(false)}
          >
            <div
              className="mx-4 flex max-w-md flex-col gap-4 rounded-[24px] p-6"
              style={{ backgroundColor: "rgb(248, 248, 248)", fontFamily: '"Funnel Sans", sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {BRAIN_ICON_SM}
                  <span className="text-sm font-medium text-black">Daily Challenge</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChallengeOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-[9999px] transition-all hover:bg-black/10"
                  aria-label="Close the daily challenge"
                >
                  <X className="h-4 w-4 text-black/50" />
                </button>
              </div>
              <p className="text-base font-normal leading-snug text-black">{challenge.question}</p>
              <p className="-mt-2 text-xs font-light italic text-black/30">{challenge.hint}</p>
              <div className="flex flex-col gap-2">
                {challenge.options.map((opt, i) => {
                  let bg = "rgb(225, 200, 185)"; // unanswered tan
                  if (challengeRevealed) {
                    if (i === challenge.correctIndex) bg = "rgb(255, 253, 115)";
                    else if (i === challengePicked) bg = "rgb(255, 208, 208)";
                    else bg = "rgb(220, 220, 220)";
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => challengeRevealed || setChallengePicked(i)}
                      className="rounded-[12px] px-4 py-3 text-left text-sm font-normal text-black transition-all"
                      style={{
                        backgroundColor: bg,
                        border:
                          challengePicked === i && !challengeRevealed
                            ? "1px solid rgb(15, 14, 14)"
                            : "1px solid transparent",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {challengeRevealed ? (
                <button
                  type="button"
                  onClick={() => {
                    setChallengeOpen(false);
                    setChallengePicked(null);
                    setChallengeRevealed(false);
                  }}
                  className="w-full rounded-[12px] bg-black py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800"
                >
                  Close
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => challengePicked !== null && setChallengeRevealed(true)}
                  disabled={challengePicked === null}
                  className="w-full rounded-[12px] bg-black py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:opacity-30"
                >
                  Submit Answer
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* learning roadmap */}
        <div className="flex min-h-0 flex-1 flex-col rounded-[20px] p-4" style={{ backgroundColor: "rgb(248, 248, 248)" }}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              {SPARKLE_ICON}
              <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                Learning Roadmap
              </p>
            </div>
            <p className="text-xs font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              {completed}/6 lessons
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:gap-0">
            {(course.roadmap.length
              ? course.roadmap
              : [
                  { title: "Foundations", description: "Core concepts and definitions." },
                  { title: "Application", description: "Worked examples and practice." },
                  { title: "Mastery", description: "Advanced material and synthesis." },
                ]
            ).map((stage, i) => {
              const status = roadmapStageStatus(i, currentStage);
              return (
                <div
                  key={stage.title}
                  className="flex flex-1 flex-col"
                  style={{ paddingRight: 16, opacity: status === "upcoming" ? 0.45 : 1 }}
                >
                  <span
                    className="block font-light leading-none"
                    style={{
                      fontFamily: '"Funnel Sans", sans-serif',
                      fontSize: "clamp(36px, 3.5vw, 56px)",
                      color: "rgb(15, 14, 14)",
                      fontWeight: 300,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 text-sm font-semibold leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(15, 14, 14)" }}>
                    {stage.title}
                  </p>
                  <p className="mt-0.5 text-xs font-light leading-snug" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                    {stage.description}
                  </p>
                  <div className="mt-auto pt-1.5">
                    {status === "done" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                        <span>✓</span> Done
                      </span>
                    ) : status === "in-progress" ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(15, 14, 14)" }}>
                        <span>→</span> In progress
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-[9999px] bg-black/10">
              <div
                className="h-full rounded-[9999px] bg-black transition-all duration-700"
                style={{ width: `${roadmapLessonsPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between">
              <p className="text-[12px] font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                Start
              </p>
              <p className="text-[12px] font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                Complete
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-auto flex flex-col gap-[4px] sm:flex-row">
          <a
            href={`/hub?course=${course.id}`}
            className="flex flex-1 items-center justify-center gap-3 rounded-[20px] py-5 text-base font-semibold text-black transition-all hover:opacity-90"
            style={{ fontFamily: '"Funnel Sans", sans-serif', backgroundColor: "rgb(225, 200, 185)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap h-5 w-5">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
            Enter The Hub
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right h-4 w-4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => router.push(`/quiz?course=${course.id}`)}
            className="flex items-center justify-center gap-2 rounded-[20px] px-8 py-5 text-sm font-medium text-black transition-all hover:opacity-80 sm:flex-shrink-0"
            style={{ fontFamily: '"Funnel Sans", sans-serif', backgroundColor: "rgb(248, 248, 248)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-ccw h-4 w-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Retake Quiz
          </button>
        </div>
      </div>

      {/* ---------------- right column ---------------- */}
      <div className="flex min-h-0 flex-col gap-[4px] overflow-visible lg:flex-[1] lg:overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col rounded-[20px] p-6" style={{ backgroundColor: "rgb(200, 174, 255)" }}>
          <div className="mb-4 flex items-center gap-2">
            {BOOK_ICON_SM}
            <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              Course Lessons
            </p>
          </div>
          <div className="scroll-slim flex-1 min-h-0 space-y-2 overflow-y-auto">
            {course.lessonTitles.map((title, i) => {
              /* S7-F4: the row status (bg/border/bar + the icon column) is
                 keyed off the quiz-derived count — decoded from the live:
                 done rows carry CircleCheckBig, the next row a full-black
                 Circle, later rows a black/40 Circle (w-4 h-4, sw 1.5). */
              const status = lessonRowStatus(i, completed);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => router.push(`/hub?course=${course.id}&lesson=${i}`)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    backgroundColor:
                      status === "done"
                        ? "rgb(245, 245, 245)"
                        : status === "next"
                          ? "rgb(255, 255, 255)"
                          : "rgb(250, 250, 250)",
                    border: status === "next" ? "1px solid rgb(15, 14, 14)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                  aria-label={`Open lesson ${i + 1}: ${title}`}
                >
                  <div className="flex items-center gap-2.5">
                    {status === "done" ? (
                      <CircleCheckBig className="h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
                    ) : (
                      <Circle
                        className="h-4 w-4 flex-shrink-0 text-black"
                        strokeWidth={1.5}
                        style={status === "later" ? { color: "rgba(0, 0, 0, 0.4)" } : undefined}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-light leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                        Lesson {i + 1}
                      </p>
                      <p className="truncate text-xs font-medium leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(15, 14, 14)" }}>
                        {title}
                      </p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-[9999px] bg-black/10">
                        <div
                          className="h-full rounded-[9999px] bg-black transition-all duration-700"
                          style={{ width: status === "done" ? "100%" : "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
            <span className="font-medium text-black">{completed}</span> / {course.lessonTitles.length || 6} lessons · {progressPct}% complete
          </p>
        </div>

        {/* Study Streak + Total XP — the reference's bottom pair */}
        <div className="flex flex-col gap-[4px] md:flex-row lg:flex-row">
          <div className="flex-1 rounded-[20px] p-6" style={{ backgroundColor: "rgb(200, 174, 255)" }}>
            <div className="mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days h-4 w-4 text-black">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                Study Streak
              </p>
            </div>
            <div className="mb-4 flex items-end gap-2">
              <span className="text-4xl font-light text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                {streakDays}
              </span>
              <span className="mb-1 text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                day{streakDays !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => {
                const active = i < streakDays;
                const date = new Date();
                date.setDate(date.getDate() - (streakDays - 1) + i);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-medium transition-all lg:h-10 lg:w-10"
                      style={{
                        backgroundColor: active ? "rgb(15, 14, 14)" : "rgb(245, 245, 245)",
                        color: active ? "white" : "rgb(15, 14, 14)",
                        fontFamily: '"Funnel Sans", sans-serif',
                      }}
                    >
                      {active ? FLAME_TILE : date.getDate()}
                    </div>
                    {/* S8-F7 (Trap 8): inline rgba — v4's text-black/40
                        serializes as oklab color-mix vs the live's v3
                        rgba(0,0,0,0.4); the session-7 later-icon precedent. */}
                    <span
                      className="text-xs font-light"
                      style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgba(0, 0, 0, 0.4)" }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1 rounded-[20px] p-6" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
            <div className="mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gem h-4 w-4 text-black">
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
                <path d="M2 9h20" />
              </svg>
              <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                Total XP
              </p>
            </div>
            <p className="text-3xl font-light text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              {xp}
            </p>
            <p className="mt-1 text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Keep learning to earn more XP!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
