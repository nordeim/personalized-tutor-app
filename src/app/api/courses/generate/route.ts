import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { generateCourseStages } from "@/lib/ai";
import { displayName } from "@/lib/domain";

// POST /api/courses/generate — the onboarding flow's Continue button.
// Body: { mode: "topic" | "material", topic?, courseName?, contentText? }
// Creates/updates the Student profile + a CourseEnrollment, generates the
// 3-stage roadmap via the AI seam (static fallback when AI is down), and
// returns the enrollment id so the client can navigate to /quiz?course=<id>.
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{
    mode?: string;
    topic?: string;
    courseName?: string;
    contentText?: string;
  }>(req);

  const mode = body?.mode === "material" ? "material" : "topic";
  const topic = (mode === "material" ? body?.courseName : body?.topic)?.trim();
  const contentText = mode === "material" ? body?.contentText?.trim() : undefined;

  if (!topic || topic.length < 2) {
    return fail("VALIDATION", "Tell us what you want to learn first", 422);
  }
  if (mode === "material" && (!contentText || contentText.length < 20)) {
    return fail("VALIDATION", "Paste at least a few sentences of material", 422);
  }

  const name = displayName(user.email, user.fullName);

  // Student profile: create or refresh (the reference upserts on flow entry).
  const existingStudent = await db.student.findUnique({ where: { userId: user.id } });
  const studentData = {
    name,
    currentSubject: topic,
    contentSource: mode,
    contentText: contentText?.slice(0, 50_000) ?? null,
    quizCompleted: false,
  };
  if (existingStudent) {
    await db.student.update({ where: { userId: user.id }, data: studentData });
  } else {
    await db.student.create({ data: { userId: user.id, ...studentData } });
  }

  // Reuse an enrollment for the same course name; else create one.
  let enrollment = await db.courseEnrollment.findFirst({
    where: { userId: user.id, courseName: topic },
  });
  if (!enrollment) {
    const { stages, aiGenerated } = await generateCourseStages(topic);
    enrollment = await db.courseEnrollment.create({
      data: {
        userId: user.id,
        courseName: topic,
        contentSource: mode,
        contentText: contentText?.slice(0, 50_000) ?? null,
        roadmapSteps: JSON.stringify(stages),
      },
    });
    return ok({ courseId: enrollment.id, courseName: topic, roadmap: stages, aiGenerated }, 201);
  }

  return ok({
    courseId: enrollment.id,
    courseName: enrollment.courseName,
    roadmap: JSON.parse(enrollment.roadmapSteps || "[]"),
    aiGenerated: true,
  });
}
