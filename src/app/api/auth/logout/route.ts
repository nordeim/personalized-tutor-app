import { destroySession } from "@/lib/auth";
import { ok } from "@/lib/api";

// POST /api/auth/logout — clears the session cookie.
export async function POST() {
  await destroySession();
  return ok({ loggedOut: true });
}
