// SESSION-17 (S17-F2) — the pure per-shard env derivation for the sharded
// e2e harness. One source of truth, consumed by playwright.config.ts (via
// scripts/e2e-sharded.mjs setting the env vars), tests/e2e/global-setup.ts
// (E2E_DB), tests/e2e/auth.setup.ts (E2E_AUTH), and the wrapper itself.
// Unit-pinned in tests/shard-env.test.ts.
//
// Why these defaults:
//   - ports 3111+ sit clear of the SERIAL default 3100, so a leftover
//     serial-run orphan can never be silently reused by a shard (with the
//     WRONG database behind it);
//   - the DB file lives next to the serial db/e2e.db (git-ignored via
//     db/*.db; pushed + seeded per shard by the global setup — each shard
//     is fully isolated, which is what makes parallel shards safe);
//   - the auth state is per-shard too (each shard's setup project signs
//     the demo user in against its OWN server; the storageState cookie
//     is stateless HMAC, so no cross-shard sharing is needed).
// The index is 1-indexed to match Playwright's own --shard=k/N convention.

export type ShardEnv = {
  /** The standalone server's port (E2E_PORT). */
  port: number;
  /** The SQLite URL (E2E_DB) — relative to prisma/schema.prisma. */
  dbUrl: string;
  /** The storageState path (E2E_AUTH), repo-relative. */
  authPath: string;
  /** Playwright's outputDir (E2E_OUTPUT) — artifacts land per shard;
   * a SHARED test-results/ is a cross-process race (the disposal ENOENTs
   * the sharded runs hit before this field existed). Stays under the
   * git-ignored test-results/ tree. */
  outputDir: string;
};

/** Shards start at 3111 — 10 clear of the serial default 3100. */
const SHARD_PORT_BASE = 3110;

export function shardEnv(index: number, count: number): ShardEnv {
  if (!Number.isInteger(count) || count < 2) {
    // One shard IS the serial mode (`bun run test:e2e`) — the wrapper
    // never fakes it. Counts below 2 are a caller bug.
    throw new Error(`shard count must be an integer >= 2 (got ${count})`);
  }
  if (!Number.isInteger(index) || index < 1 || index > count) {
    throw new Error(`shard index must be an integer in [1, ${count}] (got ${index})`);
  }
  return {
    port: SHARD_PORT_BASE + index,
    dbUrl: `file:../db/e2e-shard-${index}.db`,
    authPath: `tests/e2e/.auth/user-shard-${index}.json`,
    outputDir: `test-results/shard-${index}`,
  };
}
