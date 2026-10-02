"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { completedLessonCount, courseProgressPercent } from "@/lib/domain";
import { ToastProvider } from "@/components/toast";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";

export type CourseCard = {
  id: string;
  courseName: string;
  quizScore?: number | null;
  quizCompleted?: boolean;
  lessonTitles: string[];
  lessonProgress: { lessonIndex: number; completed: boolean; correctCount: number; total: number }[];
};

// The courses dashboard: "Welcome back" + big-name hero card, then the
// courses card — rows (icon + name + quiz progress) with per-course
// delete, or the empty state with the dashed "Add a Course" CTA.

export function CoursesApp({ user, courses }: { user: DashboardUser; courses: CourseCard[] }) {
  const router = useRouter();
  const [list, setList] = useState(courses);
  const [deleting, setDeleting] = useState<string | null>(null);

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open h-6 w-6 text-black/30">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <p className="text-center text-sm font-light text-black/40" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                    No courses yet.
                    <br />
                    Add your first course to get started.
                  </p>
                </div>
              ) : (
                <div className="scroll-slim flex flex-1 flex-col gap-2 overflow-y-auto" style={{ maxHeight: "24rem" }}>
                  {list.map((c) => {
                    const completed = completedLessonCount(c.lessonProgress);
                    const pct = courseProgressPercent(completed);
                    const score = c.quizScore ?? 0;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-[16px] px-4 py-4 transition-all"
                        style={{ backgroundColor: "rgb(245, 245, 245)" }}
                      >
                        <span
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-sm font-semibold"
                          style={{ backgroundColor: "rgb(200, 174, 255)", color: "rgb(15, 14, 14)" }}
                        >
                          {c.courseName.slice(0, 1).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => router.push(`/?course=${c.id}`)}
                          className="min-w-0 flex-1 text-left"
                          aria-label={`Open ${c.courseName}`}
                        >
                          <p className="truncate text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                            {c.courseName}
                          </p>
                          <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                            {completed}/6 lessons · quiz {score}/7
                          </p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10">
                            <div
                              className="h-full rounded-full bg-black transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(c.id)}
                          disabled={deleting === c.id}
                          aria-label={`Delete ${c.courseName}`}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all hover:bg-black/10 disabled:opacity-40"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 h-4 w-4" style={{ color: "rgb(89, 89, 89)" }}>
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <a
                href="/onboarding"
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-black/15 py-4 text-sm font-medium text-black/40 transition-all hover:border-black/30 hover:text-black/60"
                style={{ fontFamily: '"Funnel Sans", sans-serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="M12 5v19" />
                </svg>
                Add a Course
              </a>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
