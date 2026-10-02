import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { generateDiagnosticQuiz, type QuizQuestion } from "@/lib/ai";

// POST /api/quiz/generate — diagnostic quiz questions for a course.
// Body: { courseId } → { questions, aiGenerated }.
// The reference generates 7 questions; the AI seam degrades to a static
// quiz when the LLM is unavailable.
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

  const { questions, aiGenerated } = await generateDiagnosticQuiz(enrollment.courseName);
  return ok({ questions: questions satisfies QuizQuestion[], aiGenerated });
}
