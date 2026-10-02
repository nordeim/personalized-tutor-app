"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MascotHero, MascotHeroMobile } from "@/components/mascot";
import { CATEGORY_TAGS, DIVE_TOPICS } from "@/lib/domain";
import { useToast } from "@/components/toast";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";

// The onboarding dashboard (reference home with no active course):
// left hero card (mascot + typewriter "Dive into X" + feature pills),
// right purple setup panel (mode cards, sample course, topic/material
// inputs, category tags, Continue).

type Mode = "topic" | "material";
type MaterialTab = "text" | "file";

const FEATURE_ICONS = {
  brain: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain h-3.5 w-3.5">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target h-3.5 w-3.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  zap: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-3.5 w-3.5">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  ),
};

/**
 * The h1 typewriter — the reference's `o_` state machine (session-5 decode):
 * idle 2000 ms → deleting 50 ms/char → typing 60 ms/char → idle… The initial
 * state renders the FULL first topic (it starts held, then deletes), exactly
 * like the live ("Dive into Economics" on first paint).
 */
function useTypewriter(topics: readonly string[]): string {
  const [text, setText] = useState(topics[0] ?? "");
  // "deleting: true" at mount = the reference's post-idle state: the full
  // first topic is held for the initial 2000 ms, then the delete begins.
  const state = useRef({ topic: 0, pos: topics[0]?.length ?? 0, deleting: true });

  useEffect(() => {
    let timer: number;
    const tick = () => {
      const s = state.current;
      const current = topics[s.topic % topics.length];
      if (!s.deleting) {
        s.pos += 1;
        setText(current.slice(0, s.pos));
        if (s.pos >= current.length) {
          s.deleting = true;
          timer = window.setTimeout(tick, 2000);
          return;
        }
        timer = window.setTimeout(tick, 60);
      } else {
        s.pos -= 1;
        setText(current.slice(0, s.pos));
        if (s.pos <= 0) {
          s.deleting = false;
          s.topic = (s.topic + 1) % topics.length;
          timer = window.setTimeout(tick, 0);
          return;
        }
        timer = window.setTimeout(tick, 50);
      }
    };
    // The first cycle holds the full first topic for the idle period, then
    // deletes — matching the live's initial mount state.
    timer = window.setTimeout(tick, 2000);
    return () => window.clearTimeout(timer);
  }, [topics]);

  return text;
}

