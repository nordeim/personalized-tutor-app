// The mascot's daily encouragement quotes — the dashboard speech bubble.
// Curated set (the reference rotates one per day deterministically).

export const QUOTES: { text: string; author: string }[] = [
  {
    text: "By three methods we may learn wisdom: first, by reflection; second, by imitation; and third, by experience.",
    author: "Confucius",
  },
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
];

/** Deterministic pick: same quote all day, rotates daily. */
export function quoteOfTheDay(date = new Date()): { text: string; author: string } {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return QUOTES[dayIndex % QUOTES.length];
}

/** The hub's encouragement lines (shown while leveling up). */
export const ENCOURAGEMENTS = [
  "Every lesson you finish today is a step closer to who you want to become!",
  "You are becoming smarter and stronger with every lesson!",
  "You are one lesson away from a new perspective that could change everything!",
  "You're writing your own success story — one lesson at a time!",
] as const;

export function encouragementFor(lessonNumber: number): string {
  return ENCOURAGEMENTS[(lessonNumber - 1) % ENCOURAGEMENTS.length];
}
