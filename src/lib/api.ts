import { NextResponse } from "next/server";

// API envelope contract (the ORBITAL convention, shared with the reference
// app's spirit): every route handler answers either
//   { ok: true,  data }                        — 2xx
//   { ok: false, error: { code, message } }    — 4xx/5xx
// The client store's call() helper is the only sanctioned consumer.

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string };
};
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiOk<T>, { status });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code, message } } satisfies ApiErr,
    { status },
  );
}

export const ERR = {
  UNAUTHORIZED: ["UNAUTHORIZED", "Sign in required", 401] as const,
  NOT_FOUND: ["NOT_FOUND", "Resource not found", 404] as const,
  VALIDATION: ["VALIDATION", "Invalid request payload", 422] as const,
  RATE_LIMITED: ["RATE_LIMITED", "Too many attempts, try again later", 429] as const,
  AI_UNAVAILABLE: ["AI_UNAVAILABLE", "The AI tutor is unavailable right now", 503] as const,
  INTERNAL: ["INTERNAL", "Something went wrong", 500] as const,
};

/** Standard guard for handlers: parse JSON body with a size cap. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text || text.length > 1_000_000) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
