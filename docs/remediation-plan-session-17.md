# Remediation Plan — Session 17

Repo state at start: `42274b9` (session-16 complete at `d4da6d2` + the log
commits `b62cc8f`/`42274b9`; the new `docs/session_17.md` = the session-16
transcript, per the handoff convention). The workspace was RESET this
session — fresh clone + `bun install` + `cp .env.example .env`
(`DATABASE_URL="file:../db/custom.db"` — the prompt's step verified) +
`db/` created at the repo root + `prisma generate` + `db:push` + `db:seed`;
`.env.example` re-verified byte-identical; the vitest + playwright configs
verified wired (182 unit, 91 e2e). The stale shell `DATABASE_URL` trap
re-armed itself (`file:/home/z/my-project/db/custom.db` overrides `.env`)
— every dev/CLI command ran under `env -u DATABASE_URL`.

Audit sources: the baseline gate re-run fresh (lint ZERO findings ·
typecheck ✓ · 182 unit ✓ incl. a shuffle-seed re-validation of the
session-16 `isolate: false` adoption · build ✓ · all 91 e2e re-run green in
chunks — 12+29+13+18+8+7+5+6 minus 8 setup re-runs = 91 unique; zero
orphaned :3100 servers), a live re-probe (login, the bundle hash, the
mobile-nav real-tap re-verification at 390×844 hasTouch — the prompt's
headline, 8th consecutive session, plus the clone's own
`mobile-navigation.spec.ts` re-run 12/12 on the fresh build), the
session-16 handoff's three suggested directions investigated empirically
(the lint experiment matrix over the 7 remaining scaffold-suppressed rules;
the e2e parallelization feasibility probes — `--shard --list` proves the
setup project duplicates into every shard; the dependency-freshness scan
via `bun outdated`), and a two-axis review of the session-16 commit itself
(the latest-ref sites + the dead-code deletions read whole — no hard
findings). **The live app bundle is byte-identical to the recon copy for
the 8th consecutive session (md5 `f99e72793316ead62b335b6fd55ed6d5`,
788 085 bytes — `/assets/index-CkEI9gsZ.js`)** — every prior decode stands.
scandihaven re-consulted per the prompt (unchanged at `cb0002a`; its e2e
is serial too — `fullyParallel: false`, one webServer — so the
per-shard isolation scheme below is an original design, not a port). The
repo's Tailwind v4 skills re-consulted for the mobile-nav headline (all 8
trap pins re-verified intact in `globals.css`; zero actual `rounded-full`
class usages in `src/`; the sonner pointer-events rules intact). The
`skills/` folder is excluded from code checking, testing and compilation
throughout.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** latent-flake/test-gap ·
**P3** polish/hygiene.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S17-F1 | **5 of the 7 remaining scaffold lint suppressions retire at ZERO findings; `no-empty` retires after one self-documenting fix; `no-undef` stays OFF as a documented false-positive rule.** The experiment matrix (each rule enabled alone against the tree, per the session-15/16 methodology): `no-debugger` 0 · `no-irregular-whitespace` 0 · `no-case-declarations` 0 · `no-fallthrough` 0 · `no-mixed-spaces-and-tabs` 0 — free retirements. `no-empty` exactly 1 finding: `scripts/paired-probe-v214.mjs:28` (`catch {}` in the health-check retry loop — the fire-and-forget idiom; a comment inside the block satisfies the rule and self-documents the retry). `no-undef` 6 warnings, ALL false positives for a TypeScript codebase under flat config: `React` ×4 (the automatic JSX-runtime scope — the rule is not type-aware) + `NodeJS` ×2 (the `@types/node` ambient namespace) — the real hazard is covered by `bun run typecheck` (TypeScript IS the checker); the rule stays off with the rationale documented in the config. **Plus a config-hygiene bug found in the audit: `eslint.config.mjs` carries a DEAD DUPLICATE `"@typescript-eslint/no-unused-vars": "off"` (line 32) superseded by the session-16 enablement block (line 58) — JS object duplicate-key semantics (last wins) make the dead entry harmless but misleading; it reads as "the rule is off."** | the eslint experiment matrix (this session) + eslint.config.mjs read | P3 |
| S17-F2 | **The e2e harness runs strictly serially — the chunk protocol costs 8 invocations of server-boot + global-setup ceremony per full run, and the serial wall clock is 12-15 min whenever the LLM is reachable-but-slow (the documented regime). A per-shard port/DB/auth isolation scheme unlocks parallel shards in ONE command.** Feasibility, probed EMPIRICALLY before designing: (a) `playwright test --shard=k/N --list` proves Playwright DUPLICATES the `setup` dependency project into every shard (`sign the demo user in` appears in all three) — each shard signs in against its OWN server, so the rate limiter sees 1 login per shard, well under 10/IP/15min; (b) the specs are per-test isolated by construction (zero `beforeAll`, zero `mode: "serial"`, zero `test.describe.configure` — every test generates its own course and cleans up via the `helpers.ts` afterEach), so a file split across shards is safe; (c) `.gitignore` already covers the per-shard artifacts (`db/*.db` + `tests/e2e/.auth/`); (d) shard counts by `--list`: 40/23/30 (91 unique + 2 duplicated setup copies). The scheme: shards take ports 3111+ (clear of the serial 3100 — no collision with a serial-run orphan), own DB `db/e2e-shard-{k}.db`, own auth state `.auth/user-shard-{k}.json`; `reuseExistingServer` goes false in sharded mode (deterministic boots; the wrapper extends the trap-41 orphan-kill protocol to the 311x ports). The serial mode stays the DEFAULT, byte-compatible (same env defaults, same port, same DB) — `test:e2e` unchanged. | `--shard --list` probes + spec-file greps + .gitignore read + playwright.config read | P2 |
| S17-F3 | **The dependency manifest's lower bounds are stale vs the gate-verified lockfile: `next ^16.1.1` (installed 16.3.8) · `prisma/@prisma/client ^6.11.1` (6.19.3) · `react/react-dom ^19.0.0` (19.3.0) · `@types/react ^19` (19.3.0) · `typescript ^5` (5.9.3) · `eslint ^9` (9.39.5).** The freshness scan (`bun outdated`): everything is at the latest MINOR within its major — the handoff's "React 19.x / Next 16.x / Prisma 6.x minor bumps" are already shipped via the caret ranges. The remaining updates are ALL majors and out of scope BY DOCTRINE: `prisma 7` / `@prisma/client 7` (breaking generator + config changes), `lucide-react 1.50` (the icon-path parity work pins the 0.475-vs-0.525 paths — a major bump risks re-drifting every decoded icon), `eslint 10` (flat-config ecosystem churn), `typescript 7` (major). The remediation: align the manifest minimums to the versions the gate actually verified — a zero-resolution-change edit (the lockfile pins already satisfy the new minimums; `bun install` is a no-op on the lockfile) that makes the manifest tell the truth about what was tested. | `bun pm ls` + `bun outdated` + bun.lock read | P3 |
| S17-F4 | CONFIRMED MATCHING / documented (no action): the live app bundle **byte-identical for the 8th consecutive session** (md5 `f99e72793316ead62b335b6fd55ed6d5` — every decode stands); login works (landed on `/`); **the mobile-nav headline re-verified for the 8th consecutive session** (390×844 hasTouch: the live's hamburger tap STILL REFUSES — `elementFromPoint` at the button center (334,12)+36/2 IS the `fixed top-0 z-[100]` toaster container with `pointer-events: auto`, `Timeout 5000ms exceeded`; the clone's fix + 12/12 real-tap pins re-ran green on the fresh build); the unauthenticated mobile `/hub` visit bounces to `login?from_url=<full-url>` (the session-10 decode, re-observed); scandihaven unchanged (`cb0002a`); `.env`/`.env.example` byte-identical (`DATABASE_URL="file:../db/custom.db"` — the prompt's step satisfied and verified; `db/custom.db` seeded at the repo root); vitest + playwright configs verified wired; all 8 Tailwind v4 trap pins intact (zero actual `rounded-full` in `src/`); the unit runner's `isolate: false` re-validated with a fresh shuffle seed (182/182, 347ms); the session-16 commit re-reviewed two-axis (the latest-ref sites in lesson-view + onboarding read whole; the dead-code deletions verified as pure removals) — no hard findings. | probes + code | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — the RED state (TDD: the pure seam's pins land first)

- [x] **R0. `tests/shard-env.test.ts`** (S17-F2): the failing pins for the
  pure shard-env derivation — `shardEnv(1, 3)` → `{ port: 3111, dbUrl:
  "file:../db/e2e-shard-1.db", authPath: "tests/e2e/.auth/user-shard-1.json" }`;
  ports are DISTINCT per shard and NEVER equal the serial default 3100;
  the index is 1-indexed with out-of-range (0, count+1) THROWN; a count
  below 2 THROWS (1 shard = serial mode, not the wrapper's job). RED: the
  module `tests/e2e/shard-env.ts` does not exist yet.

### Phase 2 — GREEN: the sharded e2e harness (S17-F2)

- [x] **R1. `tests/e2e/shard-env.ts`**: the pure derivation
  (`shardEnv(index, count, opts?)` — port base 3110, DB `e2e-shard-{k}.db`,
  auth `user-shard-{k}.json`; validation throws). No I/O — unit-testable.
- [x] **R2. `playwright.config.ts`**: parameterize `E2E_DB` (default
  `file:../db/e2e.db`) + `E2E_AUTH` (default `tests/e2e/.auth/user.json`)
  alongside the existing `E2E_PORT`; `reuseExistingServer` goes `false`
  when `E2E_SHARDED` is set (deterministic boots in sharded mode; serial
  behavior byte-identical otherwise).
- [x] **R3. `tests/e2e/global-setup.ts` + `tests/e2e/auth.setup.ts`**: the
  global setup pushes/seeds `process.env.E2E_DB ?? "file:../db/e2e.db"`;
  the auth setup writes `process.env.E2E_AUTH ??
  "tests/e2e/.auth/user.json"` — both default to today's exact values.
- [x] **R4. `scripts/e2e-sharded.mjs`**: the orchestrator — reads
  `E2E_SHARDS` (default 3); pre-flight kills orphans on the 311x ports
  (the trap-41 protocol extended); spawns N `playwright test --shard=k/N`
  processes with the per-shard env (`E2E_PORT`/`E2E_DB`/`E2E_AUTH`/
  `E2E_SHARDED=1`); streams prefixed output; aggregates exit codes; kills
  leftovers on exit (SIGTERM/SIGINT trapped).
- [x] **R5. `package.json`**: `"test:e2e:sharded": "node scripts/e2e-sharded.mjs"`
  (the serial `test:e2e` stays the documented default).

### Phase 3 — the lint retirement (S17-F1)

- [x] **R6. `eslint.config.mjs`**: enable the five zero-finding rules
  (`no-debugger`, `no-irregular-whitespace`, `no-case-declarations`,
  `no-fallthrough`, `no-mixed-spaces-and-tabs` — all warn) + `no-empty:
  "warn"`; DELETE the dead duplicate `"@typescript-eslint/no-unused-vars":
  "off"` entry (the session-16 block wins and stays); the scaffold-off
  block shrinks to `no-unused-vars` (base — the documented TS-aware
  split) + `no-undef` (the documented false-positive rationale: not
  type-aware, React JSX scope + NodeJS ambient; `typecheck` owns the real
  hazard). RED→GREEN: the one `no-empty` finding lands with the rule, the
  comment fix in R7 retires it.
- [x] **R7. `scripts/paired-probe-v214.mjs`**: the `catch {}` in the
  health-check retry loop gets `/* retry until the timeout window */`
  (a comment-bearing block passes `no-empty` — self-documenting, strict
  rule, no option relaxation).

### Phase 4 — the manifest alignment (S17-F3)

- [x] **R8. `package.json` lower bounds → the gate-verified lockfile
  versions**: `next ^16.3.8` (+`eslint-config-next ^16.3.8`), `react`/
  `react-dom ^19.3.0`, `prisma`/`@prisma/client ^6.19.3`,
  `@types/react ^19.3.0`, `@types/react-dom ^19.3.0`, `typescript ^5.9.3`,
  `eslint ^9.39.5`, `@playwright/test ^1.63.0` (already exact-latest),
  `vitest ^5.0.3`, `@prisma/client` majors documented out-of-scope (Prisma
  7 / lucide 1.x / eslint 10 / TS 7). Verify: `bun install` leaves
  `bun.lock` UNCHANGED (the pins already satisfy the new minimums) — the
  zero-resolution-change proof.

### Phase 5 — gate, screenshots, docs, delivery

- [x] **R9. Full gate**: lint (zero findings, with the NEW rules) →
  typecheck → unit (182 → 186 with the four shard-env pins) → build →
  e2e SERIAL (the default mode, 91, count-invariant via `--list`) → e2e
  SHARDED (the new mode: 3 shards, all green, 91 unique across shards,
  the wall clock recorded for both). Kill any orphaned
  `standalone/server.js` on :3100/:311x first per trap 41.
- [x] **R10. Screenshots** (`docs/screenshots/`): the dev server on the
  remediated tree — 103: the authenticated dashboard; 104: the MOBILE menu
  OPEN at 390×844 (the clone's working hamburger — the direct contrast to
  the live's 8th-verified refusal); 105: the hub surface (the session's
  sharded-e2e focus runs it hardest).
- [x] **R11. Docs alignment**: AGENTS.md (the sharded-e2e harness + the
  final lint ruleset + the manifest-alignment note; counts), CLAUDE.md
  (condensed invariants), README.md (the session-17 section + counts +
  the `test:e2e:sharded` script), PAD v1.16 `[S17]` + the testing
  section, SKILL v1.16.0 (the shard-isolation pattern + trap 43: the
  dead-duplicate-config-key trap), `docs/session_17.md` rewritten as the
  formatted session summary (the handoff convention), this plan's TODO
  check-offs, repo `worklog.md`; `.env.example` re-verify (no new env
  vars — E2E_* are test-infra envs, not app envs).
- [x] **R12. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim;
  remote ref verified == HEAD; key shredded). The credential-bearing
  probe scripts (`scripts/s17-*.cjs` in the WORKSPACE scripts/
  directory) never enter the repo tree — the established convention.
  Then the session-log commits (the repo worklog append + the raw
  session-17 transcript into `docs/session_18.md`, per the handoff
  convention `42274b9` established).

---

## Part C — Plan-vs-code validation (pre-execution)

1. **R0's RED state is reproducible**: `tests/shard-env.test.ts` imports a
   module that does not exist — vitest fails on the import, the
   conventional RED. The pinned values match R1's derivation exactly
   (3110 base + 1-indexed k; `e2e-shard-{k}`; `user-shard-{k}`) ✓.
2. **R2/R3 are default-preserving**: every env read carries today's exact
   value as its default (`file:../db/e2e.db`, `tests/e2e/.auth/user.json`,
   port 3100) — a serial `bun run test:e2e` with no env set is
   byte-identical to the current harness; the `E2E_SHARDED` flag only
   flips `reuseExistingServer` ✓.
3. **R4's lifecycle is trap-41-aware**: the pre-flight port kill extends
   the documented orphan protocol; SIGTERM/SIGINT traps kill children;
   the exit code aggregates per-shard playwright results ✓.
4. **R6's rule set is experiment-verified**: the matrix ran this session —
   5 rules at zero, `no-empty` at exactly the one R7 finding, `no-undef`
   at 6 type-awareness false positives (stays off, documented) ✓.
5. **R8 is zero-resolution-change**: the lockfile already pins versions ≥
   every new lower bound — `bun install` after the edit must leave
   `bun.lock` byte-identical (the proof of no behavioral delta) ✓.
6. **The unit count moves 182 → 186** (four new shard-env pins — the
   first unit additions since session-15's conventions pins); the e2e
   count stays EXACTLY 91 in serial mode (no spec files added or
   removed; `playwright --list` verifies), and the sharded mode's
   duplicated setup runs are the DOCUMENTED `--shard` semantics (93
   listed across 3 shards = 91 unique + 2 setup copies) ✓.
7. **The conventions stay intact**: the e2e-conventions scanner reads
   `*.spec.ts` + `helpers.ts` only — the new `shard-env.ts`/
   `e2e-sharded.mjs`/config edits are outside its scope and contain no
   `page.request` calls ✓.

Execution order note: Phase 1 (RED) → Phase 2 (the sharded harness, fast
gate + the sharded run as its own proof) → Phase 3 (lint, fast gate) →
Phase 4 (manifest, lockfile-stability check) → Phase 5 (full gate →
screenshots → docs → push).
