import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Playwright global setup: guarantee the isolated e2e database exists and
 * carries the demo seed, so every spec run starts from the same state.
 *
 * The database lives at <repo>/db/e2e.db (gitignored like every db/*.db).
 * `DATABASE_URL="file:../db/e2e.db"` resolves against prisma/ for the CLI
 * and against the schema anchor at runtime — one file, both tools.
 *
 * SESSION-17 (S17-F2): the DB path rides E2E_DB so the sharded runner
 * (scripts/e2e-sharded.mjs) can give every shard its OWN file
 * (db/e2e-shard-{k}.db — pushed + seeded here, per shard). The default
 * keeps the serial mode byte-identical. Derivation contract:
 * tests/e2e/shard-env.ts (unit-pinned in tests/shard-env.test.ts).
 */
export default function globalSetup(): void {
  const repo = path.resolve(__dirname, "..", "..");
  const env = {
    ...process.env,
    DATABASE_URL: process.env.E2E_DB ?? "file:../db/e2e.db",
  } as NodeJS.ProcessEnv;

  // Prefer bun (the documented runtime); fall back to npx tsx for npm users.
  const run = (cmd: string) =>
    execSync(cmd, { cwd: repo, env, stdio: "pipe" }).toString();

  try {
    run("bunx prisma db push --skip-generate");
  } catch {
    run("npx prisma db push --skip-generate");
  }
  try {
    run("bun prisma/seed.ts");
  } catch {
    run("npx tsx prisma/seed.ts");
  }
}
