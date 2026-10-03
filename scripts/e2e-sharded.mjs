#!/usr/bin/env bun
// scripts/e2e-sharded.mjs — SESSION-17 (S17-F2): the sharded e2e runner.
//
// Runs `bun run test:e2e`'s suite as N PARALLEL playwright processes, each
// with its OWN port + OWN SQLite file + OWN auth state (the per-shard
// isolation that makes parallel shards safe — the specs stay per-test
// isolated within their shard, and nothing is shared ACROSS shards).
// The derivation lives in tests/e2e/shard-env.ts (unit-pinned); this
// script is the orchestrator only.
//
// Why shards (not workers): the specs share one seeded SQLite file, so
// intra-suite parallelism needs per-worker DBs the standalone server
// cannot hand out (one DATABASE_URL per process). Sharding at the
// PROCESS level gives each playwright run its own server + DB + auth —
// no spec changes, no config fork. Playwright duplicates the "setup"
// dependency project into every shard (verified via --shard --list), so
// each shard signs the demo user in against its own server: 1 login per
// shard, far under the 10/IP/15min rate limit.
//
// Trap 41 (the orphaned-webServer trap) is respected BOTH ends: the
// pre-flight kills any process holding a shard port (a tool-timeout kill
// leaves servers alive), and the exit path kills whatever is left on the
// shard ports.
//
// Usage: bun scripts/e2e-sharded.mjs            (E2E_SHARDS=3 by default)
//        E2E_SHARDS=2 bun scripts/e2e-sharded.mjs

import { spawn, execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { shardEnv } from "../tests/e2e/shard-env";

const SHARD_COUNT = Number(process.env.E2E_SHARDS ?? 3);
// `bunx playwright` (NOT `bun node_modules/@playwright/test/cli.js`):
// only the bunx bin resolution loads the TS config with the type-stripping
// loader — a direct cli.js execution parses it as plain JS and dies on the
// `as Record<...>` cast (empirically compared this session).

/** Kill any process LISTENING on a shard port (trap 41's protocol). */
function killOrphansOnShardPorts(ports) {
  let listening = "";
  try {
    listening = execSync("ss -tlnp 2>/dev/null || true", { encoding: "utf-8" });
  } catch {
    return; // ss unavailable (non-Linux): skip silently, boot will fail loudly if taken
  }
  const portSet = new Set(ports.map(String));
  const pids = new Set();
  for (const line of listening.split("\n")) {
    // match e.g. "0.0.0.0:3111" in the local-address column
    const port = line.trim().split(/\s+/)[3]?.split(":").pop();
    if (port && portSet.has(port)) {
      const m = [...line.matchAll(/pid=(\d+)/g)];
      for (const [, pid] of m) pids.add(pid);
    }
  }
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`[sharded] killed orphan pid ${pid} on a shard port`);
    } catch {
      /* already gone */
    }
  }
}

function prefixStream(stream, tag) {
  if (!stream) return;
  const rl = createInterface({ input: stream });
  rl.on("line", (line) => console.log(`${tag} ${line}`));
}

async function main() {
  const envs = [];
  for (let k = 1; k <= SHARD_COUNT; k++) {
    const { port, dbUrl, authPath, outputDir } = shardEnv(k, SHARD_COUNT);
    envs.push({ k, port, dbUrl, authPath, outputDir });
  }

  // Pre-flight: clear the shard ports (trap 41).
  killOrphansOnShardPorts(envs.map((e) => e.port));

  console.log(
    `[sharded] running ${SHARD_COUNT} shards: ${envs
      .map((e) => `#${e.k} on :${e.port} (${e.dbUrl})`)
      .join("  ·  ")}`,
  );

  const children = envs.map(({ k, port, dbUrl, authPath, outputDir }) => {
    const child = spawn("bun", ["x", "playwright", "test", `--shard=${k}/${SHARD_COUNT}`], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // The stale-shell trap: never let an exported DATABASE_URL leak
        // into the child (config + global-setup set it explicitly anyway).
        DATABASE_URL: undefined,
        E2E_PORT: String(port),
        E2E_DB: dbUrl,
        E2E_AUTH: authPath,
        // Per-shard artifacts: a SHARED test-results/ is a cross-process
        // race (disposal ENOENTs) — every shard lands its own subdir
        // under the git-ignored test-results/ tree.
        E2E_OUTPUT: outputDir,
        E2E_SHARDED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    prefixStream(child.stdout, `[shard ${k}]`);
    prefixStream(child.stderr, `[shard ${k}!]`);
    child.on("exit", (code) => {
      console.log(`[sharded] shard ${k} exited with code ${code}`);
    });
    return { k, child };
  });

  // Exit path: kill leftovers on the shard ports, whatever happens.
  const cleanup = () => {
    for (const { child } of children) {
      if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
    }
    setTimeout(() => killOrphansOnShardPorts(envs.map((e) => e.port)), 500).unref?.();
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  const codes = await Promise.all(
    children.map(({ k, child }) => new Promise((resolve) => child.on("exit", (c) => resolve({ k, c })))),
  );

  cleanup();

  const failed = codes.filter((r) => r.c !== 0);
  for (const { k, c } of codes) console.log(`[sharded] shard ${k}/${SHARD_COUNT}: ${c === 0 ? "PASS" : `FAIL (${c})`}`);
  if (failed.length > 0) {
    console.error(`[sharded] ${failed.length}/${SHARD_COUNT} shard(s) FAILED`);
    process.exit(1);
  }
  console.log(`[sharded] all ${SHARD_COUNT} shards green`);
}

main().catch((err) => {
  console.error("[sharded] wrapper failed:", err);
  process.exit(1);
});
