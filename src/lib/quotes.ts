// The mascot's content pool — mined VERBATIM from the live reference bundle
// (const Hy=[...]): ONE 99-line array mixing 49 authored quotes ("text" —
// Author) with 50 plain encouragement lines. The reference's dashboard bubble
// picks a line at RANDOM on each load (Hy[Math.floor(Math.random()*Hy.length)]),
// so authored quotes and encouragements both surface there. The encouragement
// half also backs the lesson-complete card and the level-up moments.
//
// Pinned by tests/parity-session2.test.ts — do not hand-edit; regenerate with
// scripts/extract-live-quotes.mjs if the reference pool ever changes.

/** One authored line of the reference pool. */
export type PoolQuote = { raw: string; text: string; author: string };

function parseQuote(raw: string): PoolQuote {
  const text = raw.slice(1, raw.lastIndexOf('"'));
  const author = raw.slice(raw.lastIndexOf("— ") + 2);
  return { raw, text, author };
}

export const QUOTE_POOL: PoolQuote[] = [
  {"raw":"\"An investment in knowledge pays the best interest.\" — Benjamin Franklin","text":"An investment in knowledge pays the best interest.","author":"Benjamin Franklin"},
  {"raw":"\"The mind is not a vessel to be filled, but a fire to be ignited.\" — Plutarch","text":"The mind is not a vessel to be filled, but a fire to be ignited.","author":"Plutarch"},
  {"raw":"\"Tell me and I forget. Teach me and I remember. Involve me and I learn.\" — Benjamin Franklin","text":"Tell me and I forget. Teach me and I remember. Involve me and I learn.","author":"Benjamin Franklin"},
  {"raw":"\"It does not matter how slowly you go as long as you do not stop.\" — Confucius","text":"It does not matter how slowly you go as long as you do not stop.","author":"Confucius"},
  {"raw":"\"Education is not the filling of a pail, but the lighting of a fire.\" — W.B. Yeats","text":"Education is not the filling of a pail, but the lighting of a fire.","author":"W.B. Yeats"},
  {"raw":"\"Knowing is not enough; we must apply. Willing is not enough; we must do.\" — Goethe","text":"Knowing is not enough; we must apply. Willing is not enough; we must do.","author":"Goethe"},
  {"raw":"\"The secret of getting ahead is getting started.\" — Mark Twain","text":"The secret of getting ahead is getting started.","author":"Mark Twain"},
  {"raw":"\"Genius is one percent inspiration and ninety-nine percent perspiration.\" — Thomas Edison","text":"Genius is one percent inspiration and ninety-nine percent perspiration.","author":"Thomas Edison"},
  {"raw":"\"Whether you think you can or you think you can't, you're right.\" — Henry Ford","text":"Whether you think you can or you think you can't, you're right.","author":"Henry Ford"},
  {"raw":"\"The journey of a thousand miles begins with one step.\" — Lao Tzu","text":"The journey of a thousand miles begins with one step.","author":"Lao Tzu"},
  {"raw":"\"What we learn with pleasure we never forget.\" — Alfred Mercier","text":"What we learn with pleasure we never forget.","author":"Alfred Mercier"},
  {"raw":"\"To teach is to learn twice.\" — Joseph Joubert","text":"To teach is to learn twice.","author":"Joseph Joubert"},
  {"raw":"\"The roots of education are bitter, but the fruit is sweet.\" — Aristotle","text":"The roots of education are bitter, but the fruit is sweet.","author":"Aristotle"},
  {"raw":"\"Knowledge is power.\" — Francis Bacon","text":"Knowledge is power.","author":"Francis Bacon"},
  {"raw":"\"The wisest mind has something yet to learn.\" — George Santayana","text":"The wisest mind has something yet to learn.","author":"George Santayana"},
  {"raw":"\"Do not wait to strike till the iron is hot, but make it hot by striking.\" — W.B. Yeats","text":"Do not wait to strike till the iron is hot, but make it hot by striking.","author":"W.B. Yeats"},
  {"raw":"\"Continuous improvement is better than delayed perfection.\" — Mark Twain","text":"Continuous improvement is better than delayed perfection.","author":"Mark Twain"},
  {"raw":"\"A person who never made a mistake never tried anything new.\" — Albert Einstein","text":"A person who never made a mistake never tried anything new.","author":"Albert Einstein"},
  {"raw":"\"Compound interest is the eighth wonder of the world.\" — Albert Einstein","text":"Compound interest is the eighth wonder of the world.","author":"Albert Einstein"},
  {"raw":"\"Strive not to be a success, but rather to be of value.\" — Albert Einstein","text":"Strive not to be a success, but rather to be of value.","author":"Albert Einstein"},
  {"raw":"\"In the middle of every difficulty lies opportunity.\" — Albert Einstein","text":"In the middle of every difficulty lies opportunity.","author":"Albert Einstein"},
  {"raw":"\"Imagination is more important than knowledge.\" — Albert Einstein","text":"Imagination is more important than knowledge.","author":"Albert Einstein"},
  {"raw":"\"Logic will get you from A to B. Imagination will take you everywhere.\" — Albert Einstein","text":"Logic will get you from A to B. Imagination will take you everywhere.","author":"Albert Einstein"},
  {"raw":"\"The true sign of intelligence is not knowledge but imagination.\" — Albert Einstein","text":"The true sign of intelligence is not knowledge but imagination.","author":"Albert Einstein"},
  {"raw":"\"If you can't explain it simply, you don't understand it well enough.\" — Albert Einstein","text":"If you can't explain it simply, you don't understand it well enough.","author":"Albert Einstein"},
  {"raw":"\"Believe you can and you're halfway there.\" — Theodore Roosevelt","text":"Believe you can and you're halfway there.","author":"Theodore Roosevelt"},
  {"raw":"\"Do what you can, with what you have, where you are.\" — Theodore Roosevelt","text":"Do what you can, with what you have, where you are.","author":"Theodore Roosevelt"},
  {"raw":"\"The more that you read, the more things you will know. The more that you learn, the more places you'll go.\" — Dr. Seuss","text":"The more that you read, the more things you will know. The more that you learn, the more places you'll go.","author":"Dr. Seuss"},
  {"raw":"\"An ounce of practice is worth more than tons of preaching.\" — Mahatma Gandhi","text":"An ounce of practice is worth more than tons of preaching.","author":"Mahatma Gandhi"},
  {"raw":"\"Live as if you were to die tomorrow. Learn as if you were to live forever.\" — Mahatma Gandhi","text":"Live as if you were to die tomorrow. Learn as if you were to live forever.","author":"Mahatma Gandhi"},
  {"raw":"\"Strength does not come from physical capacity. It comes from an indomitable will.\" — Mahatma Gandhi","text":"Strength does not come from physical capacity. It comes from an indomitable will.","author":"Mahatma Gandhi"},
  {"raw":"\"There is no end to education.\" — Jiddu Krishnamurti","text":"There is no end to education.","author":"Jiddu Krishnamurti"},
  {"raw":"\"Science is organized knowledge. Wisdom is organized life.\" — Immanuel Kant","text":"Science is organized knowledge. Wisdom is organized life.","author":"Immanuel Kant"},
  {"raw":"\"Give me six hours to chop down a tree and I will spend the first four sharpening the axe.\" — Abraham Lincoln","text":"Give me six hours to chop down a tree and I will spend the first four sharpening the axe.","author":"Abraham Lincoln"},
  {"raw":"\"Nearly all men can stand adversity, but if you want to test a man's character, give him power.\" — Abraham Lincoln","text":"Nearly all men can stand adversity, but if you want to test a man's character, give him power.","author":"Abraham Lincoln"},
  {"raw":"\"Whatever you are, be a good one.\" — Abraham Lincoln","text":"Whatever you are, be a good one.","author":"Abraham Lincoln"},
  {"raw":"\"I have not failed. I've just found 10,000 ways that won't work.\" — Thomas Edison","text":"I have not failed. I've just found 10,000 ways that won't work.","author":"Thomas Edison"},
  {"raw":"\"Our greatest weakness lies in giving up.\" — Thomas Edison","text":"Our greatest weakness lies in giving up.","author":"Thomas Edison"},
  {"raw":"\"The secret of change is to focus all of your energy not on fighting the old, but on building the new.\" — Socrates","text":"The secret of change is to focus all of your energy not on fighting the old, but on building the new.","author":"Socrates"},
  {"raw":"\"Wonder is the beginning of wisdom.\" — Socrates","text":"Wonder is the beginning of wisdom.","author":"Socrates"},
  {"raw":"\"By three methods we may learn wisdom: first, by reflection; second, by imitation; and third, by experience.\" — Confucius","text":"By three methods we may learn wisdom: first, by reflection; second, by imitation; and third, by experience.","author":"Confucius"},
  {"raw":"\"The will to win, the desire to succeed, the urge to reach your full potential — these are the keys that will unlock the door to personal excellence.\" — Confucius","text":"The will to win, the desire to succeed, the urge to reach your full potential — these are the keys that will unlock the door to personal excellence.","author":"Confucius"},
  {"raw":"\"Real knowledge is to know the extent of one's ignorance.\" — Confucius","text":"Real knowledge is to know the extent of one's ignorance.","author":"Confucius"},
  {"raw":"\"Education is the best provision for old age.\" — Aristotle","text":"Education is the best provision for old age.","author":"Aristotle"},
  {"raw":"\"We are what we repeatedly do. Excellence, then, is not an act, but a habit.\" — Aristotle","text":"We are what we repeatedly do. Excellence, then, is not an act, but a habit.","author":"Aristotle"},
  {"raw":"\"The more I read, the more I acquire, the more certain I am that I know nothing.\" — Voltaire","text":"The more I read, the more I acquire, the more certain I am that I know nothing.","author":"Voltaire"},
  {"raw":"\"Judge a man by his questions rather than his answers.\" — Voltaire","text":"Judge a man by his questions rather than his answers.","author":"Voltaire"},
  {"raw":"\"Nothing in life is to be feared, it is only to be understood.\" — Marie Curie","text":"Nothing in life is to be feared, it is only to be understood.","author":"Marie Curie"},
  {"raw":"\"I was taught that the way of progress was neither swift nor easy.\" — Marie Curie","text":"I was taught that the way of progress was neither swift nor easy.","author":"Marie Curie"},
];

