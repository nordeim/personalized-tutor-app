"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Thinkerwell mascot — the reference ships four SVG variants (hero
 * desktop 160×210, hero mobile 90×118, welcome-card 80×105, chat avatar).
 * The SVGs carry their own CSS keyframes (breathe / arms / hair / float /
 * shadow), which animate inside <img> references.
 */
export function MascotHero({ className }: { className?: string }) {
  return (
    <div className={cn("hidden lg:block", className)}>
      <Image
        src="/mascot-desktop.svg"
        alt="Thinkerwell mascot waving"
        width={160}
        height={210}
        priority
        unoptimized
      />
    </div>
  );
}

export function MascotHeroMobile({ className }: { className?: string }) {
  return (
    <div className={cn("flex lg:hidden", className)}>
      <Image
        src="/mascot-mobile.svg"
        alt="Thinkerwell mascot waving"
        width={90}
        height={118}
        priority
        unoptimized
      />
    </div>
  );
}

export function MascotWelcome({ className }: { className?: string }) {
  return (
    <div className={cn("flex-shrink-0", className)}>
      <Image
        src="/mascot-welcome.svg"
        alt="Thinkerwell mascot"
        width={80}
        height={105}
        unoptimized
      />
    </div>
  );
}

export function MascotChat({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ width: size, height: size * 1.3125 }}
    >
      <Image
        src="/nori-avatar.svg"
        alt="Nori the AI tutor"
        width={size}
        height={Math.round(size * 1.3125)}
        unoptimized
      />
    </div>
  );
}

export function MascotGenerating({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src="/mascot-quiz-gen.svg"
        alt="Thinkerwell mascot preparing your lesson"
        width={120}
        height={108}
        unoptimized
      />
    </div>
  );
}

/** The 33px header brand mark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt=""
      width={33}
      height={33}
      className={className}
      unoptimized
    />
  );
}
