"use client";

// ---------------------------------------------------------------------------
// Confetti presets — mined from the reference bundle. The live app fires
// canvas-confetti from two places:
//
//   1. The Hub (function Q): a center burst on level-up and DUAL side cannons
//      on course completion.
//   2. The dashboard right column (c_ — S12-F2's decode): TWO ref-guarded
//      effects — a 80-particle burst when the quiz-derived STREAK
//      (min(quizScore,7)) crosses exactly 3 or 7, and a 90-particle burst
//      when the MASTERY LABEL (Novice→Apprentice→…→Master, keyed off
//      scorePercent) changes. The diagnostic quiz itself (E3) fires
//      NOTHING — the session-2 mid-quiz placement was a misattribution.
//
// This wrapper keeps the exact presets in one client-only seam so components
// never import the library directly and the trigger logic stays unit-testable
// (confettiAt + masteryLabelTier in src/lib/domain.ts).
// ---------------------------------------------------------------------------

import confetti from "canvas-confetti";

/** Quiz-derived streak crossed 3 or 7 — the dashboard milestone burst. */
export function confettiQuizMilestone(): void {
  void confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 0.85, y: 0.4 },
    colors: ["#FFFD73", "#C8AEFF", "#0F0E0E"],
  });
}

/**
 * Mastery label changed (S12-F2c — the live's second dashboard trigger):
 * 90 particles at the upper-right, the same color triple.
 */
export function confettiLabelChange(): void {
  void confetti({
    particleCount: 90,
    spread: 60,
    origin: { x: 0.85, y: 0.3 },
    colors: ["#FFFD73", "#C8AEFF", "#0F0E0E"],
  });
}

/** Hub level-up — the center burst (purple/cyan/amber, reference colors). */
export function confettiLevelUp(): void {
  void confetti({
    particleCount: 70,
    spread: 60,
    origin: { x: 0.5, y: 0.3 },
    colors: ["#8b5cf6", "#06b6d4", "#f59e0b"],
  });
}

/** Course complete — BOTH side cannons, exactly the reference's two calls. */
export function confettiCourseComplete(): void {
  void confetti({
    particleCount: 120,
    angle: 60,
    spread: 70,
    origin: { x: 0 },
    colors: ["#8b5cf6", "#06b6d4", "#f59e0b"],
  });
  void confetti({
    particleCount: 120,
    angle: 120,
    spread: 70,
    origin: { x: 1 },
    colors: ["#8b5cf6", "#06b6d4", "#10b981"],
  });
}
