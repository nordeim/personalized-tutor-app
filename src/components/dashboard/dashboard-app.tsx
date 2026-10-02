"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { OnboardingDashboard } from "@/components/dashboard/onboarding-dashboard";
import { CourseDashboard } from "@/components/dashboard/course-dashboard";
import { confettiLabelChange, confettiQuizMilestone } from "@/lib/confetti";
import {
  confettiAt,
  lessonTitles,
  masteryLabelTier,
  parseRoadmap,
  quizProgressPercent,
  studyStreakDays,
} from "@/lib/domain";
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
  /** S8-F1: null = the anonymous (public onboarding) render — the header
   * shows the Sign In pill and the setup panel gains the name field. */
  user: DashboardUser | null;
  student:
    | {
        name: string;
        currentSubject: string | null;
        contentSource?: string | null;
        quizCompleted: boolean;
      }
    | null;
  courses: CourseDto[];
  currentCourseId: string | null;
  currentCourse: CourseDto | null;
  forceOnboarding?: boolean;
  /** Server-picked random bubble line (fresh each page load, reference semantics). */
  bubbleQuote?: { raw: string; text: string; author: string | null };
}) {
  const router = useRouter();

  // S13-F2: activeCourse derives from the URL-resolved currentCourseId PROP —
  // never from client state. The session-8 viewCourseId state was FROZEN at
  // mount (its setter had no caller), so a same-route course switch (the
  // CoursePill rows' router.push("/?course=" + id), the mobile Switch Course
  // rows) re-rendered this shell with the NEW props while activeCourse kept
  // resolving the mount-time course — the dashboard rendered STALE content
  // (empirically: the streak/XP stats of the pre-switch course persisted
  // until a full reload). Deriving from the prop fixes the switch AND
  // delivers the live's c_ confetti surface: a same-route switch re-renders
  // with fresh props (the shell does NOT remount — same type, same tree
  // position), the KEYED CourseDashboard remounts on the key change (the
  // content swap), and this UNKEYED shell's ref-guarded effects observe the
  // streak/label change exactly like the live's unkeyed c_. The refresh path
  // (the m_ rename flow) is unchanged: router.refresh() re-renders with the
  // same currentCourseId but fresh course data.
  const activeCourse = useMemo(() => {
    if (forceOnboarding) return null;
    if (currentCourseId) return courses.find((c) => c.id === currentCourseId) ?? null;
    return currentCourse;
  }, [forceOnboarding, currentCourseId, courses, currentCourse]);

  // S11-F3: the live's $P model — the with-course dashboard renders
  // whenever the enrollment EXISTS (the $P resolver sets the enrollment and
  // renders G5 unconditionally; quiz-incomplete courses show the 0% state,
  // which is where the quiz Skip/close paths land). The onboarding state
  // renders only with NO enrollment at all. (The session-1
  // quizCompleted-or-progress guard was drift — it re-rendered the
  // onboarding after a skipped/abandoned quiz where the live shows the 0%
  // dashboard.)
  const showCourseDashboard = !forceOnboarding && activeCourse !== null;

  // S12-F2b/c — the c_ port: the live's TWO dashboard confetti effects,
  // ref-guarded (first observation initializes without firing). They live
  // HERE (the unkeyed shell) rather than in CourseDashboard because the
  // keyed `<CourseDashboard key={activeCourse.id}>` remounts per course —
  // the live's c_ has NO key, so its refs persist across course switches;
  // observing the ACTIVE course at this level replicates that. (a) the
  // streak burst: 80 particles when min(quizScore,7) crosses EXACTLY 3 or
  // 7 upward; (b) the label burst: 90 particles when the mastery tier
  // (Novice→…→Master, keyed off scorePercent) CHANGES. Cross-route
  // navigations (quiz → dashboard) remount this shell → refs init without
  // firing, exactly like the live's G5 mount.
  const streakDays = studyStreakDays(activeCourse?.quizScore ?? 0);
  const label = masteryLabelTier(
    quizProgressPercent(activeCourse?.quizScore ?? null, activeCourse?.quizCompleted ?? null),
  );
  const streakConfettiRef = useRef<number | null>(null);
  const labelConfettiRef = useRef<string | null>(null);
  useEffect(() => {
    if (confettiAt(streakConfettiRef.current, streakDays)) {
      confettiQuizMilestone();
    }
    streakConfettiRef.current = streakDays;
  }, [streakDays]);
  useEffect(() => {
    if (labelConfettiRef.current !== null && labelConfettiRef.current !== label.label) {
      confettiLabelChange();
    }
    labelConfettiRef.current = label.label;
  }, [label.label]);

  // The with-course header renders the reference's two-dropdown split: the
  // CoursePill (labeled with the student's current_subject) + the m_ user
  // menu (context line + Update Preferences). The pill's enrollment list is
  // the OTHER courses — the live filters `course_name !== current_subject`.
  const pillSubject =
    showCourseDashboard && student?.currentSubject ? student.currentSubject : null;
  const headerEnrollments = pillSubject
    ? courses
        .filter((c) => c.courseName !== pillSubject)
        .map((c) => ({ id: c.id, name: c.courseName, source: c.contentSource ?? null }))
    : [];
  // The mobile menu's Switch Course list = ALL courses with the current flag
  // (the reference's `md:hidden` panel keeps the current row visible + checked).
  const mobileCourses = courses.map((c) => ({
    id: c.id,
    name: c.courseName,
    current: c.id === activeCourse?.id,
  }));

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 14, 14)" }}>
        <AppHeader
          user={user}
          currentSubject={pillSubject}
          enrollments={headerEnrollments}
          courses={mobileCourses}
          student={
            showCourseDashboard && student
              ? {
                  name: student.name,
                  currentSubject: student.currentSubject,
                  contentSource: student.contentSource ?? null,
                }
              : null
          }
          onStudentUpdated={() => router.refresh()}
          signedOut={user === null}
        />
        {showCourseDashboard && activeCourse && user ? (
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
            studentName={student?.name ?? user?.name ?? ""}
            currentSubject={student?.currentSubject ?? null}
            publicMode={user === null}
          />
        )}
      </div>
    </ToastProvider>
  );
}
