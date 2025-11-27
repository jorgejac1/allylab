import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Types for trend data
interface TrendDataPoint {
  date: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

interface ScanInput {
  id: string;
  url: string;
  timestamp: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

interface TrendQuery {
  url?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface TrendRequestBody {
  scans: ScanInput[];
}

interface CompareQuery {
  url?: string;
}

interface CompareRequestBody {
  scans: ScanInput[];
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
}

export async function trendsRoutes(fastify: FastifyInstance) {
  // POST /trends - Get score trends over time
  fastify.post<{ Querystring: TrendQuery; Body: TrendRequestBody }>(
    '/trends',
    async (request: FastifyRequest<{ Querystring: TrendQuery; Body: TrendRequestBody }>, reply: FastifyReply) => {
      try {
        const { url, startDate, endDate, limit = 50 } = request.query;
        const { scans } = request.body;

        if (!scans || !Array.isArray(scans)) {
          return reply.status(400).send({
            success: false,
            error: 'scans array is required in request body',
          });
        }

        let filtered = [...scans];

        // Filter by URL
        if (url) {
          const targetHost = new URL(url).hostname;
          filtered = filtered.filter(s => {
            try {
              return new URL(s.url).hostname === targetHost;
            } catch {
              return false;
            }
          });
        }

        // Filter by date range
        if (startDate) {
          const start = new Date(startDate).getTime();
          filtered = filtered.filter(s => new Date(s.timestamp).getTime() >= start);
        }

        if (endDate) {
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(s => new Date(s.timestamp).getTime() <= end);
        }

        // Sort by timestamp
        filtered.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Limit results
        filtered = filtered.slice(-limit);

        // Transform to trend data points
        const trendData: TrendDataPoint[] = filtered.map(scan => ({
          date: scan.timestamp,
          score: scan.score,
          totalIssues: scan.totalIssues,
          critical: scan.critical,
          serious: scan.serious,
          moderate: scan.moderate,
          minor: scan.minor,
        }));

        // Calculate statistics
        const stats = calculateStats(filtered);

        return reply.send({
          success: true,
          data: {
            trends: trendData,
            stats,
            meta: {
              totalScans: filtered.length,
              dateRange: {
                start: filtered[0]?.timestamp || null,
                end: filtered[filtered.length - 1]?.timestamp || null,
              },
            },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Trends] Error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // POST /trends/issues - Get issue trends by severity
  fastify.post<{ Querystring: TrendQuery; Body: TrendRequestBody }>(
    '/trends/issues',
    async (request: FastifyRequest<{ Querystring: TrendQuery; Body: TrendRequestBody }>, reply: FastifyReply) => {
      try {
        const { url, startDate, endDate, limit = 50 } = request.query;
        const { scans } = request.body;

        if (!scans || !Array.isArray(scans)) {
          return reply.status(400).send({
            success: false,
            error: 'scans array is required in request body',
          });
        }

        let filtered = [...scans];

        // Apply filters
        if (url) {
          const targetHost = new URL(url).hostname;
          filtered = filtered.filter(s => {
            try {
              return new URL(s.url).hostname === targetHost;
            } catch {
              return false;
            }
          });
        }

        if (startDate) {
          const start = new Date(startDate).getTime();
          filtered = filtered.filter(s => new Date(s.timestamp).getTime() >= start);
        }

        if (endDate) {
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(s => new Date(s.timestamp).getTime() <= end);
        }

        filtered.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        filtered = filtered.slice(-limit);

        // Group by severity over time
        const issueTrends = filtered.map(scan => ({
          date: scan.timestamp,
          critical: scan.critical,
          serious: scan.serious,
          moderate: scan.moderate,
          minor: scan.minor,
          total: scan.totalIssues,
        }));

        // Calculate change rates
        const changeRates = calculateChangeRates(filtered);

        return reply.send({
          success: true,
          data: {
            trends: issueTrends,
            changeRates,
            meta: {
              totalScans: filtered.length,
            },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Trends/Issues] Error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // POST /trends/compare - Compare two time periods
  fastify.post<{ Querystring: CompareQuery; Body: CompareRequestBody }>(
    '/trends/compare',
    async (request: FastifyRequest<{ Querystring: CompareQuery; Body: CompareRequestBody }>, reply: FastifyReply) => {
      try {
        const { url } = request.query;
        const { scans, period1Start, period1End, period2Start, period2End } = request.body;

        if (!scans || !Array.isArray(scans)) {
          return reply.status(400).send({
            success: false,
            error: 'scans array is required',
          });
        }

        if (!period1Start || !period1End || !period2Start || !period2End) {
          return reply.status(400).send({
            success: false,
            error: 'Both period date ranges are required',
          });
        }

        let filtered = [...scans];

        if (url) {
          const targetHost = new URL(url).hostname;
          filtered = filtered.filter(s => {
            try {
              return new URL(s.url).hostname === targetHost;
            } catch {
              return false;
            }
          });
        }

        // Split into periods
        const p1Start = new Date(period1Start).getTime();
        const p1End = new Date(period1End).getTime();
        const p2Start = new Date(period2Start).getTime();
        const p2End = new Date(period2End).getTime();

        const period1Scans = filtered.filter(s => {
          const t = new Date(s.timestamp).getTime();
          return t >= p1Start && t <= p1End;
        });

        const period2Scans = filtered.filter(s => {
          const t = new Date(s.timestamp).getTime();
          return t >= p2Start && t <= p2End;
        });

        const period1Stats = calculateStats(period1Scans);
        const period2Stats = calculateStats(period2Scans);

        // Calculate differences
        const comparison = {
          score: {
            period1: period1Stats.avgScore,
            period2: period2Stats.avgScore,
            change: period2Stats.avgScore - period1Stats.avgScore,
            changePercent: period1Stats.avgScore > 0 
              ? ((period2Stats.avgScore - period1Stats.avgScore) / period1Stats.avgScore) * 100 
              : 0,
          },
          issues: {
            period1: period1Stats.avgIssues,
            period2: period2Stats.avgIssues,
            change: period2Stats.avgIssues - period1Stats.avgIssues,
            changePercent: period1Stats.avgIssues > 0
              ? ((period2Stats.avgIssues - period1Stats.avgIssues) / period1Stats.avgIssues) * 100
              : 0,
          },
          critical: {
            period1: period1Stats.avgCritical,
            period2: period2Stats.avgCritical,
            change: period2Stats.avgCritical - period1Stats.avgCritical,
          },
          serious: {
            period1: period1Stats.avgSerious,
            period2: period2Stats.avgSerious,
            change: period2Stats.avgSerious - period1Stats.avgSerious,
          },
          scanCount: {
            period1: period1Scans.length,
            period2: period2Scans.length,
          },
        };

        return reply.send({
          success: true,
          data: {
            comparison,
            period1: {
              start: period1Start,
              end: period1End,
              stats: period1Stats,
            },
            period2: {
              start: period2Start,
              end: period2End,
              stats: period2Stats,
            },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Trends/Compare] Error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // POST /trends/stats - Get aggregate statistics
  fastify.post<{ Querystring: TrendQuery; Body: TrendRequestBody }>(
    '/trends/stats',
    async (request: FastifyRequest<{ Querystring: TrendQuery; Body: TrendRequestBody }>, reply: FastifyReply) => {
      try {
        const { url, startDate, endDate } = request.query;
        const { scans } = request.body;

        if (!scans || !Array.isArray(scans)) {
          return reply.status(400).send({
            success: false,
            error: 'scans array is required',
          });
        }

        let filtered = [...scans];

        if (url) {
          const targetHost = new URL(url).hostname;
          filtered = filtered.filter(s => {
            try {
              return new URL(s.url).hostname === targetHost;
            } catch {
              return false;
            }
          });
        }

        if (startDate) {
          const start = new Date(startDate).getTime();
          filtered = filtered.filter(s => new Date(s.timestamp).getTime() >= start);
        }

        if (endDate) {
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(s => new Date(s.timestamp).getTime() <= end);
        }

        filtered.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const stats = calculateStats(filtered);
        const changeRates = calculateChangeRates(filtered);

        // Calculate percentiles
        const scores = filtered.map(s => s.score).sort((a, b) => a - b);
        const percentiles = {
          p25: scores[Math.floor(scores.length * 0.25)] || 0,
          p50: scores[Math.floor(scores.length * 0.5)] || 0,
          p75: scores[Math.floor(scores.length * 0.75)] || 0,
          p90: scores[Math.floor(scores.length * 0.9)] || 0,
        };

        // Best/worst scans
        const sortedByScore = [...filtered].sort((a, b) => b.score - a.score);
        const bestScan = sortedByScore[0] || null;
        const worstScan = sortedByScore[sortedByScore.length - 1] || null;

        return reply.send({
          success: true,
          data: {
            stats,
            percentiles,
            changeRates,
            bestScan: bestScan ? {
              date: bestScan.timestamp,
              score: bestScan.score,
              url: bestScan.url,
            } : null,
            worstScan: worstScan ? {
              date: worstScan.timestamp,
              score: worstScan.score,
              url: worstScan.url,
            } : null,
            meta: {
              totalScans: filtered.length,
              uniqueUrls: new Set(filtered.map(s => s.url)).size,
            },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Trends/Stats] Error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );
}

// Helper functions
function calculateStats(scans: ScanInput[]) {
  if (scans.length === 0) {
    return {
      avgScore: 0,
      minScore: 0,
      maxScore: 0,
      avgIssues: 0,
      avgCritical: 0,
      avgSerious: 0,
      avgModerate: 0,
      avgMinor: 0,
      totalIssuesFixed: 0,
      scoreImprovement: 0,
    };
  }

  const first = scans[0];
  const last = scans[scans.length - 1];

  return {
    avgScore: Math.round(scans.reduce((sum, s) => sum + s.score, 0) / scans.length),
    minScore: Math.min(...scans.map(s => s.score)),
    maxScore: Math.max(...scans.map(s => s.score)),
    avgIssues: Math.round(scans.reduce((sum, s) => sum + s.totalIssues, 0) / scans.length),
    avgCritical: Math.round(scans.reduce((sum, s) => sum + s.critical, 0) / scans.length * 10) / 10,
    avgSerious: Math.round(scans.reduce((sum, s) => sum + s.serious, 0) / scans.length * 10) / 10,
    avgModerate: Math.round(scans.reduce((sum, s) => sum + s.moderate, 0) / scans.length * 10) / 10,
    avgMinor: Math.round(scans.reduce((sum, s) => sum + s.minor, 0) / scans.length * 10) / 10,
    totalIssuesFixed: Math.max(0, first.totalIssues - last.totalIssues),
    scoreImprovement: last.score - first.score,
  };
}

function calculateChangeRates(scans: ScanInput[]) {
  if (scans.length < 2) {
    return {
      scoreChangePerScan: 0,
      issueChangePerScan: 0,
      criticalChangePerScan: 0,
      projectedScansToGoal: null,
    };
  }

  const first = scans[0];
  const last = scans[scans.length - 1];
  const scanCount = scans.length - 1;

  const scoreChangePerScan = (last.score - first.score) / scanCount;
  const issueChangePerScan = (last.totalIssues - first.totalIssues) / scanCount;
  const criticalChangePerScan = (last.critical - first.critical) / scanCount;

  // Project scans to reach 90 score
  const targetScore = 90;
  let projectedScansToGoal: number | null = null;
  if (scoreChangePerScan > 0 && last.score < targetScore) {
    projectedScansToGoal = Math.ceil((targetScore - last.score) / scoreChangePerScan);
  } else if (last.score >= targetScore) {
    projectedScansToGoal = 0;
  }

  return {
    scoreChangePerScan: Math.round(scoreChangePerScan * 100) / 100,
    issueChangePerScan: Math.round(issueChangePerScan * 100) / 100,
    criticalChangePerScan: Math.round(criticalChangePerScan * 100) / 100,
    projectedScansToGoal,
  };
}