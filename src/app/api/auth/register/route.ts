import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/auth/register — { email, password, fullName? } → session cookie.
export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return fail("RATE_LIMITED", "Too many attempts, try again later", 429);
  }

  const body = await readJson<{ email?: string; password?: string; fullName?: string }>(req);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const fullName = body?.fullName?.trim() || null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail("VALIDATION", "A valid email is required", 422);
  }
  if (password.length < 8) {
    return fail("VALIDATION", "Password must be at least 8 characters", 422);
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return fail("EMAIL_TAKEN", "An account with this email already exists", 409);
  }

  const user = await db.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      fullName,
    },
  });

  await createSession(user.id, req);
  return ok({ id: user.id, email: user.email, fullName: user.fullName }, 201);
}
