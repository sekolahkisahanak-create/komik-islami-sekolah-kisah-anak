export type QuizMode = "santai" | "tantangan";

export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;
export const STREAK_STEP = 10;
export const MAX_STREAK_BONUS = 50;

/** Points for one answer. `streak` is the streak count INCLUDING this answer. */
export function pointsFor(opts: { correct: boolean; mode: QuizMode; secondsLeft: number; limit: number; streak: number }) {
  if (!opts.correct) return 0;
  let pts = BASE_POINTS;
  if (opts.mode === "tantangan" && opts.limit > 0) {
    const ratio = Math.max(0, Math.min(1, opts.secondsLeft / opts.limit));
    pts += Math.round(MAX_SPEED_BONUS * ratio);
  }
  if (opts.streak >= 2) pts += Math.min(MAX_STREAK_BONUS, STREAK_STEP * (opts.streak - 1));
  return pts;
}

export function starsFor(correct: number, total: number) {
  if (total <= 0) return 1;
  const r = correct / total;
  if (r >= 0.9) return 3;
  if (r >= 0.6) return 2;
  return 1;
}

/** Lifetime total = sum of the best score per episode quiz. */
export function lifetimeTotal(attempts: { episode_id: string; score: number }[]) {
  const best = new Map<string, number>();
  for (const a of attempts) best.set(a.episode_id, Math.max(best.get(a.episode_id) ?? 0, a.score));
  return [...best.values()].reduce((s, v) => s + v, 0);
}

/** 50:50 — returns the indexes of two wrong options to hide. */
export function fiftyFifty(optionCount: number, correctIndex: number, rand: () => number = Math.random) {
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== correctIndex);
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = wrong[i]!; wrong[i] = wrong[j]!; wrong[j] = t;
  }
  return wrong.slice(0, 2);
}
