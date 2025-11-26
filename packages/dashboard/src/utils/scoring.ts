interface SeverityCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

const WEIGHTS = {
  critical: 25,
  serious: 10,
  moderate: 3,
  minor: 1,
} as const;

export function calculateScore(counts: SeverityCounts): number {
  const totalPenalty =
    counts.critical * WEIGHTS.critical +
    counts.serious * WEIGHTS.serious +
    counts.moderate * WEIGHTS.moderate +
    counts.minor * WEIGHTS.minor;

  if (totalPenalty === 0) return 100;
  
  // Logarithmic scaling
  const score = Math.max(0, 100 - Math.log10(totalPenalty + 1) * 30);
  return Math.round(score);
}

export function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}