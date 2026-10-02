"use client";

import { useEffect, useState } from "react";
import { MascotGenerating } from "@/components/mascot";
import { encouragementFor } from "@/lib/quotes";
import { QUESTIONS_PER_LESSON } from "@/lib/domain";

type QuizQuestion = { question: string; options: string[]; correctIndex: number };
type LessonContent = { coreConcept: string; questions: QuizQuestion[]; aiGenerated: boolean };

// LessonView — the lesson content pane: header (lesson number, title,
// N/8 correct + progress), Core Concept yellow card, video placeholder,
// then the 8-question quiz with immediate feedback. Completing all
// questions posts /api/progress and unlocks the next lesson.

export function LessonView({
  courseId,
  courseName,
  lessonIndex,
  lessonTitle,
  progress,
  onComplete,
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

  const lessonState = progress.find((p) => p.lessonIndex === lessonIndex);
  const prevBest = lessonState?.correctCount ?? 0;

  useEffect(() => {
    let cancelled = false;
    // NOTE: per-lesson state resets happen via remount — the parent keys
    // this component on the active lesson, so the initial useState values
    // (loading, qIndex, picked, ...) are already fresh here.
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

  function confirm() {
    if (picked === null || revealed || !q) return;
    setRevealed(true);
    if (picked === q.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (!content) return;
    if (qIndex + 1 < content.questions.length) {
      setQIndex((i) => i + 1);
      setPicked(null);
      setRevealed(false);
    } else {
      setFinished(true);
      if (courseId) {
        void fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            courseId,
            lessonIndex,
            correct: correctCount,
            total: content.questions.length,
          }),
        }).then(() => onComplete(lessonIndex, correctCount, content.questions.length));
      } else {
        onComplete(lessonIndex, correctCount, content.questions.length);
      }
      if (correctCount > prevBest && lessonIndex % 2 === 1) {
        setLevelingUp(true);
        window.setTimeout(() => setLevelingUp(false), 2600);
      }
    }
  }

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
              {finished ? `${correctCount}/${content.questions.length} correct` : `${correctCount}/${content.questions.length} correct`}
            </p>
            <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "rgb(224, 224, 224)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((finished ? correctCount : qIndex) / content.questions.length) * 100}%`,
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
              Question {qIndex + 1} of {content.questions.length}
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
                          ? "rgb(240, 224, 224)"
                          : isPicked
                            ? "white"
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
                    ? "Correct!"
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
                  Check
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-[12px] bg-black px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800"
                >
                  {qIndex + 1 < content.questions.length ? "Next" : "Finish lesson"}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* level-up flash */}
        {levelingUp ? (
          <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ backgroundColor: "rgba(15, 14, 14, 0.85)" }}>
            <div className="text-center">
              <p className="text-3xl font-normal" style={{ color: "rgb(255, 253, 115)" }}>
                Level up!
              </p>
              <p className="mt-2 text-sm font-light text-white/70" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                {encouragementFor(lessonIndex + 1)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
