import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { generateCourseStages, generateGapAnalysis } from "@/lib/ai";
import { displayName, enrollmentMaterial } from "@/lib/domain";

// POST /api/quiz/submit — diagnostic results.
// Body: { courseId, answers: number[] (indices), total: number, score: number }
// → marks quiz completed, derives the roadmap + gap analysis, returns the
// navigation target (the reference lands on /?course=<id>).
// S11-F2: the score is the CLIENT-computed correct count (the live's
// E3 computes `filter((G, re) => G === c[re].ans).length` client-side and
// the entity write stores it) — validated here (0 ≤ score ≤ total), never
// re-derived from the answered count (the session-1 derivation scored
// every answered question correct).
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{
    courseId?: string;
    answers?: number[];
    total?: number;
    score?: number;
  }>(req);
  const courseId = body?.courseId;
  const answers = Array.isArray(body?.answers) ? body.answers : [];
  if (!courseId) return fail("VALIDATION", "courseId is required", 422);
  // S12-F8: a present-but-invalid payload is REJECTED (422) rather than
  // silently coerced — a malformed score/answers entry is a client bug the
  // caller should see. A MISSING score still degrades to 0 (the degraded
  // client path the session-11 spec pins).
  if (
    body?.score !== undefined &&
    (typeof body.score !== "number" ||
      !Number.isInteger(body.score) ||
      body.score < 0)
  ) {
    return fail("VALIDATION", "score must be a non-negative integer", 422);
  }
  if (
    answers.some((a) => typeof a !== "number" || !Number.isInteger(a) || a < -1 || a > 3)
  ) {
    return fail("VALIDATION", "answers entries must be indices in -1..3", 422);
  }

  const enrollment = await db.courseEnrollment.findUnique({ where: { id: courseId } });
  if (!enrollment || enrollment.userId !== user.id) {
    return fail("NOT_FOUND", "Course not found", 404);
  }

  const total = body?.total && body.total > 0 ? body.total : answers.length || 5;
  if (body?.score !== undefined && body.score > total) {
    return fail("VALIDATION", "score cannot exceed total", 422);
  }
  const score =
    typeof body?.score === "number" && Number.isInteger(body.score) && body.score >= 0 && body.score <= total
      ? body.score
      : 0;
  const pct = Math.round((score / total) * 100);
  // S12-F1: the broad custom-source predicate — material-mode enrollments
  // (the only writers of contentText) now feed the prompt context the
  // session-11 decode specified.
  const material = enrollmentMaterial(
    enrollment.contentSource,
    enrollment.contentText,
  );

  // S11-F4: the live's submit-time prompts — the pct-aware roadmap
  // ("Based on someone scoring {pct}%…") + the named gap analysis
  // ("A professional named {name} scored {score}/{total} ({pct}%)…").
  const [{ stages, aiGenerated: stagesAi }, { analysis, aiGenerated: gapAi }] =
    await Promise.all([
      generateCourseStages(enrollment.courseName, { pct, material }),
      generateGapAnalysis({
        subject: enrollment.courseName,
        score,
        total,
        name: displayName(user.email, user.fullName),
        material,
      }),
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
  // DiagnosticQuiz row (audit trail, the reference's entity) — S11-F6: the
  // live UPSERTS by (user, subject) so retakes update in place instead of
  // accumulating rows.
  const existing = await db.diagnosticQuiz.findFirst({
    where: { userId: user.id, subject: enrollment.courseName },
  });
  const quizData = {
    userId: user.id,
    subject: enrollment.courseName,
    score,
    gapAnalysis: analysis,
    roadmapSteps: JSON.stringify(stages),
  };
  if (existing) {
    await db.diagnosticQuiz.update({ where: { id: existing.id }, data: quizData });
  } else {
    await db.diagnosticQuiz.create({ data: quizData });
  }

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
