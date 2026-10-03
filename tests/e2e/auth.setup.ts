import { expect, test as setup } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

// One authenticated session for the whole run — saved as a storageState and
// replayed into every main-project context (see playwright.config.ts for why
// per-test logins are not an option: the auth rate limiter).
//
// SESSION-17 (S17-F2): the storageState path rides E2E_AUTH so the sharded
// runner (scripts/e2e-sharded.mjs) can give every shard its OWN file —
// Playwright duplicates this setup project into EVERY shard (verified via
// `--shard --list`), each against its own server, so the shards never race
// on one .auth/user.json. The default keeps the serial mode byte-identical.
const AUTH_PATH = process.env.E2E_AUTH ?? "tests/e2e/.auth/user.json";

setup("sign the demo user in", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  expect(res.ok(), `login failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  await request.storageState({ path: AUTH_PATH });
});
