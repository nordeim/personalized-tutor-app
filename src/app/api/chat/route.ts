import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { chatWithNori } from "@/lib/ai";

// POST /api/chat — Nori, the Socratic tutor.
// Body: { message, courseId?, currentQuestion? } → { reply, aiGenerated }.
// Persists both messages (chat history reloads with the Hub). When the hub
// reports the active quiz question, the AI prompt carries the reference's
// context prefix ([Current question: "…" — Options: …]) while the STORED
// user message stays the bare text (the live displays it stripped too).
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in required", 401);

  const body = await readJson<{
    message?: string;
    courseId?: string | null;
    currentQuestion?: { question?: string; options?: string[] } | null;
  }>(req);
  const message = body?.message?.trim();
  if (!message) return fail("VALIDATION", "message is required", 422);
  if (message.length > 2000) {
    return fail("VALIDATION", "Message too long (2000 chars max)", 422);
  }

  const courseId = body?.courseId ?? null;
  let subject: string | null = null;
  if (courseId) {
    const enrollment = await db.courseEnrollment.findUnique({ where: { id: courseId } });
    if (enrollment && enrollment.userId === user.id) {
      subject = enrollment.courseName;
    }
  }

  const history = await db.chatMessage.findMany({
    where: { userId: user.id, courseId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // The reference's context prefix — only for the AI, never persisted.
  const q = body?.currentQuestion;
  const options = Array.isArray(q?.options) ? q!.options.filter((o) => typeof o === "string") : [];
  const promptMessage =
    q && typeof q.question === "string" && options.length > 0
      ? `[Current question: "${q.question}" — Options: ${options.map((o, i) => `${i + 1}. ${o}`).join(", ")}]  Student: ${message}`
      : message;

  const { reply, aiGenerated } = await chatWithNori(
    [
      ...history.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
      { role: "user" as const, content: promptMessage },
    ],
    subject,
  );

  await db.chatMessage.createMany({
    data: [
      { userId: user.id, courseId, role: "user", content: message },
      { userId: user.id, courseId, role: "assistant", content: reply },
    ],
  });

  return ok({ reply, aiGenerated });
}
