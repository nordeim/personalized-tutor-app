import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { sameOriginRedirectTarget } from "@/lib/domain";
import { LoginCard } from "@/components/login/login-card";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from_url?: string }>;
}) {
  // The reference renders the card for EVERY visitor (v2.11 parity: no
  // redirect for authenticated users — signing in from the authed state
  // lands on the workspace via the client flow).
  const user = await getSessionUser();
  const { from_url } = await searchParams;

  // S10-F1/R8: the from_url consumer. The live's client-side writers send
  // the FULL current URL (window.location.href — path AND query), so the
  // consumer tolerates ABSOLUTE urls — but only same-origin ones (the
  // open-redirect FIX for a contract the live ships as a vulnerability:
  // foreign origins and protocol-relative "//" collapse to "/"). Relative
  // same-app paths (the clone's own writer format, and the live's
  // server-side auth-guard format) pass through untouched.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const safeFrom = sameOriginRedirectTarget(from_url, origin);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <LoginCard fromUrl={safeFrom} signedInEmail={user ? user.email : null} />
    </main>
  );
}
