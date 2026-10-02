import { db } from "@/lib/db";
import { ok } from "@/lib/api";

// GET /api/health — liveness + DB readiness (the e2e webServer waits on it).
export async function GET() {
  try {
    await db.user.count();
    return ok({ status: "ok", db: true });
  } catch {
    return ok({ status: "ok", db: false });
  }
}
