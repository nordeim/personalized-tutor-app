"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MascotWelcome } from "@/components/mascot";
import {
  completedLessonCount,
  courseProgressPercent,
  stageStatus,
  type Roadmap,
} from "@/lib/domain";
import { quoteOfTheDay } from "@/lib/quotes";
import type { CourseDto, DashboardUser } from "@/components/dashboard/dashboard-app";
import { useToast } from "@/components/toast";

type CourseView = CourseDto & { roadmap: Roadmap; lessonTitles: string[] };

const BOOK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open h-5 w-5 flex-shrink-0">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const TREND_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up h-5 w-5 flex-shrink-0">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const SPARKLE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-5 w-5 flex-shrink-0">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const LESSON_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play h-4 w-4 flex-shrink-0" style={{ color: "rgb(89, 89, 89)" }}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

export function CourseDashboard({
  user,
  course,
  demoPercent,
}: {
  user: DashboardUser;
  course: CourseView;
  courses: { id: string; name: string; current: boolean }[];
  /** The /demo route pins the reference's static marketing numbers (60%
   *  with 4/6 lessons — the live demo hardcodes them); real courses compute. */
  demoPercent?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const quote = useMemo(() => quoteOfTheDay(), []);
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

  const completedIdx = course.lessonProgress
    .filter((p) => p.completed)
    .map((p) => p.lessonIndex);
  const completed = completedLessonCount(course.lessonProgress);
  const progressPct = demoPercent ?? courseProgressPercent(completed);

  const [challenge, setChallenge] = useState<string>(
    "What is the term for a market structure with only one seller and many buyers?",
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/challenge", { method: "POST" });
        const json = (await res.json()) as
          | { ok: true; data: { question: string } }
          | { ok: false };
        if (!cancelled && json.ok) setChallenge(json.data.question);
      } catch {
        /* keep the fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stageDoneCount = course.roadmap.filter(
    (_, i) => stageStatus(i, completedIdx) === "done",
  ).length;
  const stageProgressPct = course.roadmap.length
    ? Math.round((stageDoneCount / course.roadmap.length) * 100)
    : 0;

  const lessonPct = (i: number) => {
    const p = course.lessonProgress.find((x) => x.lessonIndex === i);
    if (!p) return 0;
    return Math.round((p.correctCount / p.total) * 100);
  };

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
                  &ldquo;{quote.text}&rdquo; — {quote.author}
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
          <div className="flex flex-col gap-2 rounded-[20px] p-6" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
            {TREND_ICON}
            <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Course Progress
            </p>
            <p className="text-3xl font-normal text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              {progressPct}%
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-black transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              {completed}/6 lessons completed
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/hub?course=${course.id}`)}
            className="col-span-2 flex flex-col gap-2 rounded-[20px] p-6 text-left transition-all md:col-span-1"
            style={{ backgroundColor: "rgb(248, 248, 248)", cursor: "pointer" }}
            aria-label="Daily challenge — continue in the Hub"
          >
            {SPARKLE_ICON}
            <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              Daily Challenge
            </p>
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
              {challenge}
            </p>
          </button>
        </div>

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
              {stageDoneCount}/{course.roadmap.length || 3} stages
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
              const status = stageStatus(i, completedIdx);
              return (
                <div key={stage.title} className="flex flex-1 flex-col" style={{ paddingRight: 16 }}>
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
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                        <span>○</span> Upcoming
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-black transition-all duration-700"
                style={{ width: `${stageProgressPct}%` }}
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
            {BOOK_ICON}
            <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              Course Lessons
            </p>
          </div>
          <div className="scroll-slim flex-1 min-h-0 space-y-2 overflow-y-auto">
            {course.lessonTitles.map((title, i) => (
              <button
                key={i}
                type="button"
                onClick={() => router.push(`/hub?course=${course.id}&lesson=${i}`)}
                className="w-full rounded-xl px-3 py-2.5 text-left transition-all"
                style={{ backgroundColor: "rgb(245, 245, 245)", border: "1px solid transparent", cursor: "pointer" }}
                aria-label={`Open lesson ${i + 1}: ${title}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: completedIdx.includes(i) ? "rgb(15, 14, 14)" : "rgba(0, 0, 0, 0.1)",
                      color: completedIdx.includes(i) ? "white" : "rgb(89, 89, 89)",
                    }}
                  >
                    {completedIdx.includes(i) ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-light leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                      Lesson {i + 1}
                    </p>
                    <p className="truncate text-xs font-medium leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(15, 14, 14)" }}>
                      {title}
                    </p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full bg-black transition-all duration-700"
                        style={{ width: `${lessonPct(i)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {course.gapAnalysis ? (
            <p className="mt-3 text-xs font-light leading-snug" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
              {course.gapAnalysis}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
