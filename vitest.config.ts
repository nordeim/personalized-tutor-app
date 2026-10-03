import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit-test layer for the pure domain seams (the mastery grid and roadmap
// parsing in domain.ts, the SQLite URL resolution in db-path.ts, the
// 99-line content pool + gamification math + retry re-queue in the session-2
// parity pins). Browser/E2E coverage lives in tests/e2e/*.spec.ts
// (Playwright — never picked up by this config, which matches *.test.ts only).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    // SESSION-16 (S16-F3): worker reuse across files — a 5× wall-clock win
    // (1.9s → ~0.4s for the 15 files). Validated empirically before adoption:
    // 5 full runs green (3 sequential + --sequence.shuffle with 2 different
    // seeds — file-order randomization) at 182/182, including the ai-seam
    // transport-capture pins (session-14's captured req.messages assertions
    // would fail on any vi.mock leakage across the shared worker). Safe here
    // by doctrine: the unit layer tests PURE seams (domain/quotes/db-path —
    // zero shared state). RE-VALIDATE (re-run with a shuffle seed) whenever
    // a stateful or mock-heavy test file joins the suite.
    isolate: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` is a bundler directive, not a real package (Next provides
      // its own shim at build time). The node test environment resolves this
      // stub so the AI seam (src/lib/ai.ts) is unit-testable.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
});
