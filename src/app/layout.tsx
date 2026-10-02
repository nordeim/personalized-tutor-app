import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Personalized Tutor App",
    template: "%s | Thinkerwell",
  },
  description:
    "A thoughtful AI tutoring partner that uses the Socratic method to help you discover answers on your own, rather than just providing them.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* The reference loads Funnel Sans + Eczar (+ Inter fallback) from
            Google Fonts — same families, same weights, display=swap.
            (no-page-custom-font is a Pages Router rule; in the App Router
            the root layout <head> applies to every route.) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout: this stylesheet link applies to every route; the rule targets the Pages Router */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Funnel+Sans:wght@300;400;500;600;700;800&family=Eczar:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
