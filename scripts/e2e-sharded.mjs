#!/usr/bin/env bun
// scripts/e2e-sharded.mjs — SESSION-17 (S17-F2) + SESSION-19 (S19-F2): the
// sharded e2e runner.
//
// Runs `bun run test:e2e`'s suite as N PARALLEL playwright processes, each
// with its OWN port + OWN SQLite file + OWN auth state (the per-shard
// isolation that makes parallel shards safe — the specs stay per-test
// isolated within their shard, and nothing is shared ACROSS shards).
// The per-shard env derivation lives in tests/e2e/shard-env.ts
// (unit-pinned); this script is the orchestrator only.
//
// SESSION-19 (S19-F2) — BALANCED SHARDING: the previous `--shard=k/N`
// split (test COUNT, contiguous file order) landed 17 of the 22 direct
// AI-route request-level calls in ONE shard — in the reachable-but-slow
// LLM regime (each AI call budgets 45s) that shard alone approached the
// full serial wall clock while the others idled. The wrapper now plans
// WHOLE-FILE assignments by LPT over an AI-weight cost model
// (tests/e2e/shard-plan.ts, unit-pinned): weight = aiMentions*45 + tests.
// Every shard's file list is prepended with tests/e2e/auth.setup.ts —
// reproducing the setup-duplication semantics `--shard=k/N` itself
// provided (each shard signs the demo user in against its OWN server: 1
// login per shard, far under the 10/IP/15min rate limit).
//
// The count invariant is ENFORCED at runtime: the pre-flight --list gives
// the authoritative total; each shard's trailing "N passed" summary is
// parsed and the sum asserted to equal total + N - 1 (the setup test runs
// once per shard; the serial total counts it once). A dropped or
// duplicated file fails the wrapper loudly.
//
// Trap 41 (the orphaned-webServer trap) is respected BOTH ends: the
// pre-flight kills any process holding a shard port (a tool-timeout kill
// leaves servers alive), and the exit path kills whatever is left on the
// shard ports.
//
// Usage: bun scripts/e2e-sharded.mjs            (E2E_SHARDS=3 by default)
//        E2E_SHARDS=2 bun scripts/e2e-sharded.mjs

