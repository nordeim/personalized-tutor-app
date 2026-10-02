"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/mascot";
import { NoriChat } from "@/components/hub/nori-chat";
import { LessonView } from "@/components/hub/lesson-view";
import { stageLevelLabel } from "@/lib/domain";
import { ToastProvider } from "@/components/toast";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  List,
  Lock,
  LogOut,
  MessageCircle,
  Brain,
} from "lucide-react";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";

export type HubCourse = {
  id: string;
  courseName: string;
  roadmapSteps: string;
  lessonTitles: string[];
  lessonProgress: { lessonIndex: number; completed: boolean; correctCount: number; total: number }[];
};

type Tab = "learn" | "nori" | "lessons";

const DEMO_LESSONS = [
  "Introduction",
  "Key Concepts",
  "Real Examples",
  "Problem Solving",
  "Deep Dive",
  "Mastery Check",
];

// The Hub — the learning workspace. Desktop renders three panes (lessons
// sidebar / Nori chat / lesson content); mobile renders the Learn/Ask Nori/
// Lessons tab shell with the dark bottom bar. Session-3 remediation R8 ports
// the sidebar to the reference's 3-state lesson rows (done/active/locked —
// the active lesson index drives all three, exactly like the live's qP), the
// Lesson Progress card to the reference's session-scoped "{answered + 1}/8"
// label, and the mobile lessons sheet to the reference's black-active rows
// with the "All Lessons" header.

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
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; options: string[] } | null>(null);
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

  function selectLesson(index: number) {
    setActiveLesson(index);
    setSessionAnswered(0);
    setCurrentQuestion(null);
    setTab("learn");
  }

  function onLessonComplete() {
    // The dashboard reads quiz-derived progress (the reference's model — it
    // has no per-lesson entity); the LessonView persists the completion via
    // its own POST, so the hub keeps no visual completion state.
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  /* ---------------- shared lesson sidebar list ---------------- */
  // The reference's 3 states, keyed off the ACTIVE lesson index (qP):
  //   done (i < active) / active (i === active) / locked (i > active,
  //   opacity .45, Lock icon, not clickable).
  const lessonList = titles.map((title, i) => {
    const isActive = i === activeLesson;
    const isDone = i < activeLesson;
    const isLocked = i > activeLesson;
    return { title, i, isActive, isDone, isLocked };
  });

  const lessonProgressLabel = `${Math.min(sessionAnswered + 1, 8)}/8`;
  const lessonProgressPct = Math.round((Math.min(sessionAnswered, 8) / 8) * 100);

  const subject = course?.courseName ?? "General";

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
                <ChevronDown
                  className={cn("h-3.5 w-3.5 text-black transition-transform", courseMenuOpen && "rotate-180")}
                  strokeWidth={2}
                />
              </button>
              {courseMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] bg-white shadow-xl"
                  style={{ minWidth: 200 }}
                >
                  <div className="p-2">
                    {courses.length === 0 ? (
                      <p className="px-3 py-2.5 text-sm font-light text-black/40" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                        No courses yet
                      </p>
                    ) : (
                      courses.map((c) => (
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
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
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
                <ChevronDown
                  className={cn("h-3.5 w-3.5 text-black transition-transform", helpMenuOpen && "rotate-180")}
                  strokeWidth={2}
                />
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
                      <List className="h-4 w-4 text-black" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-black">My Courses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 text-black" strokeWidth={1.5} />
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
            <ChevronLeft className="h-4 w-4 text-black" strokeWidth={2} />
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
            <List className="h-3.5 w-3.5" strokeWidth={1.5} />
            Lessons
          </button>
        </header>

        {/* ============ desktop 3-pane ============ */}
        <div className="hidden flex-1 gap-[4px] px-[4px] pb-[4px] pt-[4px] md:flex" style={{ minHeight: 0 }}>
          {/* left: lessons sidebar */}
          <div className="flex w-[35%] flex-col gap-[4px]">
            <div className="rounded-[20px] p-5" style={{ backgroundColor: "rgb(210, 192, 249)" }}>
              <div style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                {/* lesson progress card (the reference's session-scoped counter) */}
                <div className="mb-4 rounded-xl px-3 py-3" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-black" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-black">Lesson Progress</p>
                    <span className="ml-auto text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
                      {lessonProgressLabel}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0, 0, 0, 0.12)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${lessonProgressPct}%`, backgroundColor: "rgb(15, 14, 14)" }}
                    />
                  </div>
                </div>
                {/* the reference's 3-state lesson rows */}
                <div className="space-y-2">
                  {lessonList.map(({ title, i, isActive, isDone, isLocked }) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!isLocked) selectLesson(i);
                      }}
                      disabled={isLocked}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                      style={{
                        backgroundColor: isActive
                          ? "rgb(255, 253, 115)"
                          : isDone
                            ? "rgb(220, 220, 220)"
                            : "rgb(235, 235, 235)",
                        opacity: isLocked ? 0.45 : 1,
                        border: "1px solid transparent",
                        cursor: isLocked ? "default" : "pointer",
                      }}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: isActive || isDone ? "rgb(15, 14, 14)" : "rgb(208, 208, 208)",
                        }}
                      >
                        {isDone ? (
                          <CircleCheckBig className="h-4 w-4 text-white" strokeWidth={1.5} />
                        ) : isLocked ? (
                          <Lock className="h-3.5 w-3.5 text-black/30" strokeWidth={1.5} />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-light leading-tight" style={{ color: "rgb(89, 89, 89)" }}>
                          {`Lesson ${i + 1}${isDone ? " · Done" : isActive ? " · Now" : ""}`}
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
            <NoriChat courseId={course?.id ?? null} initialChat={initialChat} currentQuestion={currentQuestion} />
          </div>

          {/* right: lesson content */}
          <div className="flex-1 overflow-y-auto rounded-[20px] p-6" style={{ backgroundColor: "rgb(248, 248, 248)" }}>
            <LessonView
              key={`desktop-${course?.id ?? "demo"}-${activeLesson}`}
              courseId={course?.id ?? null}
              courseName={course?.courseName ?? null}
              lessonIndex={activeLesson}
              lessonTitle={titles[activeLesson] ?? DEMO_LESSONS[activeLesson]}
              subject={subject}
              onComplete={onLessonComplete}
              onLessonChange={selectLesson}
              onAnswered={setSessionAnswered}
              onQuestionChange={setCurrentQuestion}
            />
          </div>
        </div>

        {/* ============ mobile tab shell ============ */}
        <div className="flex flex-1 flex-col md:hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {tab === "learn" ? (
              <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: "rgb(248, 248, 248)", borderRadius: 20, margin: "4px 4px 0px" }}>
                <LessonView
                  key={`mobile-${course?.id ?? "demo"}-${activeLesson}`}
                  courseId={course?.id ?? null}
                  courseName={course?.courseName ?? null}
                  lessonIndex={activeLesson}
                  lessonTitle={titles[activeLesson] ?? DEMO_LESSONS[activeLesson]}
                  subject={subject}
                  onComplete={onLessonComplete}
                  onLessonChange={selectLesson}
                  onAnswered={setSessionAnswered}
                  onQuestionChange={setCurrentQuestion}
                />
              </div>
            ) : tab === "nori" ? (
              <div className="h-full" style={{ borderRadius: 20, margin: "4px 4px 0px", overflow: "hidden" }}>
                <NoriChat courseId={course?.id ?? null} initialChat={initialChat} currentQuestion={currentQuestion} />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: "rgb(210, 192, 249)", borderRadius: 20, margin: "4px 4px 0px" }}>
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-wider text-black/60"
                  style={{ fontFamily: '"Funnel Sans", sans-serif' }}
                >
                  All Lessons
                </p>
                <div className="space-y-2">
                  {lessonList.map(({ title, i, isActive }) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectLesson(i)}
                      className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-all"
                      style={{
                        backgroundColor: isActive ? "rgb(15, 14, 14)" : "rgba(255, 255, 255, 0.6)",
                        fontFamily: '"Funnel Sans", sans-serif',
                      }}
                    >
                      <span
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: isActive ? "rgb(255, 253, 115)" : "rgba(0, 0, 0, 0.1)",
                          color: isActive ? "rgb(15, 14, 14)" : "rgb(89, 89, 89)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[10px] font-light"
                          style={{ color: isActive ? "rgba(255, 255, 255, 0.5)" : "rgb(89, 89, 89)" }}
                        >
                          {stageLevelLabel(i)}
                        </p>
                        <p
                          className="truncate text-sm font-medium"
                          style={{ color: isActive ? "rgb(255, 255, 255)" : "rgb(15, 14, 14)" }}
                        >
                          {title}
                        </p>
                      </div>
                      {isActive ? (
                        <span
                          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: "rgb(255, 253, 115)", color: "rgb(15, 14, 14)" }}
                        >
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
                  ["learn", "Learn", Brain],
                  ["nori", "Ask Nori", MessageCircle],
                  ["lessons", "Lessons", List],
                ] as const
              ).map(([key, label, Icon]) => (
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
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
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
