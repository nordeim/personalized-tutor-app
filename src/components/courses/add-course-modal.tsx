"use client";

import { useRef, useState } from "react";
import { ADD_COURSE_TAGS, tagTopic } from "@/lib/domain";
import { BookOpen, ChevronRight, FileText, Sparkles, Upload, X } from "lucide-react";
import { useToast } from "@/components/toast";

// AddCourseModal — the reference's Q5 "Add a Course" in-page modal (session-4
// remediation R1), decoded from the live bundle and driven DOM:
//   overlay   fixed inset-0 z-50 flex items-center justify-center p-4,
//             bg rgba(0,0,0,0.75) + backdrop-blur(6px)
//   card      w-full max-w-md rounded-[24px] p-6 flex flex-col gap-5 relative,
//             bg #C8AEFF, maxHeight 90vh, overflowY auto
//   close     absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 (X)
//   modes     2 cards, radius 12, selected #FFFD73 / white
//   tags      6 single-label pills; click sets the topic "Subject: Sub"
//             (selected pill = bg #0F0E0E text white)
//   material  course-name input + Paste Text / Upload File tabs + textarea
//             or the dropzone ("Click to upload PDF or document")
//   submit    "Start Assessment" + ChevronRight, spinner while submitting
// The submit reuses the existing POST /api/courses/generate (Student upsert +
// enrollment + roadmap fallback) and hands the courseId to onAdded — the
// parent navigates to /quiz?course={id}, exactly like the reference's
// onAdded handler. Guest mode (the /demo surface) degrades to a sign-up
// notice instead of hitting the API.

type Mode = "topic" | "material";
type Tab = "text" | "file";

const FUNNEL = '"Funnel Sans", sans-serif';

