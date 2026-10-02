import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";

// Idempotent seed: wipes domain tables and recreates the demo account with
// the reference's sample Economics course (roadmap, quiz score, lesson
// progress) so a fresh checkout demos the full dashboard on first sign-in.
//   Demo login: demo@thinkerwell.app / Demo1234!

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const ECONOMICS_STAGES = [
  {
    title: "Microeconomic Foundations",
    description:
      "Students will explore the fundamental principles of supply and demand and how individual choices drive market outcomes. This stage covers elasticity, consumer behavior, and firm production decisions.",
  },
  {
    title: "Macroeconomic Principles",
    description:
      "This stage shifts focus to the broader economy, examining indicators like GDP, inflation, and unemployment. Students will learn how government policies and central banks influence national economic growth.",
  },
  {
    title: "Global Economic Systems",
    description:
      "Learners will analyze international trade, currency exchange rates, and the impact of globalization on local economies. The curriculum concludes with a look at how interconnected markets shape contemporary policy challenges.",
  },
];

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.diagnosticQuiz.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@thinkerwell.app",
      passwordHash: hashPassword("Demo1234!"),
      fullName: "Demo Learner",
    },
  });

  await prisma.student.create({
    data: {
      userId: user.id,
      name: "Demo Learner",
      currentSubject: "Economics",
      contentSource: "topic",
      quizCompleted: true,
    },
  });

  const enrollment = await prisma.courseEnrollment.create({
    data: {
      userId: user.id,
      courseName: "Economics",
      contentSource: "topic",
      quizScore: 4,
      quizCompleted: true,
      roadmapSteps: JSON.stringify(ECONOMICS_STAGES),
      gapAnalysis:
        "Your 4/7 score suggests a developing grasp of Economics. The personalized roadmap below balances your learning path, covering core areas progressively.",
    },
  });

  await prisma.lessonProgress.createMany({
    data: [0, 1, 2, 3].map((lessonIndex) => ({
      userId: user.id,
      courseId: enrollment.id,
      lessonIndex,
      completed: true,
      correctCount: 8,
      total: 8,
    })),
  });

  await prisma.chatMessage.create({
    data: {
      userId: user.id,
      courseId: enrollment.id,
      role: "assistant",
      content:
        "Hey! I'm Nori 👋 Ask me anything if you need a hint or want to talk through a concept.",
    },
  });

  console.log("Seeded demo account: demo@thinkerwell.app / Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
