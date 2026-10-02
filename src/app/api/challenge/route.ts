import { requireSession } from "@/lib/auth";
import { ok } from "@/lib/api";
import { generateDailyChallenge } from "@/lib/ai";

export type ChallengePayload = {
  question: string;
  hint: string;
  options: string[];
  correctIndex: number;
  aiGenerated: boolean;
};

const FALLBACK: ChallengePayload = {
  question: "What is the term for a market structure with only one seller and many buyers?",
  hint: "Think about the prefix that means 'one'.",
  options: ["Oligopoly", "Monopoly", "Monopolistic competition", "Perfect competition"],
  correctIndex: 1,
  aiGenerated: false,
};

// POST /api/challenge — the dashboard's Daily Challenge. The reference's
// modal consumes {q, hint, answers, correct}; this route returns the same
// shape under the clone's naming ({question, hint, options, correctIndex}),
// always valid (AI or deterministic fallback).
export async function POST() {
  const user = await requireSession();
  if (!user) return ok(FALLBACK);
  const challenge = await generateDailyChallenge("learning");
  return ok(challenge);
}
