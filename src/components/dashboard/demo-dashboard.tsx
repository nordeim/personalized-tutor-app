"use client";

import { useMemo } from "react";
import { CourseDashboard } from "@/components/dashboard/course-dashboard";
import { ToastProvider } from "@/components/toast";

// The guest demo dashboard — a static mirror of the course dashboard with
// the reference's sample Economics data: quiz 3/7 (which drives the live's
// exact 60% / 4/6 lessons / 3-day streak / 750 XP numbers via the quiz-
// derived model), the live's roadmap titles/descriptions, and 6 lessons.
const DEMO_ROADMAP = [
  {
    title: "Foundations of Microeconomics",
    description:
      "Students will explore the fundamental principles of supply, demand, and market equilibrium. This stage provides the groundwork for understanding how individual consumers and firms make rational decisions in a market economy.",
  },
  {
    title: "Macroeconomic Principles",
    description:
      "This stage shifts focus to the economy as a whole, covering topics like GDP, inflation, and unemployment. Learners will examine how government policies and fiscal actions influence national economic performance.",
  },
  {
    title: "Global Economic Systems",
    description:
      "Students will analyze international trade, currency exchange, and the complexities of global development. The curriculum concludes by investigating how interconnected nations manage resources and financial stability on a worldwide scale.",
  },
];

const DEMO_LESSONS = [
  "Foundations of Microeconomics: Basics",
  "Foundations of Microeconomics: In Practice",
  "Macroeconomic Principles: Fundamentals",
  "Macroeconomic Principles: Application",
  "Global Economic Systems: Deep Dive",
  "Global Economic Systems: Mastery",
];

export function DemoDashboard({
  bubbleQuote,
}: {
  /** Server-picked random bubble line (fresh each page load). */
  bubbleQuote?: { raw: string; text: string; author: string | null };
}) {
  const course = useMemo(
    () => ({
      id: "demo-enrollment",
      courseName: "Economics",
      quizScore: 3,
      quizCompleted: true,
      roadmapSteps: JSON.stringify(DEMO_ROADMAP),
      gapAnalysis:
        "You have a solid grasp of basic economic concepts. Focus on applying micro and macroeconomic principles to real-world scenarios.",
      lessonProgress: [0, 1, 2, 3].map((lessonIndex) => ({
        lessonIndex,
        completed: true,
        correctCount: 8,
        total: 8,
      })),
      roadmap: DEMO_ROADMAP,
      lessonTitles: DEMO_LESSONS,
    }),
    [],
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: "rgb(15, 14, 14)" }}>
        {/* The demo header is the standard chrome with a Guest pill (no
            dropdown — the demo is stateless; the CTA is to sign up). */}
        <header
          className="relative mx-[4px] mt-0 flex items-center justify-between rounded-b-[20px] px-4 py-3 md:px-8"
          style={{ backgroundColor: "rgb(255, 253, 115)" }}
        >
          <a href="/" className="flex items-center gap-2" aria-label="Thinkerwell home">
            <img src="/logo.svg" alt="" width={33} height={33} />
            <span style={{ fontFamily: "Eczar, serif", fontWeight: 400, fontSize: "16px", position: "relative", top: "2px" }}>
              Thinkerwell
            </span>
          </a>
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              Economics
            </span>
            <div className="h-4 w-px bg-black/20" />
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                G
              </div>
              <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
                Guest
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
              G
            </div>
            <span className="text-sm font-medium text-black" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
              Guest
            </span>
          </div>
        </header>
        <CourseDashboard
          user={{ name: "Guest", email: "guest@thinkerwell.demo" }}
          course={course}
          bubbleQuote={bubbleQuote}
          courses={[{ id: "demo-enrollment", name: "Economics", current: true }]}
        />
      </div>
    </ToastProvider>
  );
}
