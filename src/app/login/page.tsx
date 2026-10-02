import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
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

  // Only sanitize same-site relative return URLs.
  const safeFrom =
    from_url && from_url.startsWith("/") && !from_url.startsWith("//") ? from_url : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <LoginCard fromUrl={safeFrom} signedInEmail={user ? user.email : null} />
    </main>
  );
}
