// Bayesian prior: blends toward a global mean to prevent
// low-vote-count presentations from dominating the leaderboard.
// m = number of "phantom" average votes added to every entry.
//     Tuned for a ~15-person team (max ~14 voters per presentation).
// C = assumed global mean score (midpoint of 1–5 scale).
const BAYESIAN_WEIGHT = 3;
const GLOBAL_MEAN = 3.0;

export function computeFinalScore(scores: {
  avgIdea: number;
  avgExecution: number;
  avgHelpfulness: number;
  avgPresentation: number;
  voteCount: number;
}): number {
  const rawScore =
    scores.avgIdea * 0.3 +
    scores.avgExecution * 0.3 +
    scores.avgHelpfulness * 0.2 +
    scores.avgPresentation * 0.2;

  if (scores.voteCount === 0) return 0;

  // Bayesian average: (v / (v + m)) * R + (m / (v + m)) * C
  return (
    (scores.voteCount / (scores.voteCount + BAYESIAN_WEIGHT)) * rawScore +
    (BAYESIAN_WEIGHT / (scores.voteCount + BAYESIAN_WEIGHT)) * GLOBAL_MEAN
  );
}

export function formatScore(score: number | string): string {
  return Number(score).toFixed(2);
}

export function getRankSuffix(rank: number): string {
  if (rank % 100 >= 11 && rank % 100 <= 13) return "th";
  switch (rank % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export function getTimeRemaining(closesAt: string | Date): number {
  const end = new Date(closesAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((end - now) / 1000));
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
