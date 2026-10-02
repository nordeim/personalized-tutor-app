import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { parseRoadmap } from "@/lib/domain";

// GET /api/courses — the signed-in user's enrollments with lesson progress.
export async function GET() {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const enrollments = await db.courseEnrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lessonProgress: true },
  });

  return ok(
    enrollments.map((e) => ({
      id: e.id,
      courseName: e.courseName,
      contentSource: e.contentSource,
      quizScore: e.quizScore,
      quizCompleted: e.quizCompleted,
      roadmap: parseRoadmap(e.roadmapSteps),
      gapAnalysis: e.gapAnalysis,
      createdAt: e.createdAt.toISOString(),
      lessonProgress: e.lessonProgress.map((p) => ({
        lessonIndex: p.lessonIndex,
        completed: p.completed,
        correctCount: p.correctCount,
        total: p.total,
      })),
    })),
  );
}

// POST /api/courses — direct create (sample "Try it" course).
// Body: { courseName, contentSource?, contentText? } → enrollment.
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{
    courseName?: string;
    contentSource?: string;
    contentText?: string;
    roadmapSteps?: unknown;
    gapAnalysis?: string;
  }>(req);
  const courseName = body?.courseName?.trim();
  if (!courseName) return fail("VALIDATION", "courseName is required", 422);
  const contentSource = body?.contentSource === "material" ? "material" : "topic";

  const existing = await db.courseEnrollment.findFirst({
    where: { userId: user.id, courseName },
  });
  if (existing) {
    return ok({ id: existing.id, courseName: existing.courseName });
  }

  const roadmapSteps =
    Array.isArray(body?.roadmapSteps) && body.roadmapSteps.length === 3
      ? JSON.stringify(body.roadmapSteps)
      : "[]";

  const created = await db.courseEnrollment.create({
    data: {
      userId: user.id,
      courseName,
      contentSource,
      contentText: body?.contentText?.slice(0, 50_000) ?? null,
      roadmapSteps,
      gapAnalysis: body?.gapAnalysis ?? null,
    },
  });

  return ok({ id: created.id, courseName: created.courseName }, 201);
}
