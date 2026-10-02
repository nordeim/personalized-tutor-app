import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

// Hand-rolled cookie-session auth (no NextAuth, no JWTs, no middleware):
// scrypt password hashes + an HMAC-signed stateless
// session cookie `thinkerwell_session` carrying {uid, iat} with a 7-day TTL.
// requireSession() guards every API route handler.

const COOKIE_NAME = "thinkerwell_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Dev-only fallback so the app boots without .env setup; production must
// set AUTH_SECRET (openssl rand -hex 32) — see .env.example.
const SECRET =
  process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16
    ? process.env.AUTH_SECRET
    : "thinkerwell-dev-only-insecure-secret";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
};

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/* ------------------------------------------------------------------ */
/* Password hashing — scrypt with a per-user salt                      */
/* ------------------------------------------------------------------ */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/* ------------------------------------------------------------------ */
/* Stateless session cookie                                            */
/* ------------------------------------------------------------------ */

function encodeSession(userId: string): string {
  const iat = Date.now();
  const body = Buffer.from(JSON.stringify({ uid: userId, iat })).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string | undefined): { uid: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      uid: string;
      iat: number;
    };
    if (Date.now() - parsed.iat > SESSION_TTL_MS) return null; // expired
    return { uid: parsed.uid };
  } catch {
    return null;
  }
}

/**
 * Create the session cookie. `secure` is derived from the actual request
 * protocol (req.url when available, else the x-forwarded-proto header):
 * a production server on plain HTTP (the e2e standalone boot, self-hosted
 * LAN deploys) must still be able to set the cookie — browsers silently
 * drop secure cookies over HTTP. Provable HTTPS (direct or proxied) opts in.
 */
export async function createSession(userId: string, req?: Request): Promise<void> {
  let secure = false;
  try {
    if (req) {
      if (new URL(req.url).protocol === "https:") secure = true;
      const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
      if (proto === "https") secure = true;
    } else {
      const h = await headers();
      const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
      if (proto === "https") secure = true;
    }
  } catch {
    /* protocol undetectable — plain-HTTP default is safe */
  }
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Resolve the signed-in user (null when logged out / bad cookie). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const session = decodeSession(store.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, fullName: true },
  });
  return user ?? null;
}

/** Route-handler guard: returns the user or null (callers answer 401). */
export async function requireSession(): Promise<SessionUser | null> {
  return getSessionUser();
}
