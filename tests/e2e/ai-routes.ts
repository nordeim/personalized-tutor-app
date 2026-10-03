// SESSION-21 (S21-F1) — the CANONICAL AI route set: the single source of
// truth for "which API routes are AI-backed" in the test infrastructure.
// Both scanners import it:
//   - tests/e2e-conventions.test.ts (the trap-39 timeout convention —
//     every page.request call to an AI-backed route carries
//     timeout: 60_000) matches request paths against AI_BACKED_ROUTES;
//   - tests/e2e/shard-plan.ts (the balanced-shard weight model) counts
//     route-path mentions in spec sources via AI_ROUTE_PATTERN.
// The set previously lived in BOTH places and DRIFTED within the session
// that created the duplication (the shard-plan regex carried a seventh
// alternative, quiz/skip, that the conventions scanner deliberately
// excludes — its module comment and pin both claimed "the six routes the
// conventions scanner knows" while carrying seven). One module, one set.
//
// THE AUTHORITY (filesystem-pinned in tests/ai-routes.test.ts): the set
// is exactly the src/app/api/**/route.ts files that import @/lib/ai —
// challenge, chat, courses/generate, lessons/content, quiz/generate,
// quiz/submit. /api/quiz/skip is DELIBERATELY EXCLUDED: the live's skip
// fires an LLM roadmap call its own code discards (the enrollment write
// ships empty strings) — the wasted call is the live's bug, not a
// contract; the clone skips it (session-11 S11-F5), so that route makes
// NO AI call in the clone.

/** The six AI-backed route paths — the @/lib/ai importers, in the
 *  conventions scanner's original order. Filesystem-pinned. */
export const AI_BACKED_ROUTES: readonly string[] = [
  "/api/courses/generate",
  "/api/quiz/generate",
  "/api/quiz/submit",
  "/api/chat",
  "/api/lessons/content",
  "/api/challenge",
];

/** The route-set matcher, DERIVED from AI_BACKED_ROUTES (an orphan
 *  alternative is impossible by construction — the mutual-consistency
 *  pin in tests/ai-routes.test.ts holds the derivation). Matches route
 *  path mentions in spec sources (request calls, expectations, flow
 *  comments — a static proxy for the file's AI load).
 *
 *  NO /g flag — a stateful lastIndex would corrupt repeated .test()
 *  calls; countSpecSignals builds a fresh global regex from this
 *  pattern's source. */
export const AI_ROUTE_PATTERN = new RegExp(
  `api/(${AI_BACKED_ROUTES.map((r) => r.slice("/api/".length)).join("|")})`,
);