export function AddCourseModal({
  onClose,
  onAdded,
  guest = false,
}: {
  onClose: () => void;
  /** Receives the created courseId (null in guest mode → sign-up route). */
  onAdded: (courseId: string | null) => void;
  /** Guest mode (the /demo surface): Start Assessment routes to sign-up. */
  guest?: boolean;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("topic");
  const [topic, setTopic] = useState("");
  const [courseName, setCourseName] = useState("");
  const [materialText, setMaterialText] = useState("");
  const [tab, setTab] = useState<Tab>("text");
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The live's S: topic.trim() in build mode; course-name AND content in
  // material mode.
  const canSubmit =
    mode === "topic"
      ? topic.trim().length > 0
      : courseName.trim().length > 0 && materialText.trim().length > 0;

  async function onFile(file: File) {
    setExtracting(true);
    try {
      // Text formats read client-side; binary formats (PDF/DOCX) degrade
      // with an honest notice — the self-hosted clone has no extraction
      // service (documented deviation K-5).
      if (/\.(txt|md|csv)$/i.test(file.name)) {
        const text = await file.text();
        setMaterialText(text.slice(0, 50_000));
        if (tab !== "text") setTab("text");
      } else {
        toast({
          title: "Cannot read that file yet",
          description:
            "PDF/DOCX extraction is not available in the self-hosted clone — paste the text instead.",
        });
      }
    } catch {
      toast({ title: "Could not read the file", description: "Try pasting the text instead." });
    } finally {
      setExtracting(false);
    }
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    if (guest) {
      // The demo surface: no session — route to sign-up like the other
      // guest CTAs (the reference posts to platform entities instead).
      toast({
        title: "Create a free account",
        description: "Sign up to save your course and start the assessment.",
      });
      onAdded(null);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "topic"
            ? { mode: "topic", topic: topic.trim() }
            : {
                mode: "material",
                courseName: courseName.trim(),
                contentText: materialText.trim(),
              },
        ),
      });
      const json = (await res.json()) as
        | { ok: true; data: { courseId: string; aiGenerated: boolean } }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        toast({ title: "Could not create the course", description: json.error.message });
        return;
      }
      if (!json.data.aiGenerated) {
        toast({
          title: "Course created",
          description: "The AI tutor is offline — using the built-in balanced roadmap.",
        });
      }
      onAdded(json.data.courseId);
    } catch {
      toast({ title: "Network error", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add a Course"
    >
      <div
        className="relative flex w-full max-w-md flex-col gap-5 rounded-[24px] p-6"
        style={{
          backgroundColor: "rgb(200, 174, 255)",
          fontFamily: FUNNEL,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-all hover:bg-black/20"
        >
          <X className="h-4 w-4 text-black" strokeWidth={1.5} />
        </button>

        <div>
          <h2 className="text-2xl font-normal text-black">Add a Course</h2>
          <p className="mt-1 text-sm font-light text-black/60">
            Choose what you&rsquo;d like to learn next.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-black">
            What would you like to learn?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("topic")}
              aria-pressed={mode === "topic"}
              className="flex flex-col items-start gap-3 p-4 text-left transition-all"
              style={{
                borderRadius: "12px",
                backgroundColor: mode === "topic" ? "rgb(255, 253, 115)" : "white",
              }}
            >
              <Sparkles className="h-7 w-7" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-normal leading-tight text-black">Build Me a Course</p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgb(89, 89, 89)" }}>
                  Tell us what you want to learn.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("material")}
              aria-pressed={mode === "material"}
              className="flex flex-col items-start gap-3 p-4 text-left transition-all"
              style={{
                borderRadius: "12px",
                backgroundColor: mode === "material" ? "rgb(255, 253, 115)" : "white",
              }}
            >
              <BookOpen className="h-7 w-7" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-normal leading-tight text-black">My Personal Material</p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgb(89, 89, 89)" }}>
                  Upload files or paste text.
                </p>
              </div>
            </button>
          </div>
        </div>

        {mode === "topic" ? (
          <div className="space-y-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Python programming, World War II..."
              className="w-full bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/20"
              style={{ borderRadius: "12px" }}
            />
            <div className="flex flex-wrap gap-1.5">
              {ADD_COURSE_TAGS.map((tag) => {
                const full = tagTopic(tag.subject, tag.sub);
                const selected = topic === full;
                return (
                  <button
                    key={tag.sub}
                    type="button"
                    onClick={() => setTopic(selected ? "" : full)}
                    className="rounded-full px-3 py-1 text-xs transition-all"
                    style={{
                      backgroundColor: selected ? "rgb(15, 14, 14)" : "rgba(255, 255, 255, 0.5)",
                      color: selected ? "white" : "rgb(15, 14, 14)",
                    }}
                  >
                    {tag.sub}
                  </button>
                );
              })}
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
              style={{ borderRadius: "12px" }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("text")}
                aria-pressed={tab === "text"}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all ${
                  tab === "text" ? "bg-black text-white" : "bg-white"
                }`}
                style={{ borderRadius: "12px" }}
              >
                <FileText className="h-3.5 w-3.5" />
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setTab("file")}
                aria-pressed={tab === "file"}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all ${
                  tab === "file" ? "bg-black text-white" : "bg-white"
                }`}
                style={{ borderRadius: "12px" }}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload File
              </button>
            </div>
            {tab === "text" ? (
              <textarea
                value={materialText}
                onChange={(e) => setMaterialText(e.target.value)}
                placeholder="Paste your notes or study material..."
                rows={4}
                className="w-full resize-none bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/20"
                style={{ borderRadius: "12px" }}
              />
            ) : (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 p-5 ${
                  extracting ? "bg-white/60" : "bg-white"
                }`}
                style={{ borderRadius: "12px" }}
              >
                {extracting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <p className="text-xs" style={{ color: "rgb(89, 89, 89)" }}>
                      Extracting...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-500" />
                    <p className="text-xs font-semibold text-black">
                      Click to upload PDF or document
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.csv"
                  className="hidden"
                  disabled={extracting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit || submitting}
          className="flex w-full items-center justify-center gap-2 bg-black py-3.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-30"
          style={{ borderRadius: "12px" }}
        >
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="flex items-center gap-2">
              Start Assessment
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
