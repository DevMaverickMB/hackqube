export function computeFinalScore(scores: {
  avgIdea: number;
  avgExecution: number;
  avgHelpfulness: number;
  avgPresentation: number;
}): number {
  return (
    scores.avgIdea * 0.3 +
    scores.avgExecution * 0.3 +
    scores.avgHelpfulness * 0.2 +
    scores.avgPresentation * 0.2
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
