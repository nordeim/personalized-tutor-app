"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleCheckBig, CircleX, X } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { MascotGenerating } from "@/components/mascot";
import { ToastProvider } from "@/components/toast";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";
import { diagnosticScore, quizDotState, quizMarkerPct } from "@/lib/domain";
import { confettiAt } from "@/lib/domain";
import { confettiQuizMilestone } from "@/lib/confetti";

type QuizQuestion = { question: string; options: string[]; correctIndex: number };

// The diagnostic quiz — S11's E3 port (bundle-decoded, index-CkEI9gsZ.js):
// FIVE questions, the Ha-with-children header ("{subject} · Knowledge
// Assessment" + the X close), the star progress row, the tan option list
// with inline A./B. prefixes, the Confirm → reveal → Next Question /
// Submit Assessment flow, the dot strip, the "Skip quiz →" pill, and the
// dark "Preparing your assessment…" / "Analyzing your results…" overlays.
// The score is the CLIENT-side correct count (the live's
// `filter((G, re) => G === c[re].ans).length` — diagnosticScore).

const QUIZ_FONT = "'Funnel Sans', sans-serif";

export function QuizApp({
  user,
  course,
}: {
  user: DashboardUser;
  course: { id: string; courseName: string } | null;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const startedRef = useRef(false);

  const backTarget = course ? `/?course=${course.id}` : "/";

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      if (!course) {
        router.push("/onboarding");
        return;
      }
      try {
        const res = await fetch("/api/quiz/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ courseId: course.id }),
        });
        const json = (await res.json()) as
          | { ok: true; data: { questions: QuizQuestion[] } }
          | { ok: false; error: { message: string } };
        if (json.ok) {
          setQuestions(json.data.questions);
          setAnswers(new Array(json.data.questions.length).fill(-1));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [course, router]);

  const q = questions[current];

  function pick(i: number) {
    if (revealed) return;
    setPicked(i);
  }

  function confirm() {
    if (picked === null || revealed) return;
    setRevealed(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = picked;
      return next;
    });
    // The reference's confetti guard: fire when the running correct count
    // CROSSES 3 or 7 (upward only, first observation just initializes).
    const wasCorrect = picked === q.correctIndex;
    if (wasCorrect) {
      const prevCount = answers.filter((a, i) => a >= 0 && questions[i] && a === questions[i].correctIndex).length;
      const nextCount = prevCount + 1;
      if (confettiAt(prevCount, nextCount)) confettiQuizMilestone();
    }
  }

  function next() {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setPicked(null);
      setRevealed(false);
    } else {
      void submit();
    }
  }

  async function submit() {
    if (!course) return;
    setFinishing(true);
    // S11-F2: the live computes the score CLIENT-side (the correct count)
    // and the API stores it — never re-derive it from the answered count.
    const score = diagnosticScore(
      answers,
      questions.map((question) => question.correctIndex),
    );
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: course.id, answers, total: questions.length, score }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { redirectTo: string } }
        | { ok: false; error: { message: string } };
      if (json.ok) {
        router.push(json.data.redirectTo);
        router.refresh();
        return;
      }
    } catch {
      /* fall through */
    }
    setFinishing(false);
  }

  // S11-F5: the live's wO onSkip — resets the enrollment (quiz-incomplete)
  // and navigates to the course dashboard (the LLM roadmap the live generates
  // here is discarded by its own code — not replicated per the doctrine).
  async function skip() {
    if (!course || skipping) return;
    setSkipping(true);
    try {
      await fetch("/api/quiz/skip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
    } catch {
      /* navigate regardless — the reset is best-effort */
    }
    router.push(backTarget);
    router.refresh();
  }

  // The live's W overlay: the dark full-screen with the Ha-with-children
  // header + the centered mascot + the #C0C0C0 line.
  const overlayText = skipping
    ? "Preparing your course..."
    : finishing
      ? "Analyzing your results..."
      : "Preparing your assessment...";
  if (loading || finishing || skipping) {
    return (
      <QuizChrome user={user} subject={course?.courseName} backTarget={backTarget}>
        <div className="flex flex-1 items-center justify-center">
          <div className="space-y-4 text-center">
            <MascotGenerating />
            <p className="text-sm font-light" style={{ color: "#C0C0C0", fontFamily: QUIZ_FONT }}>
              {overlayText}
            </p>
          </div>
        </div>
      </QuizChrome>
    );
  }

  if (!course || questions.length === 0) {
    return (
      <QuizChrome user={user} subject={course?.courseName} backTarget={backTarget}>
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md text-center">
            <p className="text-sm font-medium text-black" style={{ fontFamily: QUIZ_FONT }}>
              We couldn&apos;t load the quiz.
            </p>
            <p className="mt-2 text-sm font-light" style={{ fontFamily: QUIZ_FONT, color: "rgb(89, 89, 89)" }}>
              Go back and pick what you&apos;d like to learn first.
            </p>
            <a
              href="/onboarding"
              className="mt-6 inline-block rounded-[12px] bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800"
              style={{ fontFamily: QUIZ_FONT }}
            >
              Back to setup
            </a>
          </div>
        </div>
      </QuizChrome>
    );
  }

  return (
    <QuizChrome
      user={user}
      subject={course.courseName}
      backTarget={backTarget}
      onSkip={skip}
    >
      <div className="flex flex-1 items-center justify-center px-[4px] py-6 md:px-6">
        <div className="animate-fade-in-up w-full max-w-lg">
          {/* the star progress row (S11-F1.3) */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative h-1 flex-1 rounded-[9999px]" style={{ backgroundColor: "#4A4A4A" }}>
              <div
                className="relative h-full rounded-[9999px] transition-all duration-700"
                style={{ width: `${quizMarkerPct(current, questions.length)}%`, backgroundColor: "#FFFD73" }}
              />
              <div
                className="absolute top-1/2 transition-all duration-700"
                style={{
                  left: `${quizMarkerPct(current, questions.length)}%`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              >
                <img src="/quiz-star.svg" alt="" style={{ width: 42, height: 42 }} />
              </div>
            </div>
            <span className="flex-shrink-0 text-xs font-light" style={{ color: "#C0C0C0", fontFamily: QUIZ_FONT }}>
              {current + 1}/{questions.length}
            </span>
          </div>

          {/* the question card (S11-F1.4-7) */}
          <div className="space-y-5 rounded-[20px] p-5 md:space-y-6 md:p-8" style={{ backgroundColor: "#F8F8F8" }}>
            <div className="flex items-start gap-4">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-medium"
                style={{ backgroundColor: "#D2C0F9", color: "#0F0E0E", fontFamily: QUIZ_FONT }}
              >
                {current + 1}
              </div>
              <h3
                className="pt-1 text-lg font-normal leading-snug text-black"
                style={{ fontFamily: QUIZ_FONT, letterSpacing: "-0.02em" }}
              >
                {q.question}
              </h3>
            </div>

            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = revealed && i === q.correctIndex;
                const isWrong = revealed && isPicked && i !== q.correctIndex;
                const dimmed = revealed && !isCorrect && !isWrong;
                const bg = isCorrect
                  ? "#BCFCAF"
                  : isWrong
                    ? "#FFD0D0"
                    : "#E1C8B9";
                const border =
                  !revealed && isPicked ? "1px solid #0F0E0E" : "1px solid transparent";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className="w-full rounded-[14px] p-4 text-left transition-all duration-200"
                    style={{
                      backgroundColor: bg,
                      border,
                      opacity: dimmed ? 0.4 : 1,
                      cursor: revealed ? "default" : "pointer",
                      fontFamily: QUIZ_FONT,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1">
                        <p className="text-sm font-light leading-snug text-black" style={{ fontFamily: QUIZ_FONT }}>
                          <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                        </p>
                      </div>
                      {revealed && isCorrect ? (
                        <CircleCheckBig className="h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
                      ) : revealed && isWrong ? (
                        <CircleX className="h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {revealed ? (
              <button
                type="button"
                onClick={next}
                className="ml-auto flex animate-fade-in-up items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-medium transition-all"
                style={{ backgroundColor: "#0F0E0E", color: "#FFFFFF", fontFamily: QUIZ_FONT }}
              >
                {current + 1 < questions.length ? "Next Question" : "Submit Assessment"}
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            ) : (
              <button
                type="button"
                disabled={picked === null}
                onClick={confirm}
                className="ml-auto flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor: picked === null ? "#E0E0E0" : "#0F0E0E",
                  color: picked === null ? "#999999" : "#FFFFFF",
                  cursor: picked === null ? "not-allowed" : "pointer",
                  fontFamily: QUIZ_FONT,
                }}
              >
                Confirm
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* the dot strip (S11-F1.8) */}
          <div className="mt-5 flex justify-center gap-2">
            {questions.map((_, i) => {
              const dot = quizDotState(i, current);
              return (
                <div
                  key={i}
                  className="h-1.5 rounded-[9999px] transition-all"
                  style={{ width: `${dot.w}px`, backgroundColor: dot.bg }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </QuizChrome>
  );
}

/**
 * The quiz page chrome (the live's wO + E3 shell): min-h-screen on the dark
 * gutter, the Ha-with-children header (the "{subject} · Knowledge
 * Assessment" span + the X close button REPLACING the desktop user menu;
 * mobile keeps the standard hamburger), and the fixed "Skip quiz →" pill
 * when the flow is active (the wO onSkip wiring).
 */
function QuizChrome({
  user,
  subject,
  backTarget,
  onSkip,
  children,
}: {
  user: DashboardUser;
  subject?: string;
  backTarget: string;
  onSkip?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <ToastProvider>
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: "rgb(15, 14, 14)", fontFamily: QUIZ_FONT }}
      >
        <AppHeader
          user={user}
          headerChildren={
            <>
              <span className="text-sm font-light text-black/60" style={{ fontFamily: QUIZ_FONT }}>
                {subject} ·{" "}
                <span className="font-medium text-black/80" style={{ fontFamily: QUIZ_FONT }}>
                  Knowledge Assessment
                </span>
              </span>
              <button
                type="button"
                aria-label="Close assessment"
                onClick={() => router.push(backTarget)}
                className="flex h-8 w-8 items-center justify-center rounded-[9999px] bg-black/10 transition-all hover:bg-black/20"
              >
                <X className="h-4 w-4 text-black" strokeWidth={1.5} />
              </button>
            </>
          }
        />
        {children}
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="fixed bottom-6 right-6 rounded-[9999px] px-4 py-2 text-xs font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: "#2A2A2A", color: "#C0C0C0", fontFamily: QUIZ_FONT }}
          >
            Skip quiz →
          </button>
        ) : null}
      </div>
    </ToastProvider>
  );
}