import { spawn, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { shardEnv } from "../tests/e2e/shard-env";
import { countSpecSignals, planShards, specWeight } from "../tests/e2e/shard-plan";

const SHARD_COUNT = Number(process.env.E2E_SHARDS ?? 3);
const TESTS_DIR = "tests/e2e";
const SETUP_FILE = `${TESTS_DIR}/auth.setup.ts`;
// `bunx playwright` (NOT `bun node_modules/@playwright/test/cli.js`):
// only the bunx bin resolution loads the TS config with the type-stripping
// loader — a direct cli.js execution parses it as plain JS and dies on the
// `as Record<...>` cast (empirically compared, session-17 trap 45).

/** Kill any process LISTENING on a shard port (trap 41's protocol). */
function killOrphansOnShardPorts(ports) {
  let listening = "";
  try {
    listening = execSync("ss -tlnp 2>/dev/null || true", { encoding: "utf8" });
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

/** Enumerate the suite ONCE via playwright's own --list (its view of the
 *  inventory is the authority — zero drift vs a filesystem walk, which
 *  could disagree with testMatch on extensions). Returns the total test
 *  count and the per-spec-file test counts (auth.setup.ts excluded from
 *  PLANNING — the wrapper prepends it to every shard's file list). */
function listSuite() {
  const out = execSync("bunx playwright test --list", {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: undefined },
    maxBuffer: 32 * 1024 * 1024,
  });
  const perFile = new Map();
  let total = 0;
  for (const line of out.split("\n")) {
    // e.g. "  [setup] › auth.setup.ts:15:6 › sign the demo user in" /
    // "  [chromium] › auth.spec.ts:15:7 › title" (names relative to the
    // testDir in --list output; full repo-relative paths in run output —
    // normalize both). NOTE: the SETUP file is .setup.ts, not .spec.ts —
    // the pattern must catch it or the expected-count math runs one short.
    const m = line.match(/›\s*(\S+\.(?:spec|setup)\.ts):\d+:\d+/);
    if (!m) continue;
    const name = m[1].replace(/^.*tests\/e2e\//, "");
    perFile.set(name, (perFile.get(name) ?? 0) + 1);
    total++;
  }
  const setupCount = perFile.get("auth.setup.ts") ?? 0;
  perFile.delete("auth.setup.ts");
  if (perFile.size === 0 && setupCount === 0) {
    throw new Error("[sharded] the --list pre-flight found no tests — is the suite wired?");
  }
  return { perFile, total, setupCount };
}

/** The AI-weight inventory: read each spec source and count the
 *  countSpecSignals signals (the static AI-route proxy — see
 *  tests/e2e/shard-plan.ts for the documented undercount limitation). */
function weightInventory(perFile) {
  return [...perFile.entries()].map(([name, tests]) => {
    const src = readFileSync(join(TESTS_DIR, name), "utf8");
    const { aiMentions } = countSpecSignals(src);
    return { file: `${TESTS_DIR}/${name}`, tests, aiMentions };
  });
}

function prefixStream(stream, tag, onLine) {
  if (!stream) return;
  const rl = createInterface({ input: stream });
  rl.on("line", (line) => {
    if (onLine) onLine(line);
    console.log(`${tag} ${line}`);
  });
}

async function main() {
  const envs = [];
  for (let k = 1; k <= SHARD_COUNT; k++) {
    const { port, dbUrl, authPath, outputDir } = shardEnv(k, SHARD_COUNT);
    envs.push({ k, port, dbUrl, authPath, outputDir });
  }

  // Pre-flight: clear the shard ports (trap 41).
  killOrphansOnShardPorts(envs.map((e) => e.port));

  // The balanced plan (session-19): playwright's own inventory, weighted.
  const { perFile, total, setupCount } = listSuite();
  const inventory = weightInventory(perFile);
  const groups = planShards(
    inventory,
    SHARD_COUNT,
  );

  console.log(
    `[sharded] planning ${inventory.length} spec files (${total - setupCount} spec tests) into ${SHARD_COUNT} shards by AI weight:`,
  );
  for (const f of [...inventory].sort((a, b) => specWeight(b) - specWeight(a))) {
    console.log(
      `  ${String(specWeight(f)).padStart(4)}  ${f.file}  (${f.aiMentions} AI mentions, ${f.tests} tests)`,
    );
  }
  envs.forEach((e, i) => {
    const files = groups[i] ?? [];
    const weight = files.reduce((sum, f) => {
      const spec = inventory.find((x) => x.file === f);
      return sum + (spec ? specWeight(spec) : 0);
    }, 0);
    console.log(
      `[sharded] shard #${e.k} on :${e.port} (${e.dbUrl}) — ${files.length} files, plan weight ${weight}`,
    );
  });

  const children = envs.map(({ k, port, dbUrl, authPath, outputDir }, i) => {
    const files = [SETUP_FILE, ...(groups[i] ?? [])];
    let passedLine = null;
    const child = spawn("bun", ["x", "playwright", "test", ...files], {
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
    prefixStream(child.stdout, `[shard ${k}]`, (line) => {
      const m = line.match(/(\d+) passed/);
      if (m) passedLine = Number(m[1]);
    });
    prefixStream(child.stderr, `[shard ${k}]!`);
    child.on("exit", (code) => {
      console.log(`[sharded] shard ${k} exited with code ${code}`);
    });
    return { k, child, get passed() { return passedLine; } };
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

  const results = await Promise.all(
    children.map(({ k, child }) => new Promise((resolve) => child.on("exit", (c) => resolve({ k, c })))),
  );

  cleanup();

  const failed = results.filter((r) => r.c !== 0);
  for (const { k, c } of results) console.log(`[sharded] shard ${k}/${SHARD_COUNT}: ${c === 0 ? "PASS" : `FAIL (${c})`}`);

  // The count invariant (session-19), enforced on GREEN runs: the setup
  // test runs once per shard while the serial --list total counts it once
  // — the executed sum must equal total + N - 1. On failing runs the
  // undercount is the failure's own signal, so the shard codes dominate.
  if (failed.length === 0) {
    const executed = children.reduce((sum, { passed }) => sum + (passed ?? 0), 0);
    const expected = total + SHARD_COUNT - 1;
    console.log(
      `[sharded] executed ${executed} tests across shards (expected ${expected} = ${total} + ${SHARD_COUNT - 1} setup copies)`,
    );
    if (children.some(({ passed }) => passed === null)) {
      console.error("[sharded] COUNT INVARIANT VIOLATION: a green shard's summary line was not parsed");
      process.exit(1);
    }
    if (executed !== expected) {
      console.error(`[sharded] COUNT INVARIANT VIOLATION: executed ${executed} != expected ${expected}`);
      process.exit(1);
    }
  }
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
