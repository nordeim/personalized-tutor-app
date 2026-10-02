"use client";

// ---------------------------------------------------------------------------
// Confetti presets — mined from the reference bundle. The live app fires
// canvas-confetti from two places:
//
//   1. The Hub (function Q): a center burst on level-up and DUAL side cannons
//      on course completion.
//   2. The dashboard right card (c_): a burst when the diagnostic quiz score
//      CROSSES 3 or 7 (guarded by a ref).
//
// This wrapper keeps the exact presets in one client-only seam so components
// never import the library directly and the trigger logic stays unit-testable
// (confettiAt in src/lib/domain.ts).
// ---------------------------------------------------------------------------

import confetti from "canvas-confetti";

/** Quiz score crossed 3 or 7 — the dashboard milestone burst. */
export function confettiQuizMilestone(): void {
  void confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 0.85, y: 0.4 },
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
