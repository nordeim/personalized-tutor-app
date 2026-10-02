import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

// POST /api/progress — record Hub quiz answers for one lesson.
// Body: { courseId, lessonIndex, correct, total } → upserted LessonProgress.
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{
    courseId?: string;
    lessonIndex?: number;
    correct?: number;
    total?: number;
  }>(req);
  const courseId = body?.courseId;
  const lessonIndex = typeof body?.lessonIndex === "number" ? body.lessonIndex : -1;
  if (!courseId || lessonIndex < 0 || lessonIndex > 5) {
    return fail("VALIDATION", "courseId and lessonIndex (0-5) are required", 422);
  }

  const enrollment = await db.courseEnrollment.findUnique({ where: { id: courseId } });
  if (!enrollment || enrollment.userId !== user.id) {
    return fail("NOT_FOUND", "Course not found", 404);
  }

  const correct = Math.max(0, Math.min(8, body?.correct ?? 0));
  const total = Math.max(1, Math.min(8, body?.total ?? 8));
  const completed = correct >= total; // the reference completes at full score

  const existing = await db.lessonProgress.findUnique({
    where: { userId_courseId_lessonIndex: { userId: user.id, courseId, lessonIndex } },
  });
  const progress = existing
    ? await db.lessonProgress.update({
        where: { userId_courseId_lessonIndex: { userId: user.id, courseId, lessonIndex } },
        data: {
          correctCount: Math.max(existing.correctCount, correct),
          total,
          completed: existing.completed || completed,
        },
      })
    : await db.lessonProgress.create({
        data: { userId: user.id, courseId, lessonIndex, correctCount: correct, total, completed },
      });

  return ok({
    lessonIndex: progress.lessonIndex,
    completed: progress.completed,
    correctCount: progress.correctCount,
    total: progress.total,
  });
}
