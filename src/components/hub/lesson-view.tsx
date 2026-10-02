"use client";

import { useEffect, useRef, useState } from "react";
import { MascotGenerating } from "@/components/mascot";
import { encouragementFor } from "@/lib/quotes";
import { QUESTIONS_PER_LESSON, requeueQuestion } from "@/lib/domain";
import { confettiCourseComplete, confettiLevelUp } from "@/lib/confetti";
import { Zap, RotateCcw } from "lucide-react";

type QuizQuestion = { question: string; options: string[]; correctIndex: number };
type LessonContent = { coreConcept: string; questions: QuizQuestion[]; aiGenerated: boolean };

// LessonView — the lesson content pane, ported to the reference's exact quiz
// flow (mined from the live bundle's Y2 component):
//   * Submit → CORRECT: auto-advance after 800 ms (score = correct count / 8).
//   * Submit → WRONG: 800 ms later the in-pane retry modal — "Retry later"
//     re-queues the question at the end of the list, "Skip it" just advances.
//   * A lesson completes at 8 correct (or when the queue is exhausted — the
//     graceful fallback for an edge the reference leaves broken).
//   * Completing a stage-boundary lesson (index 1 or 3) shows the in-pane
//     "Level Up!" interstitial after 1200 ms (Zap tile + "Preparing Lesson
//     N…"), fires the level-up confetti burst, then advances after 800 ms.
//   * Completing the final lesson fires the dual side cannons and lands on
//     the celebration card.
//
// All state resets happen via remount — the parent keys this component on
// the active lesson.

const LEVEL_UP_DELAY_MS = 1200; // live: onCorrect → setTimeout(..., 1200)
const LEVEL_UP_HOLD_MS = 800; // live: interstitial → setTimeout(..., 800)
const ANSWER_FEEDBACK_MS = 800; // live: reveal → advance/retry-modal delay

