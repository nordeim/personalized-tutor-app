"use client";

import { useMemo, useState } from "react";
import { AppHeader, type HeaderCourse } from "@/components/layout/app-header";
import { OnboardingDashboard } from "@/components/dashboard/onboarding-dashboard";
import { CourseDashboard } from "@/components/dashboard/course-dashboard";
import { parseRoadmap, lessonTitles } from "@/lib/domain";
import { ToastProvider } from "@/components/toast";

export type CourseProgressDto = {
  lessonIndex: number;
  completed: boolean;
  correctCount: number;
  total: number;
};

export type CourseDto = {
  id: string;
  courseName: string;
  contentSource?: string;
  quizScore?: number | null;
  quizCompleted?: boolean;
  roadmapSteps: string;
  gapAnalysis?: string | null;
  lessonProgress: CourseProgressDto[];
};

export type DashboardUser = { name: string; email: string };

export function DashboardApp({
  user,
  student,
  courses,
  currentCourseId,
  currentCourse,
  forceOnboarding = false,
  bubbleQuote,
}: {
  user: DashboardUser;
  student: { name: string; currentSubject: string | null; quizCompleted: boolean } | null;
  courses: CourseDto[];
  currentCourseId: string | null;
  currentCourse: CourseDto | null;
  forceOnboarding?: boolean;
  /** Server-picked random bubble line (fresh each page load, reference semantics). */
  bubbleQuote?: { raw: string; text: string; author: string | null };
}) {
  const [viewCourseId, setViewCourseId] = useState<string | null>(currentCourseId);

  const activeCourse = useMemo(() => {
    if (forceOnboarding) return null;
    if (viewCourseId) return courses.find((c) => c.id === viewCourseId) ?? null;
    return currentCourse;
  }, [forceOnboarding, viewCourseId, courses, currentCourse]);

  const headerCourses: HeaderCourse[] = courses.map((c) => ({
    id: c.id,
    name: c.courseName,
    current: c.id === activeCourse?.id,
  }));

  // The with-course dashboard needs a completed quiz (roadmap) to be useful —
  // otherwise the onboarding state renders (the reference's quiz-first flow).
  const showCourseDashboard =
    !forceOnboarding &&
    activeCourse !== null &&
    (activeCourse.quizCompleted || activeCourse.lessonProgress.length > 0);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 14, 14)" }}>
        <AppHeader user={user} courses={headerCourses} currentCourseId={activeCourse?.id ?? null} />
        {showCourseDashboard && activeCourse ? (
          <CourseDashboard
            key={activeCourse.id}
            user={user}
            bubbleQuote={bubbleQuote}
            course={{
              ...activeCourse,
              roadmap: parseRoadmap(activeCourse.roadmapSteps),
              lessonTitles: lessonTitles(parseRoadmap(activeCourse.roadmapSteps)),
            }}
            courses={courses.map((c) => ({
              id: c.id,
              name: c.courseName,
              current: c.id === activeCourse.id,
            }))}
          />
        ) : (
          <OnboardingDashboard
            user={user}
            studentName={student?.name ?? user.name}
            currentSubject={student?.currentSubject ?? null}
          />
        )}
      </div>
    </ToastProvider>
  );
}
