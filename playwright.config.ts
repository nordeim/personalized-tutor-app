import { defineConfig, devices } from "@playwright/test";

// E2E layer (v2.3): boots the PRODUCTION standalone server on an isolated
// port with its own scratch database (db/e2e.db, schema-pushed + seeded by
// the global setup), then drives the real UI in Chromium.
//
// Prerequisites: `bun run build` (the standalone server must exist).
// Run with: `bun run test:e2e`.
//
// Auth strategy: the "setup" project signs the demo user in ONCE and saves
// the session cookie to tests/e2e/.auth/user.json; every spec in the main
// project starts with that storageState. This is not just speed — the auth
// endpoints are rate-limited (10 attempts/IP/15 min), so per-test logins
// would trip the limiter mid-suite. tests/e2e/auth.spec.ts opts back out
// with an empty storageState because it tests the logged-out surface.
//
// The unit layer stays in Vitest (see vitest.config.ts — it matches
// *.test.ts only, so these *.spec.ts / *.setup.ts files are never picked
// up twice).

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;
// SESSION-17 (S17-F2): the DB + auth-state paths are env-parameterized so
// the sharded runner (scripts/e2e-sharded.mjs) can hand every shard its
// OWN SQLite file + storageState — the defaults keep the serial mode
// byte-identical to the pre-session harness. Derivation contract:
// tests/e2e/shard-env.ts (unit-pinned in tests/shard-env.test.ts).
const E2E_DATABASE_URL = process.env.E2E_DB ?? "file:../db/e2e.db";
const AUTH_STATE = process.env.E2E_AUTH ?? "tests/e2e/.auth/user.json";
// Per-shard artifacts (traces, failure screenshots): a SHARED test-results/
// is a cross-process race — concurrent playwright runs clobber each other's
// .playwright-artifacts-* and the losers fail on disposal ENOENTs.
const OUTPUT_DIR = process.env.E2E_OUTPUT ?? "test-results";
// Sharded mode never reuses an existing server: a leftover process on a
// shard port would carry the WRONG DB. Serial mode keeps the reuse
// behavior (the documented convenience for local iteration).
const SHARDED = process.env.E2E_SHARDED === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: OUTPUT_DIR,
  fullyParallel: false,
  workers: 1, // one worker: the specs share a single seeded SQLite file
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE,
      },
    },
  ],
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: {
    command: "bun .next/standalone/server.js",
    url: `${BASE_URL}/api/health`,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI && !SHARDED,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      DATABASE_URL: E2E_DATABASE_URL,
      AUTH_SECRET: "playwright-e2e-session-secret",
    } as Record<string, string>,
  },
});
