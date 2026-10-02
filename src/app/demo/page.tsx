import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { randomQuote } from "@/lib/quotes";
import { DemoDashboard } from "@/components/dashboard/demo-dashboard";

export const metadata: Metadata = { title: "Demo Page" };

// The guest demo — the reference renders the with-course dashboard for a
// virtual "Guest" user with the sample Economics enrollment (the try-before-
// signup surface). S8-F2: the LIVE's /demo is auth-gated (the route is
// registered under the auth guard — anonymous visitors bounce to
// /login?from_url=%2Fdemo). The authenticated content is unchanged: the
// virtual student still renders the guest chrome with degraded writes.
export default async function DemoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from_url=%2Fdemo");
  return <DemoDashboard bubbleQuote={randomQuote()} />;
}