export function OnboardingDashboard({
  user,
  studentName,
  currentSubject,
}: {
  user: DashboardUser;
  studentName: string;
  currentSubject: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const typed = useTypewriter(DIVE_TOPICS);

  const [mode, setMode] = useState<Mode>("topic");
  const [topic, setTopic] = useState(currentSubject ?? "");
  const [courseName, setCourseName] = useState("");
  const [materialText, setMaterialText] = useState("");
  const [materialTab, setMaterialTab] = useState<MaterialTab>("text");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canContinue =
    mode === "topic"
      ? topic.trim().length >= 2
      : courseName.trim().length >= 2 && materialText.trim().length >= 20;

  async function generate(target: { mode: Mode; topic?: string; courseName?: string; contentText?: string }) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(target),
      });
      const json = (await res.json()) as
        | { ok: true; data: { courseId: string; courseName: string; aiGenerated: boolean } }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      if (!json.data.aiGenerated) {
        toast({
          title: "Course created",
          description: "The AI tutor is offline — using the built-in balanced roadmap.",
        });
      }
      router.push(`/quiz?course=${json.data.courseId}`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex flex-1 flex-col gap-[4px] px-[4px] pb-[4px] pt-[4px] lg:flex-row"
      style={{ minHeight: 0 }}
    >
      {/* Left hero card */}
      <div
        className="flex flex-col items-center justify-center rounded-[20px] p-6 md:min-h-[450px] md:p-12 lg:min-h-0 lg:flex-[2] lg:p-8"
        style={{ backgroundColor: "rgb(248, 248, 248)" }}
      >
        <MascotHero />
        <MascotHeroMobile className="mb-[8px]" />
        <div className="flex flex-col items-center text-center">
          <h1
            className="font-normal text-black"
            style={{
              fontFamily: '"Funnel Sans", sans-serif',
              fontSize: "clamp(40px, 7vw, 140px)",
              letterSpacing: "-0.03em",
              lineHeight: 0.88,
              whiteSpace: "nowrap",
            }}
          >
            Dive into
            <br />
            <span style={{ display: "block", textAlign: "center" }}>
              {typed}
              <span className="caret-blink" aria-hidden="true" />
            </span>
          </h1>
          <p
            className="mt-3 max-w-[340px] leading-relaxed"
            style={{
              fontFamily: '"Funnel Sans", sans-serif',
              fontSize: "15px",
              fontWeight: 300,
              color: "rgb(15, 14, 14)",
            }}
          >
            Upload your material or choose a topic. Your AI tutor will build a
            personalized learning path.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(
              [
                ["brain", "Finds Your Gaps"],
                ["target", "3-Level Mastery"],
                ["zap", "Any Subject"],
              ] as const
            ).map(([icon, label]) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-[9999px] bg-white px-3 py-1.5 text-xs"
                style={{ fontFamily: '"Funnel Sans", sans-serif', fontWeight: 400 }}
              >
                {FEATURE_ICONS[icon]}
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right setup panel */}
      <div
        className="flex items-center justify-center rounded-[20px] lg:flex-[1]"
        style={{ backgroundColor: "rgb(200, 174, 255)" }}
      >
        <div className="flex h-full w-full flex-col justify-center p-6" style={{ overflowY: "auto" }}>
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-2xl font-normal text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                Let&apos;s get you set up
              </h2>
              <p className="text-black" style={{ fontFamily: '"Funnel Sans", sans-serif', fontWeight: 300, fontSize: "15px" }}>
                Just a few details to personalize your experience.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                What would you like to learn?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("topic")}
                  className="flex flex-col items-start gap-3 p-4 text-left transition-all"
                  style={{
                    borderRadius: 12,
                    backgroundColor: mode === "topic" ? "rgb(15, 14, 14)" : "white",
                    color: mode === "topic" ? "white" : "black",
                  }}
                  aria-pressed={mode === "topic"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-8 w-8 flex-shrink-0" style={{ color: mode === "topic" ? "white" : "black" }}>
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                    <path d="M4 17v2" />
                    <path d="M5 18H3" />
                  </svg>
                  <div>
                    <p className="text-sm font-normal leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: mode === "topic" ? "white" : "black" }}>
                      Build Me a Course
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug" style={{ fontFamily: '"Funnel Sans", sans-serif', color: mode === "topic" ? "rgba(255, 255, 255, 0.6)" : "rgb(89, 89, 89)" }}>
                      Tell us what you want to learn — we&apos;ll build a course just for you.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("material")}
                  className="flex flex-col items-start gap-3 p-4 text-left transition-all"
                  style={{
                    borderRadius: 12,
                    backgroundColor: mode === "material" ? "rgb(15, 14, 14)" : "white",
                    color: mode === "material" ? "white" : "black",
                  }}
                  aria-pressed={mode === "material"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open h-8 w-8 flex-shrink-0" style={{ color: mode === "material" ? "white" : "black" }}>
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  <div>
                    <p className="text-sm font-normal leading-tight" style={{ fontFamily: '"Funnel Sans", sans-serif', color: mode === "material" ? "white" : "black" }}>
                      My Personal Material
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug" style={{ fontFamily: '"Funnel Sans", sans-serif', color: mode === "material" ? "rgba(255, 255, 255, 0.6)" : "rgb(89, 89, 89)" }}>
                      Upload files or paste text — we&apos;ll build a personalized learning path for you.
                    </p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode("topic");
                  void generate({ mode: "topic", topic: "Economics" });
                }}
                disabled={submitting}
                className="flex w-full items-center justify-between px-4 py-2.5 transition-all"
                style={{ borderRadius: 12, backgroundColor: "rgba(255, 255, 255, 0.5)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-[9999px] bg-black px-2 py-0.5 text-xs text-white" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                    Try it
                  </span>
                  <span className="text-sm text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                    Sample: Economics Course
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right h-4 w-4 text-black">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {mode === "topic" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Python programming, World War II, Music theory..."
                  className="w-full bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/20"
                  style={{ borderRadius: 12, fontFamily: '"Funnel Sans", sans-serif' }}
                  aria-label="What would you like to learn"
                />
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TAGS.map((tag) => (
                    <button
                      key={tag.topic}
                      type="button"
                      onClick={() => setTopic(`${tag.subject}: ${tag.topic}`)}
                      // The reference's tag chip (session-5 decode): py-1,
                      // text-[13px], leading-none, overflow-hidden — computed
                      // height 21px at bg rgba(255,255,255,0.5).
                      className="tag-btn flex items-center overflow-hidden rounded-[9999px] px-3 py-1 text-[13px] leading-none"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        fontFamily: '"Funnel Sans", sans-serif',
                      }}
                    >
                      <span
                        className="tag-subject"
                        style={{
                          fontWeight: 600,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                      >
                        {tag.subject}
                      </span>
                      <span style={{ fontWeight: 300 }}>{tag.topic}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Course name (e.g. Organic Chemistry, My History Notes...)"
                  className="w-full bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/20"
                  style={{ borderRadius: 12, fontFamily: '"Funnel Sans", sans-serif' }}
                  aria-label="Course name"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMaterialTab("text")}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all"
                    style={{
                      borderRadius: 12,
                      fontFamily: '"Funnel Sans", sans-serif',
                      backgroundColor: materialTab === "text" ? "black" : "white",
                      color: materialTab === "text" ? "white" : "black",
                    }}
                    aria-pressed={materialTab === "text"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard h-3.5 w-3.5">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    </svg>
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialTab("file");
                      fileInputRef.current?.click();
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all"
                    style={{
                      borderRadius: 12,
                      fontFamily: '"Funnel Sans", sans-serif',
                      backgroundColor: materialTab === "file" ? "black" : "white",
                      color: materialTab === "file" ? "white" : "black",
                    }}
                    aria-pressed={materialTab === "file"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload h-3.5 w-3.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    Upload File
                  </button>
                </div>
                <textarea
                  value={materialText}
                  onChange={(e) => setMaterialText(e.target.value)}
                  placeholder="Paste your notes or study material..."
                  rows={4}
                  className="w-full resize-none bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/20"
                  style={{ borderRadius: 12, fontFamily: '"Funnel Sans", sans-serif' }}
                  aria-label="Study material"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 500_000) {
                      setError("File too large — paste the text instead (500KB max).");
                      return;
                    }
                    try {
                      const text = await file.text();
                      setMaterialText(text.slice(0, 50_000));
                      setMaterialTab("text");
                    } catch {
                      setError("Could not read that file — paste the text instead.");
                    }
                  }}
                />
              </div>
            )}

            {error ? (
              <p className="text-sm font-medium" style={{ color: "#B3261E" }} role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canContinue || submitting}
              onClick={() =>
                void generate(
                  mode === "topic"
                    ? { mode, topic: topic.trim() }
                    : { mode, courseName: courseName.trim(), contentText: materialText },
                )
              }
              className="flex w-full items-center justify-center gap-2 bg-black py-3.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-30"
              style={{ borderRadius: 12, fontFamily: '"Funnel Sans", sans-serif' }}
            >
              <span className="flex items-center gap-2">
                {submitting ? "Preparing your course…" : "Continue"}
                {!submitting ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right h-4 w-4">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                ) : null}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
