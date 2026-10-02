"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/mascot";
import { avatarLetter, courseContextLine } from "@/lib/domain";
import { AddCourseModal } from "@/components/courses/add-course-modal";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Check,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";

// AppHeader — the shared yellow chrome (session-4 rework: the reference's
// two-dropdown split).
//
//   Desktop (with course):  brand · CoursePill (p_) · UserMenu (m_)
//   Desktop (no course):    brand · UserMenu (My Courses + Log Out only)
//   Mobile:                 brand · hamburger → the UserMenu content in a
//                           name-only dropdown panel (the pills are hidden
//                           behind the hamburger at 390px on the live too)
//
// The CoursePill (the reference's p_) is the bordered pill labeled with the
// student's current_subject; its w-64 panel lists the OTHER courses (the
// live filters `course_name !== current_subject`), or "This is your only
// course", plus the border-t section: All Courses + Add a Course (opens the
// Q5 modal). The UserMenu (the reference's m_) gains the course context line
// ("{subject} · Default") and the Update Preferences item — an inline
// name-edit form (PUT /api/student) — when the header carries a student
// context; the course switcher lives in the pill, NOT the user menu.
//
// Measured parity notes:
//   header: px-4 md:px-8 py-3 mx-[4px] rounded-b-[20px], bg #FFFD73
//   brand: Eczar 16px/400, mark 33px, top offset 2px
//   user pill: px-3 py-1.5 rounded-full, avatar w-7 h-7 bg-black
//   course pill: px-4 py-1.5 rounded-full border border-black
//   panels: absolute top-full mt-2 bg-white rounded-[16px] shadow-xl,
//           overflow-hidden, border border-black/10 (the pill panel),
//           w-64 (pill) / w-80 (user, with-course) / min-w 200-220 (simple)

export type HeaderUser = {
  name: string;
  email: string;
};

/** A course row inside the CoursePill dropdown (the OTHER courses). */
export type PillCourse = {
  id: string;
  name: string;
  /** "material"/"custom" renders the BookOpen tile; Sparkles otherwise. */
  source?: string | null;
};

/** The student context that switches the user menu to the m_ variant. */
export type HeaderStudent = {
  currentSubject: string | null;
  contentSource: string | null;
};

/* ------------------------------------------------------------------ */
/* CoursePill — the reference's p_ dropdown                            */
/* ------------------------------------------------------------------ */

