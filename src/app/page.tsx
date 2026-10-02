import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { displayName } from "@/lib/domain";
import { randomQuote } from "@/lib/quotes";
import { DashboardApp } from "@/components/dashboard/dashboard-app";

// The dashboard — the reference's home. Server-resolves the session and the
// learner's state (profile + enrollments + current course + progress) and
// hands ONE serializable snapshot to the client shell. Unauthenticated
// visitors are redirected to /login (the reference's from_url flow).
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?from_url=%2F");
  }

  const { course } = await searchParams;
  const [student, enrollments] = await Promise.all([
    db.student.findUnique({ where: { userId: user.id } }),
    db.courseEnrollment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { lessonProgress: true },
    }),
  ]);

  const currentId =
    course && enrollments.some((e) => e.id === course)
      ? course
      : (enrollments[0]?.id ?? null);
  const current = enrollments.find((e) => e.id === currentId) ?? null;

  return (
    <DashboardApp
      bubbleQuote={randomQuote()}
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
      currentCourseId={currentId}
      currentCourse={
        current
          ? {
              id: current.id,
              courseName: current.courseName,
              quizScore: current.quizScore,
              quizCompleted: current.quizCompleted,
              roadmapSteps: current.roadmapSteps,
              gapAnalysis: current.gapAnalysis,
              lessonProgress: current.lessonProgress.map((p) => ({
                lessonIndex: p.lessonIndex,
                completed: p.completed,
                correctCount: p.correctCount,
                total: p.total,
              })),
            }
          : null
      }
    />
  );
}
