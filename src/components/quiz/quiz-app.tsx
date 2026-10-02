"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MascotGenerating } from "@/components/mascot";
import { ToastProvider } from "@/components/toast";
import type { DashboardUser } from "@/components/dashboard/dashboard-app";
import { confettiAt } from "@/lib/domain";
import { confettiQuizMilestone } from "@/lib/confetti";

type QuizQuestion = { question: string; options: string[]; correctIndex: number };

// The diagnostic quiz: 7 questions, one at a time, immediate feedback,
// then a "Preparing your course..." overlay while the roadmap + gap
// analysis are stored, landing on the course dashboard (/?course=<id>).

export function QuizApp({
  user,
  course,
  studentName,
}: {
  user: DashboardUser;
  course: { id: string; courseName: string } | null;
  studentName: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const startedRef = useRef(false);

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
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: course.id, answers, total: questions.length }),
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

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 14, 14)" }}>
        <AppHeader user={user} />
        <div className="flex flex-1 gap-[4px] px-[4px] pb-[4px] pt-[4px]">
          <div
            className="flex flex-1 items-center justify-center rounded-[20px] p-6"
            style={{ backgroundColor: "rgb(248, 248, 248)" }}
          >
            {loading || finishing ? (
              <div className="flex flex-col items-center justify-center">
                <MascotGenerating />
                <p className="mt-4 text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                  {finishing ? "Preparing your course..." : "Loading your diagnostic quiz..."}
                </p>
              </div>
            ) : !course || questions.length === 0 ? (
              <div className="max-w-md text-center">
                <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                  We couldn&apos;t load the quiz.
                </p>
                <p className="mt-2 text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                  Go back and pick what you&apos;d like to learn first.
                </p>
                <a
                  href="/onboarding"
                  className="mt-6 inline-block rounded-[12px] bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800"
                  style={{ fontFamily: '"Funnel Sans", sans-serif' }}
                >
                  Back to setup
                </a>
              </div>
            ) : (
              <div className="w-full max-w-xl">
                {/* header */}
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                      Diagnostic Quiz
                    </p>
                    <h1 className="mt-1 text-2xl font-normal text-black" style={{ fontFamily: '"Funnel Sans", sans-serif', letterSpacing: "-0.02em" }}>
                      {course.courseName}
                    </h1>
                  </div>
                  <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                    {current + 1} / {questions.length}
                  </p>
                </div>
                <div className="mb-6 h-1.5 overflow-hidden rounded-[9999px] bg-black/10">
                  <div
                    className="h-full rounded-[9999px] bg-black transition-all duration-500"
                    style={{ width: `${((current + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
                  />
                </div>

                {/* question */}
                <div className="animate-fade-in-up">
                  <h2 className="mb-5 text-lg font-medium leading-snug text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                    {q.question}
                  </h2>
                  <div className="space-y-2.5">
                    {q.options.map((opt, i) => {
                      const isPicked = picked === i;
                      const isCorrect = revealed && i === q.correctIndex;
                      const isWrong = revealed && isPicked && i !== q.correctIndex;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => pick(i)}
                          disabled={revealed}
                          className="w-full rounded-[16px] px-4 py-3.5 text-left text-sm transition-all"
                          style={{
                            fontFamily: '"Funnel Sans", sans-serif',
                            backgroundColor: isCorrect
                              ? "rgb(255, 253, 115)"
                              : isWrong
                                ? "rgb(245, 235, 235)"
                                : isPicked
                                  ? "rgb(235, 226, 255)"
                                  : "white",
                            color: "rgb(15, 14, 14)",
                            border: "1px solid rgba(0, 0, 0, 0.06)",
                          }}
                          aria-pressed={isPicked}
                        >
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-[9999px] text-xs font-semibold" style={{ backgroundColor: "rgba(0, 0, 0, 0.08)" }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                          {isCorrect ? <span className="ml-2 font-semibold">✓</span> : null}
                          {isWrong ? <span className="ml-2 font-semibold">✗</span> : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-xs font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
                      {revealed
                        ? picked === q.correctIndex
                          ? "Nice — that's correct!"
                          : "Not quite — the highlighted answer is correct."
                        : "Pick the best answer."}
                    </p>
                    {!revealed ? (
                      <button
                        type="button"
                        disabled={picked === null}
                        onClick={confirm}
                        className="rounded-[12px] bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-30"
                        style={{ fontFamily: '"Funnel Sans", sans-serif' }}
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={next}
                        className="rounded-[12px] bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800"
                        style={{ fontFamily: '"Funnel Sans", sans-serif' }}
                      >
                        {current + 1 < questions.length ? "Next question" : "Build my course"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
