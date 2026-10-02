"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AddCourseModal } from "@/components/courses/add-course-modal";
import { derivedLessonsCompleted, quizProgressPercent, subjectIconName } from "@/lib/domain";
import { ToastProvider } from "@/components/toast";
import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  ChartColumnIncreasing,
  ChevronRight,
  Cpu,
  Globe,
  Landmark,
  Leaf,
  Megaphone,
  Music,
  Palette,
  Scale,
  Trash2,
} from "lucide-react";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";

export type CourseCard = {
  id: string;
  courseName: string;
  quizScore?: number | null;
  quizCompleted?: boolean;
  contentSource?: string | null;
};

// The courses dashboard — ported to the reference's CO card (session-3 R12):
// each course renders as its own #F8F8F8 rounded-[20px] card inside a
// gap-[4px] grid, with a BLACK subject-icon tile (keyword-mapped, like the
// live's bO), the "AI-Generated Course"/"Custom Material" badge, a Trash2
// delete + ChevronRight affordance, and the quiz-derived progress
// ("{round(score/5×6)}/6 lessons · {round(score/5×100)}%" + h-1.5 bar) —
// the live has no per-lesson entity, so the card never reads lesson progress.

const SUBJECT_ICONS: Record<string, typeof BookOpen> = {
  Calculator,
  Leaf,
  Atom,
  Landmark,
  Brain,
  ChartColumnIncreasing,
  Cpu,
  Music,
  Palette,
  Scale,
  Megaphone,
  Globe,
  BookOpen,
};

function SubjectIcon({ name, courseName, contentSource }: { name: string; courseName: string; contentSource?: string | null }) {
  const Icon = SUBJECT_ICONS[subjectIconName(courseName, contentSource)] ?? BookOpen;
  return <Icon className="h-5 w-5 text-white" strokeWidth={1.5} aria-label={name} />;
}

export function CoursesApp({ user, courses }: { user: DashboardUser; courses: CourseCard[] }) {
  const router = useRouter();
  const [list, setList] = useState(courses);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/courses/${id}`, { method: "DELETE" });
      setList((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 14, 14)" }}>
        <AppHeader user={user} />
        <div className="flex flex-1 gap-[4px] px-[4px] pb-[4px] pt-[4px]">
          <div className="flex flex-1 flex-col gap-[4px]">
            {/* welcome card */}
            <div className="rounded-[20px] px-8 py-6" style={{ backgroundColor: "rgb(248, 248, 248)" }}>
              <p className="text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                Welcome back
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

            {/* courses card */}
            <div className="flex flex-1 flex-col gap-3 rounded-[20px] p-6" style={{ backgroundColor: "rgb(248, 248, 248)" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                  Your Courses
                </p>
                <span className="text-xs font-light text-black/40" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                  {list.length} {list.length === 1 ? "course" : "courses"}
                </span>
              </div>

              {list.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-black/5">
                    <BookOpen className="h-7 w-7 text-black/30" strokeWidth={1.5} />
                  </div>
                  <p className="text-center text-sm font-light text-black/40" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                    No courses yet.
                    <br />
                    Add your first course to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-[4px]">
                  {list.map((c) => {
                    const pct = quizProgressPercent(c.quizScore, c.quizCompleted);
                    const lessons = derivedLessonsCompleted(pct);
                    return (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/?course=${c.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") router.push(`/?course=${c.id}`);
                        }}
                        className="flex w-full cursor-pointer flex-col gap-4 rounded-[20px] p-5 text-left transition-all hover:scale-[1.01]"
                        style={{ backgroundColor: "rgb(248, 248, 248)" }}
                        aria-label={`Open ${c.courseName}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-black">
                              <SubjectIcon name={c.courseName} courseName={c.courseName} contentSource={c.contentSource} />
                            </div>
                            <div>
                              <p className="text-base font-medium leading-tight text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                                {c.courseName}
                              </p>
                              <p className="mt-0.5 text-xs font-light text-black/40" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                                {c.contentSource === "custom" ? "Custom Material" : "AI-Generated Course"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                void remove(c.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation();
                                  void remove(c.id);
                                }
                              }}
                              aria-label={`Delete ${c.courseName}`}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9999px] transition-all hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-black/30 hover:text-red-400" strokeWidth={1.5} />
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-black/30" strokeWidth={1.5} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-light text-black/40" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                              {lessons}/{6} lessons
                            </span>
                            <span className="text-xs font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-[9999px] bg-black/10">
                            <div
                              className="h-full rounded-[9999px] bg-black transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-black/15 py-4 text-sm font-medium text-black/40 transition-all hover:border-black/30 hover:text-black/60"
                style={{ fontFamily: '"Funnel Sans", sans-serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="M12 5v19" />
                </svg>
                Add a Course
              </button>
            </div>
          </div>
        </div>

        {/* The reference's Q5 in-page modal (session-4): "Add a Course" opens
            the compact mode-picker here instead of navigating away; the submit
            creates the course and routes straight to the diagnostic quiz. */}
        {modalOpen ? (
          <AddCourseModal
            onClose={() => setModalOpen(false)}
            onAdded={(courseId) => {
              setModalOpen(false);
              if (courseId) {
                router.push(`/quiz?course=${courseId}`);
                router.refresh();
              }
            }}
          />
        ) : null}
      </div>
    </ToastProvider>
  );
}
