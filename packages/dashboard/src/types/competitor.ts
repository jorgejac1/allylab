export interface Competitor {
  id: string;
  url: string;
  name: string;
  lastScore?: number;
  lastScanned?: string;
  enabled: boolean;
}

export interface CompetitorScan {
  competitorId: string;
  url: string;
  name: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  scannedAt: string;
}

export interface BenchmarkData {
  yourSite: {
    url: string;
    score: number;
    totalIssues: number;
    grade: string;
  };
  competitors: CompetitorScan[];
  summary: {
    averageScore: number;
    yourRank: number;
    totalCompetitors: number;
    beating: number;
    losingTo: number;
  };
}