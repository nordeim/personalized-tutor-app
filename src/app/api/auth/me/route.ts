import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/api";

// GET /api/auth/me — current session user (null when logged out).
export async function GET() {
  const user = await getSessionUser();
  return ok({ user });
}
