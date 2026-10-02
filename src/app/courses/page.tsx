import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { displayName, parseRoadmap, lessonTitles } from "@/lib/domain";
import { CoursesApp } from "@/components/courses/courses-app";

export const metadata: Metadata = { title: "Courses Dashboard" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from_url=%2Fcourses");

  const enrollments = await db.courseEnrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lessonProgress: true },
  });

  return (
    <CoursesApp
      user={{ name: displayName(user.email, user.fullName), email: user.email }}
      courses={enrollments.map((e) => {
        const roadmap = parseRoadmap(e.roadmapSteps);
        return {
          id: e.id,
          courseName: e.courseName,
          quizScore: e.quizScore,
          quizCompleted: e.quizCompleted,
          lessonTitles: lessonTitles(roadmap),
          lessonProgress: e.lessonProgress.map((p) => ({
            lessonIndex: p.lessonIndex,
            completed: p.completed,
            correctCount: p.correctCount,
            total: p.total,
          })),
        };
      })}
    />
  );
}
