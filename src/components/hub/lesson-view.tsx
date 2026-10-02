"use client";

import { useEffect, useRef, useState } from "react";
import { MascotGenerating } from "@/components/mascot";
import { encouragementFor } from "@/lib/quotes";
import { QUESTIONS_PER_LESSON, requeueQuestion } from "@/lib/domain";
import { confettiCourseComplete, confettiLevelUp } from "@/lib/confetti";
import {
  ChevronRight,
  CircleCheckBig,
  CircleX,
  FileText,
  Lightbulb,
  MapPin,
  Play,
  RotateCcw,
  Trophy,
  Zap,
} from "lucide-react";

type LessonQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  contentType: "video" | "text";
  contentText: string;
};
type LessonContent = {
  title: string;
  concept: string;
  scenario: string;
  challenge: string;
  questions: LessonQuestion[];
  aiGenerated: boolean;
};

// LessonView — ported to the reference's Y2 + gO/yO/xO + Im architecture
// (mined from the live bundle, session-3 remediation R7):
//
//   * The h2 shows the SUBJECT on level 1 and the generated level title on
//     levels 2/3; "Lesson N" + "{correct}/8 correct" + a w-24 progress bar
//     ride along.
//   * Level 1 renders the yellow "Core Concept" card (question 0 only);
//     level 2 the tan "Real-World Scenario" card; level 3 the lilac "Final
//     Boss Challenge" card.
//   * Every question carries a content card: "video" = the 16:9 shimmer with
//     a play button and an "Example video — …" caption; "text" = the
//     "Reading" card with the content_text paragraphs.
//   * Options form a 2-column grid of tan #E1C8B9 rounded-[14px] buttons;
//     a pick adds the black outline; the reveal paints the correct answer
//     green (#BCFCAF + CircleCheckBig) and a wrong pick red (#FFD0D0 +
//     CircleX) while the others dim to 40%.
//   * The submit button reads "Next Question" (ChevronRight, ml-auto) —
//     gray until an option is picked, hidden after the reveal.
//   * Timing (the live's): submit → 1000 ms reveal → onAnswer → (correct:
//     800 ms auto-advance / wrong: 800 ms → the in-pane retry modal, where
//     "Retry later" re-queues the question at the end and "Skip it" just
//     advances).
//   * A lesson completes at 8 correct (or queue exhaustion — the graceful
//     fallback for an edge the live leaves broken); stage boundaries show the
//     in-pane "Level Up!" interstitial (1200 ms → burst → 800 ms → advance);
//     the final lesson fires the dual confetti cannons.
//   * `onAnswered` reports the session's correct count so the Hub's Lesson
//     Progress card renders the reference's "{answered + 1}/8" label.
//
// State resets happen via remount — the parent keys this component on the
// active lesson.

const LEVEL_UP_DELAY_MS = 1200; // live: onCorrect → setTimeout(..., 1200)
const LEVEL_UP_HOLD_MS = 800; // live: interstitial → setTimeout(..., 800)
const ANSWER_FEEDBACK_MS = 1000; // live: submit → reveal → onAnswer (1e3)
const ADVANCE_MS = 800; // live: onAnswer → advance/retry-modal (800)

