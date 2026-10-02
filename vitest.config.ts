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
