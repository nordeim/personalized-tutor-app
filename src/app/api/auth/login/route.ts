import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/auth/login — { email, password } → session cookie.
// Rate-limited: 10 attempts / 15 min / IP (fixed window, in-process).
export async function POST(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: "RATE_LIMITED", message: "Too many attempts, try again later" },
      }),
      {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": String(rl.retryAfterSec) },
      },
    );
  }

  const body = await readJson<{ email?: string; password?: string }>(req);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email || !password) {
    return fail("VALIDATION", "Email and password are required", 422);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  await createSession(user.id, req);
  return ok({ id: user.id, email: user.email, fullName: user.fullName });
}
