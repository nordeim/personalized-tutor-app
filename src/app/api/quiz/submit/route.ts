import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { generateCourseStages, generateGapAnalysis } from "@/lib/ai";

// POST /api/quiz/submit — diagnostic results.
// Body: { courseId, answers: number[] (indices), total: number } →
// marks quiz completed, derives the roadmap + gap analysis, returns
// the navigation target (the reference lands on /?course=<id>).
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{ courseId?: string; answers?: number[]; total?: number }>(req);
  const courseId = body?.courseId;
  const answers = Array.isArray(body?.answers) ? body.answers : [];
  if (!courseId) return fail("VALIDATION", "courseId is required", 422);

  const enrollment = await db.courseEnrollment.findUnique({ where: { id: courseId } });
  if (!enrollment || enrollment.userId !== user.id) {
    return fail("NOT_FOUND", "Course not found", 404);
  }

  const total = body?.total && body.total > 0 ? body.total : answers.length || 7;
  const score = answers.reduce((acc, a) => (a >= 0 ? acc + 1 : acc), 0);

  // Fresh roadmap + gap analysis for the measured level.
  const [{ stages, aiGenerated: stagesAi }, { analysis, aiGenerated: gapAi }] =
    await Promise.all([
      generateCourseStages(enrollment.courseName),
      generateGapAnalysis(enrollment.courseName, score),
    ]);

  await db.courseEnrollment.update({
    where: { id: courseId },
    data: {
      quizScore: score,
      quizCompleted: true,
      roadmapSteps: JSON.stringify(stages),
      gapAnalysis: analysis,
    },
  });
  await db.student.updateMany({
    where: { userId: user.id },
    data: { quizCompleted: true },
  });
  // DiagnosticQuiz row (audit trail, the reference's entity).
  await db.diagnosticQuiz.create({
    data: {
      userId: user.id,
      subject: enrollment.courseName,
      score,
      gapAnalysis: analysis,
      roadmapSteps: JSON.stringify(stages),
    },
  });

  return ok({
    courseId,
    score,
    total,
    roadmap: stages,
    gapAnalysis: analysis,
    aiGenerated: stagesAi && gapAi,
    redirectTo: `/?course=${courseId}`,
  });
}
