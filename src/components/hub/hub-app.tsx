"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/mascot";
import { NoriChat } from "@/components/hub/nori-chat";
import { LessonView } from "@/components/hub/lesson-view";
import { stageLevelLabel } from "@/lib/domain";
import { ToastProvider } from "@/components/toast";
import { cn } from "@/lib/utils";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";

export type HubCourse = {
  id: string;
  courseName: string;
  roadmapSteps: string;
  lessonTitles: string[];
  lessonProgress: { lessonIndex: number; completed: boolean; correctCount: number; total: number }[];
};

type Tab = "learn" | "nori" | "lessons";

const ICONS = {
  brain: (className?: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-brain", className)}>
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
  ),
  message: (className?: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-message-circle", className)}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  ),
  list: (className?: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-list", className)}>
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
      <path d="M3 6h.01" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M8 6h13" />
    </svg>
  ),
  chevron: (className?: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-chevron-down", className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  trend: (className?: string) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-trending-up h-4 w-4", className)}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

const DEMO_LESSONS = [
  "Introduction",
  "Key Concepts",
  "Real Examples",
  "Problem Solving",
  "Deep Dive",
  "Mastery Check",
];

export function HubApp({
  user,
  course,
  courses,
  initialLesson,
  initialChat,
}: {
  user: DashboardUser;
  course: HubCourse | null;
  courses: { id: string; name: string; current: boolean }[];
  initialLesson: number;
  initialChat: { role: "user" | "assistant"; content: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("learn");
  const [activeLesson, setActiveLesson] = useState(initialLesson);
  const [progress, setProgress] = useState(
    course?.lessonProgress ?? [],
  );
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const courseMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  const titles = course?.lessonTitles ?? DEMO_LESSONS;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (courseMenuRef.current && !courseMenuRef.current.contains(e.target as Node)) {
        setCourseMenuOpen(false);
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setHelpMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function switchCourse(id: string) {
    setCourseMenuOpen(false);
    router.push(`/hub?course=${id}`);
  }

  function onLessonComplete(lessonIndex: number, correct: number, total: number) {
    setProgress((prev) => {
      const existing = prev.find((p) => p.lessonIndex === lessonIndex);
      if (existing) {
        return prev.map((p) =>
          p.lessonIndex === lessonIndex
            ? {
                ...p,
                correctCount: Math.max(p.correctCount, correct),
                completed: p.completed || correct >= total,
              }
            : p,
        );
      }
      return [...prev, { lessonIndex, completed: correct >= total, correctCount: correct, total }];
    });
  }

  const answered = progress
    .filter((p) => p.lessonIndex === activeLesson)
    .reduce((acc, p) => Math.max(acc, p.correctCount), 0);
  const lessonProgressLabel = `${Math.min(answered, 8)}/8`;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  /* ---------------- shared lesson sidebar list ---------------- */
  const lessonList = titles.map((title, i) => {
    const p = progress.find((x) => x.lessonIndex === i);
    const isActive = i === activeLesson;
    return { title, i, isActive, completed: p?.completed ?? false };
  });

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 14, 14)" }}>
        {/* ============ desktop header ============ */}
        <header
          className="mx-[4px] mt-0 hidden flex-shrink-0 items-center justify-between rounded-b-[20px] px-8 py-3 md:flex"
          style={{ backgroundColor: "rgb(255, 253, 115)" }}
        >
          <a href="/" className="flex items-center gap-2" aria-label="Thinkerwell home">
            <BrandMark />
            <span style={{ fontFamily: "Eczar, serif", fontWeight: 400, fontSize: "16px", position: "relative", top: "2px" }}>
              Thinkerwell
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              {course?.courseName ?? "Introduction"}
            </span>
            <div className="h-4 w-px bg-black/20" />
            {courses.length > 1 ? (
              <div className="relative" ref={courseMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={courseMenuOpen}
                  onClick={() => setCourseMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-black px-4 py-1.5 text-sm font-medium text-black transition-all hover:bg-black/5"
                  style={{ fontFamily: '"Funnel Sans", sans-serif' }}
                >
                  <span>Course</span>
                  {ICONS.chevron("h-4 w-4" + (courseMenuOpen ? " rotate-180 transition-transform" : " transition-transform"))}
                </button>
                {courseMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] bg-white shadow-xl"
                    style={{ minWidth: 200 }}
                  >
                    <div className="p-2">
                      {courses.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => switchCourse(c.id)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                            {c.name}
                          </span>
                          {c.current ? (
                            <span className="ml-auto text-xs text-black/40">current</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="relative" ref={helpMenuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={helpMenuOpen}
                onClick={() => setHelpMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all hover:bg-black/5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  ?
                </div>
                <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }} />
                {ICONS.chevron("h-3.5 w-3.5 text-black" + (helpMenuOpen ? " rotate-180 transition-transform" : " transition-transform"))}
              </button>
              {helpMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] bg-white shadow-xl"
                  style={{ minWidth: 200 }}
                >
                  <div className="p-3" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black font-semibold text-sm text-white">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">{user.name}</p>
                        <p className="text-xs text-black/50">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => router.push("/courses")}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
                    >
                      {ICONS.list("h-4 w-4 text-black")}
                      <span className="text-sm font-medium text-black">My Courses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out h-4 w-4 text-black">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                      </svg>
                      <span className="text-sm font-medium text-black">Log Out</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* ============ mobile header ============ */}
        <header
          className="mx-[4px] mt-0 flex flex-shrink-0 items-center justify-between rounded-b-[20px] px-4 py-3 md:hidden"
          style={{ backgroundColor: "rgb(255, 253, 115)" }}
        >
          <a href="/" className="flex items-center gap-1.5" aria-label="Dashboard">
            <BrandMark />
            <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              Dashboard
            </span>
          </a>
          <div />
          <button
            type="button"
            onClick={() => setTab("lessons")}
            className="flex items-center gap-1.5 rounded-full border border-black/20 px-3 py-1.5 text-xs font-medium text-black"
            style={{ fontFamily: '"Funnel Sans", sans-serif' }}
          >
            {ICONS.list("h-3.5 w-3.5")}
            Lessons
          </button>
        </header>

        {/* ============ desktop 3-pane ============ */}
        <div className="hidden flex-1 gap-[4px] px-[4px] pb-[4px] pt-[4px] md:flex" style={{ minHeight: 0 }}>
          {/* left: lessons sidebar */}
          <div className="flex w-[35%] flex-col gap-[4px]">
            <div className="rounded-[20px] p-5" style={{ backgroundColor: "rgb(210, 192, 249)" }}>
              <div style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                <div className="mb-4 rounded-xl px-3 py-3" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    {ICONS.trend()}
                    <p className="text-xs font-medium text-black">Lesson Progress</p>
                    <span className="ml-auto text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
                      {lessonProgressLabel}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0, 0, 0, 0.12)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(Math.min(answered, 8) / 8) * 100}%`, backgroundColor: "rgb(15, 14, 14)" }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {lessonList.map(({ title, i, isActive, completed }) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveLesson(i)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                      style={{
                        backgroundColor: isActive ? "rgb(255, 253, 115)" : "rgb(235, 235, 235)",
                        opacity: isActive ? 1 : 0.45,
                        border: "1px solid transparent",
                        cursor: isActive ? "pointer" : completed ? "pointer" : "pointer",
                      }}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: isActive ? "rgb(15, 14, 14)" : "rgb(208, 208, 208)" }}
                      >
                        <span className="text-xs font-semibold" style={{ color: isActive ? "white" : "rgb(89, 89, 89)" }}>
                          {completed ? "✓" : i + 1}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-light leading-tight" style={{ color: "rgb(89, 89, 89)" }}>
                          {isActive ? `Lesson ${i + 1} · Now` : `Lesson ${i + 1}`}
                        </p>
                        <p className="truncate text-sm font-medium leading-tight text-black">{title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* middle: Nori chat */}
          <div className="flex-1 overflow-hidden rounded-[20px]" style={{ backgroundColor: "rgb(248, 248, 248)", minHeight: 0 }}>
            <NoriChat courseId={course?.id ?? null} initialChat={initialChat} />
          </div>

          {/* right: lesson content */}
          <div className="flex-1 overflow-y-auto rounded-[20px] p-6" style={{ backgroundColor: "rgb(248, 248, 248)" }}>
            <LessonView
              key={`desktop-${activeLesson}`}
              courseId={course?.id ?? null}
              courseName={course?.courseName ?? null}
              lessonIndex={activeLesson}
              lessonTitle={titles[activeLesson] ?? DEMO_LESSONS[activeLesson]}
              progress={progress}
              onComplete={onLessonComplete}
              onLessonChange={setActiveLesson}
            />
          </div>
        </div>

        {/* ============ mobile tab shell ============ */}
        <div className="flex flex-1 flex-col md:hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {tab === "learn" ? (
              <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: "rgb(248, 248, 248)", borderRadius: 20, margin: "4px 4px 0px" }}>
                <LessonView
                  key={`mobile-${activeLesson}`}
                  courseId={course?.id ?? null}
                  courseName={course?.courseName ?? null}
                  lessonIndex={activeLesson}
                  lessonTitle={titles[activeLesson] ?? DEMO_LESSONS[activeLesson]}
                  progress={progress}
                  onComplete={onLessonComplete}
                  onLessonChange={setActiveLesson}
                />
              </div>
            ) : tab === "nori" ? (
              <div className="h-full" style={{ borderRadius: 20, margin: "4px 4px 0px", overflow: "hidden" }}>
                <NoriChat courseId={course?.id ?? null} initialChat={initialChat} />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: "rgb(210, 192, 249)", borderRadius: 20, margin: "4px 4px 0px" }}>
                <div className="mb-4 rounded-xl px-3 py-3" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    {ICONS.trend("h-4 w-4")}
                    <p className="text-xs font-medium text-black">Lesson Progress</p>
                    <span className="ml-auto text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
                      {lessonProgressLabel}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0, 0, 0, 0.12)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(Math.min(answered, 8) / 8) * 100}%`, backgroundColor: "rgb(15, 14, 14)" }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {lessonList.map(({ title, i, isActive, completed }) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveLesson(i);
                        setTab("learn");
                      }}
                      className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-all"
                      style={{
                        backgroundColor: isActive ? "rgb(255, 253, 115)" : "rgba(255, 255, 255, 0.6)",
                        fontFamily: '"Funnel Sans", sans-serif',
                      }}
                    >
                      <span
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: isActive ? "rgb(15, 14, 14)" : "rgba(0, 0, 0, 0.1)",
                          color: isActive ? "white" : "rgb(89, 89, 89)",
                        }}
                      >
                        {completed ? "✓" : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-light" style={{ color: "rgb(89, 89, 89)" }}>
                          {stageLevelLabel(i)}
                        </p>
                        <p className="truncate text-sm font-medium" style={{ color: "rgb(15, 14, 14)" }}>
                          {title}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="flex-shrink-0 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                          Active
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* bottom tab bar */}
          <div className="flex-shrink-0 px-[4px] pb-[4px] pt-[4px]">
            <div className="flex overflow-hidden rounded-[20px]" style={{ backgroundColor: "rgb(26, 26, 26)" }}>
              {(
                [
                  ["learn", "Learn", ICONS.brain],
                  ["nori", "Ask Nori", ICONS.message],
                  ["lessons", "Lessons", ICONS.list],
                ] as const
              ).map(([key, label, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className="flex flex-1 flex-col items-center gap-1 py-3.5 transition-all"
                  style={{
                    backgroundColor: tab === key ? "rgb(255, 253, 115)" : "transparent",
                    color: tab === key ? "rgb(15, 14, 14)" : "rgba(255, 255, 255, 0.4)",
                    fontFamily: '"Funnel Sans", sans-serif',
                  }}
                  aria-pressed={tab === key}
                >
                  {icon("h-5 w-5")}
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
