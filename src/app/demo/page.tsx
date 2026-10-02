import type { Metadata } from "next";
import { DemoDashboard } from "@/components/dashboard/demo-dashboard";

export const metadata: Metadata = { title: "Demo Page" };

// The guest demo — the reference renders the with-course dashboard for a
// virtual "Guest" user with the sample Economics enrollment (no auth, no
// persistence). It is the try-before-signup surface.
export default function DemoPage() {
  return <DemoDashboard />;
}
