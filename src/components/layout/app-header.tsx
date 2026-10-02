"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/mascot";
import { avatarLetter } from "@/lib/domain";
import { cn } from "@/lib/utils";

// AppHeader — the shared yellow chrome. Desktop: brand + user pill with a
// dropdown (email header + My Courses + Log Out; course dashboards add the
// course switcher rows). Mobile: hamburger button + the same dropdown with
// a name-only header. Measured parity notes:
//   header: px-4 md:px-8 py-3 mx-[4px] rounded-b-[20px], bg #FFFD73
//   brand: Eczar 16px/400, mark 33px, top offset 2px
//   user pill: px-3 py-1.5 rounded-full, avatar w-7 h-7 bg-black
//   panels: absolute right-0 top-full mt-2 bg-white rounded-[16px] shadow-xl
//           min-w 200px (desktop) / 220px (mobile), header p-3 yellow

export type HeaderUser = {
  name: string;
  email: string;
};

export type HeaderCourse = {
  id: string;
  name: string;
  current?: boolean;
};

type MenuItem = {
  label: string;
  icon: "grid" | "logout" | "switch" | "settings";
  onClick: () => void;
};

const ICONS = {
  grid: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid h-4 w-4 text-black">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  logout: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out h-4 w-4 text-black">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
  switch: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat h-4 w-4 text-black">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings h-4 w-4 text-black">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
    >
      {ICONS[item.icon]}
      <span className="text-sm font-medium text-black">{item.label}</span>
    </button>
  );
}

export function AppHeader({
  user,
  courses,
  currentCourseId,
  onCourseClick,
}: {
  user: HeaderUser;
  courses?: HeaderCourse[];
  currentCourseId?: string | null;
  onCourseClick?: (courseId: string) => void;
}) {
  const router = useRouter();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Outside-click closes whichever menu is open (the reference listens on
  // document and checks container containment).
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (desktopRef.current && !desktopRef.current.contains(e.target as Node)) {
        setDesktopOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setDesktopOpen(false);
      setMobileOpen(false);
    }
  }

  const menuItems: MenuItem[] = [
    ...(courses && courses.length > 0
      ? [
          {
            label: "Switch course",
            icon: "switch" as const,
            onClick: () => {
              setDesktopOpen(false);
              setMobileOpen(false);
              router.push("/courses");
            },
          },
          ...courses.map((c) => ({
            label: c.name,
            icon: "switch" as const,
            onClick: () => {
              setDesktopOpen(false);
              setMobileOpen(false);
              if (onCourseClick) onCourseClick(c.id);
              else router.push(`/?course=${c.id}`);
            },
          })),
          {
            label: "Update Preferences",
            icon: "settings" as const,
            onClick: () => {
              setDesktopOpen(false);
              setMobileOpen(false);
              router.push("/onboarding");
            },
          },
        ]
      : []),
    {
      label: "My Courses",
      icon: "grid",
      onClick: () => {
        setDesktopOpen(false);
        setMobileOpen(false);
        router.push("/courses");
      },
    },
    {
      label: loggingOut ? "Logging out…" : "Log Out",
      icon: "logout",
      onClick: handleLogout,
    },
  ];

  const letter = avatarLetter(user.name);

  return (
    <header
      className="relative mx-[4px] mt-0 flex items-center justify-between rounded-b-[20px] px-4 py-3 md:px-8"
      style={{ backgroundColor: "rgb(255, 253, 115)" }}
    >
      <a href="/" className="flex items-center gap-2" aria-label="Thinkerwell home">
        <BrandMark />
        <span
          style={{
            fontFamily: "Eczar, serif",
            fontWeight: 400,
            fontSize: "16px",
            position: "relative",
            top: "2px",
          }}
        >
          Thinkerwell
        </span>
      </a>

      {/* Desktop user pill + dropdown */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="relative" ref={desktopRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={desktopOpen}
            onClick={() => setDesktopOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all hover:bg-black/10"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
              {letter}
            </div>
            <span className="text-sm font-medium text-black">{user.name}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "lucide lucide-chevron-down h-3.5 w-3.5 text-black transition-transform",
                desktopOpen && "rotate-180",
              )}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {desktopOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] bg-white shadow-xl"
              style={{ minWidth: 200 }}
            >
              <div className="p-3" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black font-semibold text-sm text-white">
                    {letter}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">{user.name}</p>
                    <p className="text-xs text-black/50">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {menuItems.map((item) => (
                  <MenuRow key={item.label} item={item} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile hamburger + dropdown (name-only header, min-width 220px) */}
      <div className="relative md:hidden" ref={mobileRef}>
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-black/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-menu h-5 w-5 text-black"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        {mobileOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] bg-white shadow-xl"
            style={{ minWidth: 220 }}
          >
            <div className="p-3" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black font-semibold text-sm text-white">
                  {letter}
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">{user.name}</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              {menuItems.map((item) => (
                <MenuRow key={item.label} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
