import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { generateLessonContent } from "@/lib/ai";

// POST /api/lessons/content — the Hub's per-lesson material.
// Body: { courseId, lessonIndex } → { title, concept, scenario, challenge,
// questions[8] × {question, options, correctIndex, contentType, contentText},
// aiGenerated }. The "level" fed to the generator is the 1-based STAGE
// number (floor(lessonIndex/2)+1) exactly like the live's Y2 wiring.
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{ courseId?: string; lessonIndex?: number }>(req);
  const courseId = body?.courseId;
  const lessonIndex = typeof body?.lessonIndex === "number" ? body.lessonIndex : 0;
  if (!courseId) return fail("VALIDATION", "courseId is required", 422);
  if (lessonIndex < 0 || lessonIndex > 5) {
    return fail("VALIDATION", "lessonIndex out of range", 422);
  }

  const enrollment = await db.courseEnrollment.findUnique({ where: { id: courseId } });
  if (!enrollment || enrollment.userId !== user.id) {
    return fail("NOT_FOUND", "Course not found", 404);
  }

  // Lesson focus: derive from the roadmap stage title, else default grid.
  const roadmap = JSON.parse(enrollment.roadmapSteps || "[]") as { title?: string }[];
  const stage = Math.floor(lessonIndex / 2);
  const stageTitle = typeof roadmap[stage]?.title === "string" ? roadmap[stage].title : undefined;
  const focus =
    stageTitle ??
    ["Introduction", "Key Concepts", "Real Examples", "Problem Solving", "Deep Dive", "Mastery Check"][lessonIndex];

  const content = await generateLessonContent(
    stage + 1,
    enrollment.courseName,
    focus,
    stageTitle,
  );
  return ok(content);
}
