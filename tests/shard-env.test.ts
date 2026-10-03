import { describe, expect, it } from "vitest";

// SESSION-17 (S17-F2) — the sharded-e2e harness pins. The per-shard env
// derivation (port / DB / auth state) is a PURE seam: one module, no I/O,
// consumed by playwright.config.ts, tests/e2e/global-setup.ts,
// tests/e2e/auth.setup.ts, and scripts/e2e-sharded.mjs alike. These pins
// hold the contract that makes the shards SAFE:
//   - every shard gets its OWN port, its OWN SQLite file, its OWN auth
//     state (a shared any-of-them is the cross-shard race);
//   - shard ports NEVER collide with the serial default 3100 (a leftover
//     serial-run orphan must not be silently reused with the wrong DB);
//   - the index is 1-indexed and validated (0 / count+1 throw) so the
//     wrapper cannot silently fall back to a wrong shard;
//   - a count below 2 throws — one shard IS the serial mode, not the
//     wrapper's job to fake.

import { shardEnv } from "./e2e/shard-env";

describe("the sharded-e2e env derivation (S17-F2)", () => {
  it("derives a distinct port / DB / auth path per shard (1-indexed)", () => {
    const s1 = shardEnv(1, 3);
    const s2 = shardEnv(2, 3);
    const s3 = shardEnv(3, 3);

    expect(s1).toEqual({
      port: 3111,
      dbUrl: "file:../db/e2e-shard-1.db",
      authPath: "tests/e2e/.auth/user-shard-1.json",
      outputDir: "test-results/shard-1",
    });
    expect(s2).toEqual({
      port: 3112,
      dbUrl: "file:../db/e2e-shard-2.db",
      authPath: "tests/e2e/.auth/user-shard-2.json",
      outputDir: "test-results/shard-2",
    });
    expect(s3).toEqual({
      port: 3113,
      dbUrl: "file:../db/e2e-shard-3.db",
      authPath: "tests/e2e/.auth/user-shard-3.json",
      outputDir: "test-results/shard-3",
    });
  });

  it("never collides with the serial default port 3100 (any shard count, any index)", () => {
    for (let count = 2; count <= 8; count++) {
      for (let index = 1; index <= count; index++) {
        expect(shardEnv(index, count).port).not.toBe(3100);
      }
    }
  });

  it("throws on an out-of-range shard index (0 and count+1 alike)", () => {
    expect(() => shardEnv(0, 3)).toThrow();
    expect(() => shardEnv(4, 3)).toThrow();
  });

  it("throws on a count below 2 (one shard IS the serial mode)", () => {
    expect(() => shardEnv(1, 1)).toThrow();
    expect(() => shardEnv(1, 0)).toThrow();
  });
});
