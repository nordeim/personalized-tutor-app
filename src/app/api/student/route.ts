import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { displayName } from "@/lib/domain";

// GET /api/student — the learner profile (null when none).
export async function GET() {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const student = await db.student.findUnique({ where: { userId: user.id } });
  return ok({
    student: student
      ? {
          name: student.name,
          currentSubject: student.currentSubject,
          contentSource: student.contentSource,
          contentText: student.contentText,
          quizCompleted: student.quizCompleted,
        }
      : null,
  });
}

// PUT /api/student — upsert the profile (name default = display name).
export async function PUT(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{
    name?: string;
    currentSubject?: string;
    contentSource?: string;
    contentText?: string;
    quizCompleted?: boolean;
  }>(req);

  const data = {
    name: body?.name?.trim() || displayName(user.email, user.fullName),
    currentSubject: body?.currentSubject ?? undefined,
    contentSource: body?.contentSource === "material" ? "material" : undefined,
    contentText: body?.contentText?.slice(0, 50_000) ?? undefined,
    quizCompleted: body?.quizCompleted ?? undefined,
  };

  const existing = await db.student.findUnique({ where: { userId: user.id } });
  const student = existing
    ? await db.student.update({ where: { userId: user.id }, data })
    : await db.student.create({ data: { userId: user.id, ...data } });

  return ok({
    student: {
      name: student.name,
      currentSubject: student.currentSubject,
      contentSource: student.contentSource,
      contentText: student.contentText,
      quizCompleted: student.quizCompleted,
    },
  });
}
