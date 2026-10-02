import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { generateDiagnosticQuiz, type QuizQuestion } from "@/lib/ai";
import { enrollmentMaterial } from "@/lib/domain";

// POST /api/quiz/generate — diagnostic quiz questions for a course.
// Body: { courseId } → { questions, aiGenerated }.
// The reference generates exactly 5 questions (2 easy, 2 medium, 1 harder);
// the AI seam degrades to a static quiz when the LLM is unavailable.
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

  // S11-F4 + S12-F1: the live's material-context preamble — custom-SOURCED
  // courses (custom‖material — the broad predicate; the enrollment writers
  // emit "material" for paste-text courses, so the session-11 `=== "custom"`
  // gate was dead code) embed the learner's material (sliced to 3000 chars
  // in the prompt) in the quiz generation.
  const material = enrollmentMaterial(
    enrollment.contentSource,
    enrollment.contentText,
  );
  const { questions, aiGenerated } = await generateDiagnosticQuiz(
    enrollment.courseName,
    material,
  );
  return ok({ questions: questions satisfies QuizQuestion[], aiGenerated });
}