export const ENCOURAGEMENT_POOL: string[] = [
  "Every lesson you finish today is a step closer to who you want to become!",
  "You showed up to learn today — that already makes you ahead of most!",
  "Small progress every day adds up to massive results. Keep going!",
  "Curiosity is your superpower — use it every single day!",
  "The best investment you can make is in yourself. You're already doing it!",
  "Your future self will thank you for every minute you spend learning today!",
  "Growth happens one question at a time — keep asking!",
  "You are building skills today that will open doors tomorrow!",
  "Every expert started exactly where you are right now. Keep going!",
  "The fact that you're here means you're already winning!",
  "Learning something new today is the best gift you can give yourself!",
  "Your brain is growing stronger with every concept you master!",
  "Don't stop now — the breakthrough might be just one more session away!",
  "Consistency is the key — and you're proving you have it!",
  "Each session brings you one step closer to mastery!",
  "You don't have to be perfect — you just have to keep showing up!",
  "Every question you ask is proof of a curious and growing mind!",
  "Progress, not perfection, is what matters most!",
  "You are becoming smarter and stronger with every lesson!",
  "The effort you put in today is quietly shaping the person you'll be tomorrow!",
  "Challenges are just opportunities to grow in disguise!",
  "Stay consistent and the results will follow — they always do!",
  "You're not just learning facts — you're building a sharper mind!",
  "Every answer you figure out on your own builds real confidence!",
  "Small steps every day lead to big achievements over time!",
  "You've got this — one concept at a time, one day at a time!",
  "The hardest part is showing up. You already did that — now shine!",
  "Learning is a superpower and you're leveling it up every day!",
  "Don't compare your beginning to someone else's middle — your pace is perfect!",
  "Every session you complete is a promise kept to your future self!",
  "Trust the process — great things take time and consistency!",
  "The more you learn, the more possibilities open up for you!",
  "You're not just studying — you're investing in a better version of yourself!",
  "Keep the momentum going — today's effort is tomorrow's advantage!",
  "Struggle is part of the journey — it means you're growing!",
  "Your dedication today is building the foundation of your success!",
  "Every concept you master is a new tool in your toolbox for life!",
  "You are capable of more than you think — keep proving it to yourself!",
  "The world rewards people who never stop learning — keep going!",
  "Showing up today, even when it's hard, is what separates good from great!",
  "You're writing your own success story — one lesson at a time!",
  "Growth is never comfortable, but it's always worth it!",
  "Keep learning, keep growing — the best version of you is still ahead!",
  "Every minute spent learning is a minute invested in your future!",
  "Your effort and your curiosity are your greatest assets — nurture them!",
  "The joy of learning is that it never truly ends — embrace the journey!",
  "Be patient with yourself — real growth takes time and that's okay!",
  "You are one lesson away from a new perspective that could change everything!",
  "Learning today means leading tomorrow!",
  "Stay curious, stay hungry — the best discoveries are still ahead of you!",
];

/** The full 99-line pool in reference order (quotes first, then encouragements). */
export const POOL: string[] = [...QUOTE_POOL.map((q) => q.raw), ...ENCOURAGEMENT_POOL];

/** Random pick with an injectable rng — the reference's per-load bubble pick. */
export function randomLine(rng: () => number = Math.random): string {
  return POOL[Math.floor(rng() * POOL.length)];
}

/** Random authored quote (text + author split) for the speech bubble. */
export function randomQuote(
  rng: () => number = Math.random
): { raw: string; text: string; author: string | null } {
  const raw = randomLine(rng);
  const parsed = QUOTE_POOL.find((q) => q.raw === raw);
  return parsed
    ? { raw, text: parsed.text, author: parsed.author }
    : { raw, text: raw, author: null };
}

/** Deterministic pick used by the lesson-complete card (cycles the pool). */
export function encouragementFor(lessonNumber: number): string {
  const n = Math.max(1, Math.floor(lessonNumber) || 1);
  return ENCOURAGEMENT_POOL[(n - 1) % ENCOURAGEMENT_POOL.length];
}

// parseQuote helper (used by the generator above; kept for callers that hold a raw line).
export { parseQuote };
