import { requireSession } from "@/lib/auth";
import { ok } from "@/lib/api";
import { generateDailyChallenge } from "@/lib/ai";

// POST /api/challenge — the dashboard's Daily Challenge question.
export async function POST() {
  const user = await requireSession();
  if (!user) return ok({ question: "What is the term for a market structure with only one seller and many buyers?" });
  const { question } = await generateDailyChallenge("learning");
  return ok({ question });
}