export function LessonView({
  courseId,
  courseName,
  lessonIndex,
  lessonTitle,
  subject,
  onComplete,
  onLessonChange,
  onAnswered,
  onQuestionChange,
}: {
  courseId: string | null;
  courseName: string | null;
  lessonIndex: number;
  lessonTitle: string;
  /** The h2 subject for level 1 (the live shows current_subject || "General"). */
  subject?: string;
  onComplete: (lessonIndex: number, correct: number, total: number) => void;
  onLessonChange: (index: number) => void;
  /** Session-correct-count reporter for the Hub's Lesson Progress card. */
  onAnswered?: (correct: number) => void;
  /** Active-question reporter — rides to Nori as chat context. */
  onQuestionChange?: (q: { question: string; options: string[] } | null) => void;
}) {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [levelingUp, setLevelingUp] = useState(false);
  const [retryQ, setRetryQ] = useState<LessonQuestion | null>(null);
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

  // The 1-based stage level (lessons 0-1 → 1, 2-3 → 2, 4-5 → 3).
  const level = Math.floor(lessonIndex / 2) + 1;
  const h2 = level === 1 ? (subject || courseName || "General") : (content?.title || lessonTitle);
  const isFinalLesson = lessonIndex === 5;
  const isStageBoundary = lessonIndex === 1 || lessonIndex === 3;
  const q = content?.questions[qIndex];

  useEffect(() => {
    onAnswered?.(0);
  }, [lessonIndex]);

  const activeQuestion = q ? { question: q.question, options: q.options } : null;
  useEffect(() => {
    onQuestionChange?.(activeQuestion);
  }, [activeQuestion?.question]);

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
      // live: 1200 ms → interstitial + burst → 800 ms → next level
      later(() => {
        setLevelingUp(true);
        confettiLevelUp();
        later(() => {
          setLevelingUp(false);
          onLessonChange(lessonIndex + 1); // the auto-advance into the next level
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
    // live: hold the reveal for 1s, THEN resolve correct/wrong.
    later(() => {
      if (picked === q.correctIndex) {
        const nextScore = correctCount + 1;
        setCorrectCount(nextScore);
        onAnswered?.(nextScore);
        later(() => advance(nextScore, content.questions.length), ADVANCE_MS);
      } else {
        later(() => setRetryQ(q), ADVANCE_MS);
      }
    }, ANSWER_FEEDBACK_MS);
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
        // No course (fresh account): render the default-grid lesson with
        // the reference's observed fallback shapes.
        if (!cancelled) {
          const levelLocal = Math.floor(lessonIndex / 2) + 1;
          setContent({
            title: lessonTitle,
            concept:
              levelLocal === 1
                ? "This level introduces the foundational concepts and basic principles required for understanding the subject."
                : levelLocal === 2
                  ? `This level applies the core ideas from ${lessonTitle} to concrete, real-world situations.`
                  : `This level synthesizes everything covered so far into advanced, exam-ready mastery.`,
            scenario:
              levelLocal === 2
                ? `A practical scenario: using ${lessonTitle} ideas to reason through a real decision.`
                : "",
            challenge:
              levelLocal === 3
                ? `Final challenge: synthesize the full roadmap and explain ${lessonTitle} from first principles.`
                : "",
            questions: Array.from({ length: QUESTIONS_PER_LESSON }, (_, i) => ({
              question: `What best describes the role of ${lessonTitle}?`,
              options: [
                "A foundational concept with broad application",
                "A detail with no practical impact",
                "An advanced exception to every rule",
                "An unrelated aside",
              ],
              correctIndex: 0,
              contentType: i % 2 === 0 ? "video" : "text",
              contentText:
                i % 2 === 0
                  ? `An overview of ${lessonTitle} and why it matters`
                  : `${lessonTitle} anchors the level.\n\nThis reading walks through the core idea, how it connects to the earlier stages, and where it shows up in practice.\n\nUse it as a refresher before answering.`,
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
  }, [courseId, lessonIndex, lessonTitle]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <MascotGenerating />
        <p className="mt-4 text-sm font-light" style={{ fontFamily: '"Funnel Sans", sans-serif', color: "rgb(89, 89, 89)" }}>
          Generating Lesson {level} content...
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
            Preparing Lesson {level + 1}...
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

  /* ---------------- per-question content card (the live's Im) ---------------- */
  /* ---------------- the level context card (gO/yO/xO) ---------------- */

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
              {h2}
            </h2>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
              {correctCount}/{content.questions.length} correct
            </p>
            <div className="h-1.5 w-24 overflow-hidden rounded-[9999px]" style={{ backgroundColor: "rgb(224, 224, 224)" }}>
              <div
                className="h-full rounded-[9999px] transition-all duration-500"
                style={{
                  width: `${(correctCount / content.questions.length) * 100}%`,
                  backgroundColor: "rgb(15, 14, 14)",
                }}
              />
            </div>
          </div>
        </div>

        {/* level context card */}
        <ContextCard
          level={level}
          qIndex={qIndex}
          concept={content.concept}
          scenario={content.scenario}
          challenge={content.challenge}
        />

        {/* quiz / question */}
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
                onAnswered?.(0);
              }}
              className="mt-5 rounded-[12px] bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800"
            >
              Practice again
            </button>
          </div>
        ) : q ? (
          <div>
            <ContentCard question={q} />
            <h3
              className="mb-4 mt-4 text-base font-normal text-black"
              style={{ lineHeight: 1.4 }}
            >
              {q.question}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {q.options.map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = revealed && i === q.correctIndex;
                const isWrong = revealed && isPicked && i !== q.correctIndex;
                const dimmed = revealed && !isCorrect && !isWrong;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!revealed) setPicked(i);
                    }}
                    disabled={revealed}
                    className="rounded-[14px] p-4 text-left transition-all duration-200"
                    style={{
                      backgroundColor: isCorrect
                        ? "rgb(188, 252, 175)"
                        : isWrong
                          ? "rgb(255, 208, 208)"
                          : "rgb(225, 200, 185)",
                      border: `1px solid ${isPicked && !revealed ? "rgb(15, 14, 14)" : "transparent"}`,
                      opacity: dimmed ? 0.4 : 1,
                      cursor: revealed ? "default" : "pointer",
                    }}
                    aria-pressed={isPicked}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-light leading-snug text-black">{opt}</p>
                      {revealed ? (
                        isCorrect ? (
                          <CircleCheckBig className="h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
                        ) : isWrong ? (
                          <CircleX className="h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
                        ) : null
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {!revealed ? (
              <button
                type="button"
                onClick={confirm}
                disabled={picked === null}
                className="ml-auto mt-4 flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-medium transition-all"
                style={{
                  fontFamily: '"Funnel Sans", sans-serif',
                  backgroundColor: picked === null ? "rgb(224, 224, 224)" : "rgb(15, 14, 14)",
                  color: picked === null ? "rgb(153, 153, 153)" : "rgb(255, 255, 255)",
                  cursor: picked === null ? "not-allowed" : "pointer",
                }}
              >
                Next Question
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- module-level cards (the live's Im + gO/yO/xO) ---------------- */

/** The per-question content card — video shimmer + play + caption, or the
 * "Reading" card with the content_text paragraphs. */
export function ContentCard({ question }: { question: LessonQuestion }) {
  if (!question.contentType || !question.contentText) return null;
  if (question.contentType === "video") {
    return (
      <div className="overflow-hidden rounded-[16px]" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
        <div className="video-shimmer relative w-full" style={{ aspectRatio: "16 / 9" }} aria-hidden="true">
          <div className="absolute inset-0 z-[1] flex items-center justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[9999px]"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
            >
              <Play className="h-5 w-5 text-white" strokeWidth={1.5} fill="white" />
            </div>
          </div>
        </div>
        <div className="px-1 pb-1 pt-2">
          <p className="text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
            Example video — {question.contentText}
          </p>
        </div>
      </div>
    );
  }
  const paragraphs = question.contentText.split(/\n+/).filter((p) => p.trim());
  return (
    <div className="rounded-[16px] p-5" style={{ backgroundColor: "rgb(240, 240, 240)" }}>
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
        <p className="text-xs font-medium text-black">Reading</p>
      </div>
      <div className="space-y-3" style={{ maxWidth: 500 }}>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm font-light leading-relaxed text-black">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

/** The level context card — Core Concept (L1, question 0 only), the
 * Real-World Scenario (L2), or the Final Boss Challenge (L3). */
export function ContextCard({
  level,
  qIndex,
  concept,
  scenario,
  challenge,
}: {
  level: number;
  qIndex: number;
  concept: string;
  scenario: string;
  challenge: string;
}) {
  if (level === 1 && qIndex === 0) {
    return (
      <div className="flex items-start gap-3 rounded-[16px] p-4" style={{ backgroundColor: "rgb(255, 253, 115)" }}>
        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
        <div>
          <p className="mb-1 text-xs font-medium text-black">Core Concept</p>
          <p className="text-sm font-light leading-relaxed text-black">{concept}</p>
        </div>
      </div>
    );
  }
  if (level === 2 && scenario) {
    return (
      <div className="flex items-start gap-3 rounded-[16px] p-4" style={{ backgroundColor: "rgb(225, 200, 185)" }}>
        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
        <div>
          <p className="mb-1 text-xs font-medium text-black">Real-World Scenario</p>
          <p className="text-sm font-light leading-relaxed text-black">{scenario}</p>
        </div>
      </div>
    );
  }
  if (level === 3 && challenge) {
    return (
      <div className="flex items-start gap-3 rounded-[16px] p-4" style={{ backgroundColor: "rgb(210, 192, 249)" }}>
        <Trophy className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" strokeWidth={1.5} />
        <div>
          <p className="mb-1 text-xs font-medium text-black">Final Boss Challenge</p>
          <p className="text-sm font-light leading-relaxed text-black">{challenge}</p>
        </div>
      </div>
    );
  }
  return null;
}
