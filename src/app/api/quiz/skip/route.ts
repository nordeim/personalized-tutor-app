import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

// POST /api/quiz/skip — S11-F5: the live's wO onSkip contract. Resets the
// enrollment to the quiz-incomplete state ({quiz_completed: false,
// quiz_score: 0, roadmap_steps: "", gap_analysis: ""}) + the student's
// quiz_completed flag, returning the navigation target (the course
// dashboard — the live's `/?course={id}`; the $P model renders the
// with-course dashboard at 0% for quiz-incomplete enrollments).
// NOTE: the live's skip ALSO fires an LLM roadmap call whose result is
// discarded by its own code (the enrollment write ships empty strings) —
// the wasted call is the live's bug, not a contract; the clone skips it.
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{ courseId?: string }>(req);
  const courseId = body?.courseId;
  if (!courseId) return fail("VALIDATION", "courseId is required", 422);

  const enrollment = await db.courseEnrollment.findUnique({ where: { id: courseId } });
  if (!enrollment || enrollment.userId !== user.id) {
    return fail("NOT_FOUND", "Course not found", 404);
  }

  await db.courseEnrollment.update({
    where: { id: courseId },
    data: {
      quizCompleted: false,
      quizScore: 0,
      roadmapSteps: "",
      gapAnalysis: "",
    },
  });
  await db.student.updateMany({
    where: { userId: user.id },
    data: { quizCompleted: false },
  });

  return ok({ courseId, redirectTo: `/?course=${courseId}` });
}