function CoursePill({
  currentSubject,
  enrollments,
  guest = false,
}: {
  currentSubject: string;
  enrollments: PillCourse[];
  guest?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-black px-4 py-1.5 text-sm font-medium text-black transition-all hover:bg-black/5"
        style={{ fontFamily: '"Funnel Sans", sans-serif' }}
      >
        <span>{currentSubject}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-black transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Course menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[16px] border border-black/10 bg-white shadow-xl"
          style={{ fontFamily: '"Funnel Sans", sans-serif' }}
        >
          {enrollments.length > 0 ? (
            <div className="p-2">
              <p
                className="px-3 py-1.5 text-xs font-light"
                style={{ color: "rgb(89, 89, 89)" }}
              >
                Switch course
              </p>
              {enrollments.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/?course=${c.id}`);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-black">
                    {c.source === "material" || c.source === "custom" ? (
                      <BookOpen className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className="truncate text-sm font-medium text-black">{c.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="mb-3 text-sm font-light" style={{ color: "rgb(89, 89, 89)" }}>
                This is your only course
              </p>
            </div>
          )}
          <div className="border-t border-black/10 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/courses");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-black/5">
                <LayoutGrid className="h-3.5 w-3.5 text-black/60" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium" style={{ color: "rgb(89, 89, 89)" }}>
                All Courses
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setModalOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-black/20">
                <Plus className="h-3.5 w-3.5 text-black/40" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium" style={{ color: "rgb(89, 89, 89)" }}>
                Add a Course
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <AddCourseModal
          guest={guest}
          onClose={() => setModalOpen(false)}
          onAdded={(courseId) => {
            setModalOpen(false);
            if (courseId) {
              router.push(`/quiz?course=${courseId}`);
              router.refresh();
            } else {
              router.push("/login?from_url=%2Fonboarding");
            }
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The menu body shared by the desktop user dropdown and the mobile     */
/* hamburger dropdown: items view + the preferences (name) sub-view.    */
/* ------------------------------------------------------------------ */

type MenuView = "items" | "preferences";

function MenuBody({
  user,
  student,
  view,
  setView,
  onDone,
  onLogout,
  onStudentUpdated,
  guest = false,
}: {
  user: HeaderUser;
  student: HeaderStudent | null;
  view: MenuView;
  setView: (v: MenuView) => void;
  /** closes the surrounding panel after a navigation action */
  onDone: () => void;
  /** performs the actual logout (POST /api/auth/logout + redirect) */
  onLogout: () => void;
  onStudentUpdated?: (name: string) => void;
  /** Guest mode (the /demo surface): saving degrades to a sign-up route. */
  guest?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    if (guest) {
      // The demo surface has no session — route to sign-up instead of the API.
      toast({
        title: "Create a free account",
        description: "Sign up to save your preferences.",
      });
      onDone();
      router.push("/login?from_url=%2Fdemo");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/student", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        onStudentUpdated?.(trimmed);
        setView("items");
      }
    } finally {
      setSaving(false);
    }
  }

  if (view === "preferences") {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black">Update Preferences</h3>
          <button
            type="button"
            onClick={() => setView("items")}
            aria-label="Back to menu"
            className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:bg-gray-100"
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
              className="lucide lucide-x h-3.5 w-3.5 text-black/50"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="pref-name-input"
            className="text-xs font-semibold"
            style={{ color: "rgb(89, 89, 89)" }}
          >
            Name
          </label>
          <input
            id="pref-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/20"
            style={{ fontFamily: '"Funnel Sans", sans-serif' }}
          />
        </div>
        <button
          type="button"
          onClick={() => void saveName()}
          disabled={!name.trim() || saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:opacity-30"
          style={{ fontFamily: '"Funnel Sans", sans-serif' }}
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Save Changes
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {student ? (
        <button
          type="button"
          onClick={() => setView("preferences")}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
        >
          <Settings className="h-4 w-4 text-black" strokeWidth={1.5} />
          <span className="text-sm font-medium text-black">Update Preferences</span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          onDone();
          router.push("/courses");
        }}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
      >
        <LayoutGrid className="h-4 w-4 text-black" strokeWidth={1.5} />
        <span className="text-sm font-medium text-black">My Courses</span>
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-50"
      >
        <LogOut className="h-4 w-4 text-black" strokeWidth={1.5} />
        <span className="text-sm font-medium text-black">Log Out</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UserMenu — the user pill + dropdown (the m_ split lives here)        */
/* ------------------------------------------------------------------ */

function UserMenu({
  user,
  student,
  onLogout,
  onStudentUpdated,
  guest = false,
  variant,
}: {
  user: HeaderUser;
  student: HeaderStudent | null;
  onLogout: () => void;
  onStudentUpdated?: (name: string) => void;
  /** Guest mode (the /demo surface): the preferences save degrades to sign-up. */
  guest?: boolean;
  /** "desktop" shows name + email (or the course context line); "mobile" the name only. */
  variant: "desktop" | "mobile";
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>("items");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView("items");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const letter = avatarLetter(user.name);
  const context = student
    ? courseContextLine(student.currentSubject, student.contentSource)
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setView("items");
        }}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all hover:bg-black/10"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
          {letter}
        </div>
        {variant === "desktop" ? (
          <span className="text-sm font-medium text-black">{user.name}</span>
        ) : null}
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
            open && "rotate-180",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] bg-white shadow-xl",
            variant === "desktop" ? (student ? "w-80" : "") : "",
          )}
          style={{ minWidth: variant === "desktop" ? 200 : 220 }}
        >
          <div
            className="p-3"
            style={{ backgroundColor: "rgb(255, 253, 115)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full bg-black font-semibold text-sm text-white",
                  student ? "h-10 w-10" : "h-8 w-8",
                )}
              >
                {letter}
              </div>
              <div>
                <p className="text-sm font-semibold text-black">{user.name}</p>
                {student && context ? (
                  <p className="text-xs" style={{ color: "rgb(89, 89, 89)" }}>
                    {context}
                  </p>
                ) : variant === "desktop" ? (
                  <p className="text-xs text-black/50">{user.email}</p>
                ) : null}
              </div>
            </div>
          </div>
          <MenuBody
            user={user}
            student={student}
            guest={guest}
            view={view}
            setView={setView}
            onDone={() => {
              setOpen(false);
              setView("items");
            }}
            onLogout={() => void onLogout()}
            onStudentUpdated={(name) => {
              // Stay open in the items view after a save (the reference's
              // m_ panel returns to the menu list; the name updates in
              // place via the parent's refresh).
              setView("items");
              onStudentUpdated?.(name);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AppHeader                                                            */
/* ------------------------------------------------------------------ */

export function AppHeader({
  user,
  currentSubject,
  enrollments = [],
  student,
  onStudentUpdated,
  guest = false,
}: {
  user: HeaderUser;
  /** The student's current subject — non-null renders the CoursePill. */
  currentSubject?: string | null;
  /** The OTHER courses (the live filters out the current subject). */
  enrollments?: PillCourse[];
  /** Student context for the m_ user-menu variant (context line + preferences). */
  student?: HeaderStudent | null;
  onStudentUpdated?: (name: string) => void;
  /** Guest mode (the /demo surface): writes degrade to sign-up routes. */
  guest?: boolean;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MenuView>("items");
  const [loggingOut, setLoggingOut] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setMobileView("items");
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
      setMobileOpen(false);
      setMobileView("items");
    }
  }

  const letter = avatarLetter(user.name);
  const context = student
    ? courseContextLine(student.currentSubject, student.contentSource)
    : null;

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

      {/* Desktop: CoursePill (with course) + user pill */}
      <div className="hidden items-center gap-3 md:flex">
        {currentSubject != null ? (
          <CoursePill
            currentSubject={currentSubject}
            enrollments={enrollments}
            guest={guest}
          />
        ) : null}
        <UserMenu
          user={user}
          student={student ?? null}
          guest={guest}
          onLogout={() => void handleLogout()}
          onStudentUpdated={onStudentUpdated}
          variant="desktop"
        />
      </div>

      {/* Mobile hamburger + dropdown (name-only header, min-width 220px) */}
      <div className="relative md:hidden" ref={mobileRef}>
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-expanded={mobileOpen}
          onClick={() => {
            setMobileOpen((v) => !v);
            setMobileView("items");
          }}
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
                  {student && context ? (
                    <p className="text-xs" style={{ color: "rgb(89, 89, 89)" }}>
                      {context}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <MenuBody
              user={user}
              student={student ?? null}
              guest={guest}
              view={mobileView}
              setView={setMobileView}
              onDone={() => {
                if (loggingOut) return;
                setMobileOpen(false);
                setMobileView("items");
              }}
              onLogout={() => void handleLogout()}
              onStudentUpdated={(name) => {
                setMobileView("items");
                onStudentUpdated?.(name);
              }}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
