"use client";

import { useMemo } from "react";
import { AppHeader } from "@/components/layout/app-header";
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
        {/* S4-F5: the live /demo header is the real two-pill chrome, not static
            spans — the bordered Economics Course pill ("This is your only
            course" + All Courses + Add a Course → the Q5 modal, guest-degraded)
            beside the Guest user pill (m_ dropdown with the "Economics ·
            Default" context line + Update Preferences + My Courses + Log Out,
            the preferences save degraded to a sign-up route in guest mode). */}
        <AppHeader
          user={{ name: "Guest", email: "guest@thinkerwell.demo" }}
          currentSubject="Economics"
          enrollments={[]}
          courses={[{ id: "demo-enrollment", name: "Economics", current: true }]}
          student={{ name: "Guest", currentSubject: "Economics", contentSource: null }}
          guest
        />
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
