import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

// DELETE /api/courses/[id] — remove one enrollment (owner-only).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const { id } = await params;
  const enrollment = await db.courseEnrollment.findUnique({ where: { id } });
  if (!enrollment || enrollment.userId !== user.id) {
    return fail("NOT_FOUND", "Course not found", 404);
  }

  await db.courseEnrollment.delete({ where: { id } });
  return ok({ deleted: id });
}
