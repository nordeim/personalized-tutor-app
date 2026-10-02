import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parseRoadmap, lessonTitles } from "@/lib/domain";
import { HubApp } from "@/components/hub/hub-app";

export const metadata: Metadata = { title: "The Hub" };
export const dynamic = "force-dynamic";

// The Hub — the learning workspace. Desktop renders three panes (lessons
// sidebar / Nori chat / lesson content); mobile renders the Learn/Ask
// Nori/Lessons tab shell with the dark bottom bar. The reference also has a
// demo fallback when no course exists (the "Introduction" default grid).
export default async function HubPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; lesson?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?from_url=%2Fhub");

  const { course, lesson } = await searchParams;
  const [enrollments, chat, student] = await Promise.all([
    db.courseEnrollment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { lessonProgress: true },
    }),
    db.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    db.student.findUnique({ where: { userId: user.id } }),
  ]);

  // S8-F8: an explicit ?course= that matches NO enrollment renders the hub
  // with NO course (the default-grid hub — the live's observed behavior for
  // unowned ids); the no-param default stays the newest enrollment.
  const matched = course ? enrollments.find((e) => e.id === course) : undefined;
  const enrollment = course ? (matched ?? null) : (enrollments[0] ?? null);
  const lessonParam = Number.parseInt(lesson ?? "0", 10);
  const initialLesson = Number.isInteger(lessonParam) && lessonParam >= 0 && lessonParam <= 5 ? lessonParam : 0;

  const currentChat = enrollment
    ? chat.filter((m) => m.courseId === enrollment.id)
    : [];
  return (
    <HubApp
      course={
        enrollment
          ? {
              id: enrollment.id,
              courseName: enrollment.courseName,
              currentSubject: student?.currentSubject ?? null,
              roadmapSteps: enrollment.roadmapSteps,
              lessonTitles: lessonTitles(parseRoadmap(enrollment.roadmapSteps)),
              lessonProgress: enrollment.lessonProgress.map((p) => ({
                lessonIndex: p.lessonIndex,
                completed: p.completed,
                correctCount: p.correctCount,
                total: p.total,
              })),
            }
          : null
      }
      courses={enrollments.map((e) => ({
        id: e.id,
        name: e.courseName,
      }))}
      initialLesson={initialLesson}
      initialChat={currentChat.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }))}
    />
  );
}