export function LessonView({
  courseId,
  courseName,
  lessonIndex,
  lessonTitle,
  progress,
  onComplete,
  onLessonChange,
}: {
  courseId: string | null;
  courseName: string | null;
  lessonIndex: number;
  lessonTitle: string;
  progress: { lessonIndex: number; completed: boolean; correctCount: number; total: number }[];
  onComplete: (lessonIndex: number, correct: number, total: number) => void;
  onLessonChange: (index: number) => void;
}) {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [levelingUp, setLevelingUp] = useState(false);
  const [retryQ, setRetryQ] = useState<QuizQuestion | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
    },
    []
  );

  const isFinalLesson = lessonIndex === 5;
  const isStageBoundary = lessonIndex === 1 || lessonIndex === 3;

  function completeLesson(finalScore: number, total: number) {
    setFinished(true);
    if (courseId) {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonIndex,
          correct: finalScore,
          total,
        }),
      }).then(() => onComplete(lessonIndex, finalScore, total));
    } else {
      onComplete(lessonIndex, finalScore, total);
    }
    if (isFinalLesson) {
      confettiCourseComplete();
    } else if (isStageBoundary) {
      // live: 1200 ms → interstitial + burst → 800 ms → next lesson
      later(() => {
        setLevelingUp(true);
        confettiLevelUp();
        later(() => {
          setLevelingUp(false);
          onComplete(lessonIndex, finalScore, total);
          onLessonChange(lessonIndex + 1); // the live auto-advances into the next level
        }, LEVEL_UP_HOLD_MS);
      }, LEVEL_UP_DELAY_MS);
    }
  }

  function advance(score: number, total: number) {
    if (!content) return;
    if (score >= QUESTIONS_PER_LESSON) {
      completeLesson(score, total);
      return;
    }
    const nextIndex = qIndex + 1;
    if (nextIndex < content.questions.length) {
      setQIndex(nextIndex);
      setPicked(null);
      setRevealed(false);
    } else {
      // Queue exhausted below mastery (everything skipped) — the graceful
      // fallback: complete with the achieved score.
      completeLesson(score, total);
    }
  }

  function confirm() {
    if (picked === null || revealed || !q || !content) return;
    setRevealed(true);
    if (picked === q.correctIndex) {
      const nextScore = correctCount + 1;
      setCorrectCount(nextScore);
      later(() => advance(nextScore, content.questions.length), ANSWER_FEEDBACK_MS);
    } else {
      later(() => setRetryQ(q), ANSWER_FEEDBACK_MS);
    }
  }

  function retry(requeue: boolean) {
    if (!content || !retryQ) return;
    // live: "Retry later" appends a copy at the END of the queue; either way
    // the current position advances past the failed question.
    const questions = requeue ? requeueQuestion(content.questions, retryQ) : content.questions;
    setContent({ ...content, questions });
    setRetryQ(null);
    const nextIndex = qIndex + 1;
    if (nextIndex < questions.length) {
      setQIndex(nextIndex);
      setPicked(null);
      setRevealed(false);
    } else {
      advance(correctCount, questions.length);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!courseId) {
        // No course (fresh account): render the default grid lesson.
        if (!cancelled) {
          setContent({
            coreConcept:
              lessonIndex === 0
                ? "This level introduces fundamental concepts and core definitions required for general proficiency."
                : `This lesson builds on earlier concepts with worked examples and practice for ${lessonTitle.toLowerCase()}.`,
            questions: Array.from({ length: QUESTIONS_PER_LESSON }, (_, i) => ({
              question: `${lessonTitle} — practice question ${i + 1}: which statement is most accurate?`,
              options: [
                "The concept applies only in isolated cases",
                "This is a foundational concept with broad application",
                "This concept has no practical use",
                "This concept is unrelated to earlier lessons",
              ],
              correctIndex: 1,
            })),
            aiGenerated: false,
          });
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/lessons/content", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ courseId, lessonIndex }),
        });
        const json = (await res.json()) as
          | { ok: true; data: LessonContent }
          | { ok: false; error: { message: string } };
        if (!cancelled && json.ok) {
          setContent(json.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonIndex]);

  const q = content?.questions[qIndex];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <MascotGenerating />
        <p className="mt-4 text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
          Generating Lesson {lessonIndex + 1} content...
        </p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
          Couldn&apos;t load this lesson.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-[12px] bg-black px-5 py-2.5 text-sm font-bold text-white"
          style={{ fontFamily: '"Funnel Sans", sans-serif' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // The level-up interstitial replaces the pane (live: if(l) return …).
  if (levelingUp) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-fade-in-up space-y-4 text-center" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px]"
            style={{ backgroundColor: "rgb(255, 253, 115)" }}
          >
            <Zap className="h-6 w-6 text-black" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-normal text-black" style={{ letterSpacing: "-0.03em" }}>
            Level Up!
          </h2>
          <p className="text-sm font-light" style={{ color: "rgb(89, 89, 89)" }}>
            Preparing Lesson {(lessonIndex + 1) / 2 + 1}...
          </p>
        </div>
      </div>
    );
  }

  // The retry modal replaces the pane (live: if(N) return …).
  if (retryQ) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="animate-fade-in-up w-full max-w-md space-y-5 rounded-[20px] p-8 text-center"
          style={{ backgroundColor: "rgb(248, 248, 248)", fontFamily: '"Funnel Sans", sans-serif' }}
        >
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px]"
            style={{ backgroundColor: "rgb(255, 208, 208)" }}
          >
            <RotateCcw className="h-5 w-5 text-black" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-normal text-black" style={{ letterSpacing: "-0.02em" }}>
              Not quite!
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: "rgb(89, 89, 89)" }}>
              Would you like to retry this question later?
            </p>
            <div className="mt-3 rounded-[12px] p-3" style={{ backgroundColor: "rgb(240, 240, 240)" }}>
              <p className="text-sm font-light text-black">&ldquo;{retryQ.question}&rdquo;</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => retry(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-medium text-white transition-all"
              style={{ backgroundColor: "rgb(15, 14, 14)" }}
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Retry later
            </button>
            <button
              type="button"
              onClick={() => retry(false)}
              className="flex-1 rounded-[14px] py-3 text-sm font-medium transition-all"
              style={{ backgroundColor: "rgb(224, 224, 224)", color: "rgb(89, 89, 89)" }}
            >
              Skip it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="space-y-5" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-0.5 text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
              Lesson {lessonIndex + 1}
            </p>
            <h2 className="text-2xl font-normal text-black" style={{ letterSpacing: "-0.02em" }}>
              {lessonTitle}
            </h2>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
              {correctCount}/{content.questions.length} correct
            </p>
            <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "rgb(224, 224, 224)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(correctCount / content.questions.length) * 100}%`,
                  backgroundColor: "rgb(15, 14, 14)",
                }}
              />
            </div>
          </div>
        </div>

        {/* core concept */}
        <div className="flex items-start gap-3 rounded-[16px] p-4" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb mt-0.5 h-5 w-5 flex-shrink-0">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          <div>
            <p className="mb-1 text-xs font-medium text-black">Core Concept</p>
            <p className="text-sm font-light leading-relaxed text-black">{content.coreConcept}</p>
          </div>
        </div>

        {/* video placeholder */}
        <div className="overflow-hidden rounded-[16px]" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
          <div className="video-shimmer w-full" style={{ aspectRatio: "16 / 9" }} aria-hidden="true" />
        </div>

        {/* quiz / question card */}
        {finished ? (
          <div className="rounded-[16px] p-6 text-center" style={{ backgroundColor: "rgb(235, 226, 255)" }}>
            <p className="text-lg font-normal text-black">Lesson {lessonIndex + 1} complete!</p>
            <p className="mt-1 text-sm font-light" style={{ color: "rgb(89, 89, 89)" }}>
              You scored {correctCount}/{content.questions.length} — {encouragementFor(lessonIndex + 1)}
            </p>
            {isFinalLesson ? (
              <p className="mt-3 text-2xl font-normal text-black" style={{ letterSpacing: "-0.03em" }}>
                LEGENDARY! 🌟
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setQIndex(0);
                setPicked(null);
                setRevealed(false);
                setCorrectCount(0);
                setFinished(false);
              }}
              className="mt-5 rounded-[12px] bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800"
            >
              Practice again
            </button>
          </div>
        ) : q ? (
          <div className="rounded-[16px] p-5" style={{ backgroundColor: "rgb(245, 245, 245)" }}>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgb(89, 89, 89)" }}>
              Question {qIndex + 1}
            </p>
            <h3 className="mb-4 text-base font-medium leading-snug text-black">{q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = revealed && i === q.correctIndex;
                const isWrong = revealed && isPicked && i !== q.correctIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!revealed) setPicked(i);
                    }}
                    disabled={revealed}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm transition-all"
                    style={{
                      backgroundColor: isCorrect
                        ? "rgb(255, 253, 115)"
                        : isWrong
                          ? "rgb(255, 208, 208)"
                          : "white",
                      color: "rgb(15, 14, 14)",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                    }}
                    aria-pressed={isPicked}
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(0, 0, 0, 0.08)" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {isCorrect ? <span className="ml-2 font-semibold">✓</span> : null}
                    {isWrong ? <span className="ml-2 font-semibold">✗</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
                {revealed
                  ? picked === q.correctIndex
                    ? "Nailed it! ⚡ Your brain is on fire right now. Keep that momentum going!"
                    : "Not quite — the highlighted answer is correct."
                  : "Pick the best answer."}
              </p>
              {!revealed ? (
                <button
                  type="button"
                  disabled={picked === null}
                  onClick={confirm}
                  className="rounded-[12px] bg-black px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-30"
                >
                  Submit Answer
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
