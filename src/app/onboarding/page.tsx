import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { displayName } from "@/lib/domain";
import { randomQuote } from "@/lib/quotes";
import { DashboardApp } from "@/components/dashboard/dashboard-app";

// /onboarding — the reference maps this onto the home dashboard's setup
// state; it is ALSO the "Add a Course" surface for users who already have
// courses, so it always renders the setup panel (never redirects away).
// S8-F1: anonymous visitors get the PUBLIC ONBOARDING (same surface as the
// root — Sign In pill + "Your Name" field + the pending deferral).
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <DashboardApp
        bubbleQuote={randomQuote()}
        user={null}
        student={null}
        courses={[]}
        currentCourseId={null}
        currentCourse={null}
        forceOnboarding
      />
    );
  }

  const [student, enrollments] = await Promise.all([
    db.student.findUnique({ where: { userId: user.id } }),
    db.courseEnrollment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { lessonProgress: true },
    }),
  ]);

  return (
    <DashboardApp
      user={{ name: displayName(user.email, user.fullName), email: user.email }}
      student={
        student
          ? {
              name: student.name,
              currentSubject: student.currentSubject,
              quizCompleted: student.quizCompleted,
            }
          : null
      }
      courses={enrollments.map((e) => ({
        id: e.id,
        courseName: e.courseName,
        contentSource: e.contentSource,
        quizScore: e.quizScore,
        quizCompleted: e.quizCompleted,
        roadmapSteps: e.roadmapSteps,
        gapAnalysis: e.gapAnalysis,
        lessonProgress: e.lessonProgress.map((p) => ({
          lessonIndex: p.lessonIndex,
          completed: p.completed,
          correctCount: p.correctCount,
          total: p.total,
        })),
      }))}
      currentCourseId={enrollments[0]?.id ?? null}
      currentCourse={null}
      forceOnboarding
    />
  );
}
