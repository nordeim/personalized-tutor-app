import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { displayName } from "@/lib/domain";
import { QuizApp } from "@/components/quiz/quiz-app";

export const metadata: Metadata = { title: "Quiz Page" };
export const dynamic = "force-dynamic";

// The diagnostic quiz — the reference renders an error state when no
// student profile exists ("No student profile found. Please complete
// onboarding first."); otherwise it quizzes the current course (?course=).
export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?from_url=%2Fquiz");

  const { course } = await searchParams;
  const student = await db.student.findUnique({ where: { userId: user.id } });
  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">
          No student profile found. Please complete onboarding first.
        </p>
      </div>
    );
  }

  const enrollments = await db.courseEnrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const enrollment =
    (course && enrollments.find((e) => e.id === course)) ?? enrollments[0] ?? null;

  return (
    <QuizApp
      user={{ name: displayName(user.email, user.fullName), email: user.email }}
      course={
        enrollment
          ? { id: enrollment.id, courseName: enrollment.courseName }
          : null
      }
      studentName={student.name}
    />
  );
}
