import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { crawlSite } from '../services/crawler';
import { runScan } from '../services/scanner';
import { triggerWebhooks } from '../services/webhooks';
import { sendSSE, endSSE } from '../utils/sse';

interface CrawlScanRequest {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  standard?: string;
}

interface PageResult {
  url: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  scanTime: number;
}

export async function crawlRoutes(fastify: FastifyInstance) {
  // Crawl only - discover pages
  fastify.post<{ Body: CrawlScanRequest }>(
    '/crawl',
    async (request: FastifyRequest<{ Body: CrawlScanRequest }>, reply: FastifyReply) => {
      const { url, maxPages = 10, maxDepth = 2 } = request.body;

      if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
      }

      try {
        const result = await crawlSite({
          startUrl: url,
          maxPages,
          maxDepth,
          sameDomainOnly: true,
        });

        return reply.send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Crawl failed';
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Crawl and scan - SSE streaming
  fastify.post<{ Body: CrawlScanRequest }>(
    '/crawl/scan',
    async (request: FastifyRequest<{ Body: CrawlScanRequest }>, reply: FastifyReply) => {
      const { url, maxPages = 10, maxDepth = 2, standard = 'wcag21aa' } = request.body;

      if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
      }

      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const results: PageResult[] = [];
      let totalIssues = 0;
      let totalCritical = 0;
      let totalSerious = 0;
      let totalModerate = 0;
      let totalMinor = 0;

      try {
        // Phase 1: Crawl
        sendSSE(reply, 'status', { message: 'Discovering pages...', phase: 'crawl' });

        const crawlResult = await crawlSite({
          startUrl: url,
          maxPages,
          maxDepth,
          sameDomainOnly: true,
        });

        sendSSE(reply, 'crawl-complete', {
          urls: crawlResult.urls,
          totalFound: crawlResult.totalFound,
        });

        // Phase 2: Scan each page
        sendSSE(reply, 'status', { 
          message: `Scanning ${crawlResult.urls.length} pages...`, 
          phase: 'scan' 
        });

        for (let i = 0; i < crawlResult.urls.length; i++) {
          const pageUrl = crawlResult.urls[i];

          sendSSE(reply, 'page-start', {
            url: pageUrl,
            index: i + 1,
            total: crawlResult.urls.length,
          });

          try {
            const scanStart = Date.now();
            const scanResult = await runScan({
              url: pageUrl,
              standard,
            });

            const pageResult: PageResult = {
              url: pageUrl,
              score: scanResult.score,
              totalIssues: scanResult.totalIssues,
              critical: scanResult.findings.filter(f => f.impact === 'critical').length,
              serious: scanResult.findings.filter(f => f.impact === 'serious').length,
              moderate: scanResult.findings.filter(f => f.impact === 'moderate').length,
              minor: scanResult.findings.filter(f => f.impact === 'minor').length,
              scanTime: Date.now() - scanStart,
            };

            results.push(pageResult);
            totalIssues += pageResult.totalIssues;
            totalCritical += pageResult.critical;
            totalSerious += pageResult.serious;
            totalModerate += pageResult.moderate;
            totalMinor += pageResult.minor;

            sendSSE(reply, 'page-complete', pageResult);
          } catch (error) {
            sendSSE(reply, 'page-error', {
              url: pageUrl,
              error: error instanceof Error ? error.message : 'Scan failed',
            });
          }
        }

        // Calculate aggregate score
        const avgScore = results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
          : 0;

        const summary = {
          pagesScanned: results.length,
          averageScore: avgScore,
          totalIssues,
          critical: totalCritical,
          serious: totalSerious,
          moderate: totalModerate,
          minor: totalMinor,
          results,
        };

        sendSSE(reply, 'complete', summary);

        // Trigger webhooks
        triggerWebhooks('scan.completed', {
          scanUrl: url,
          score: avgScore,
          totalIssues,
          critical: totalCritical,
          serious: totalSerious,
          moderate: totalModerate,
          minor: totalMinor,
        });

        if (totalCritical > 0) {
          triggerWebhooks('critical.found', {
            scanUrl: url,
            score: avgScore,
            critical: totalCritical,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Crawl failed';
        sendSSE(reply, 'error', { message });

        triggerWebhooks('scan.failed', {
          scanUrl: url,
          error: message,
        });
      } finally {
        endSSE(reply);
      }
    }
  );

  // Crawl and scan - JSON response
  fastify.post<{ Body: CrawlScanRequest }>(
    '/crawl/scan/json',
    async (request: FastifyRequest<{ Body: CrawlScanRequest }>, reply: FastifyReply) => {
      const { url, maxPages = 10, maxDepth = 2, standard = 'wcag21aa' } = request.body;

      if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
      }

      const results: PageResult[] = [];

      try {
        // Crawl
        const crawlResult = await crawlSite({
          startUrl: url,
          maxPages,
          maxDepth,
          sameDomainOnly: true,
        });

        // Scan each page
        for (const pageUrl of crawlResult.urls) {
          try {
            const scanStart = Date.now();
            const scanResult = await runScan({
              url: pageUrl,
              standard,
            });

            results.push({
              url: pageUrl,
              score: scanResult.score,
              totalIssues: scanResult.totalIssues,
              critical: scanResult.findings.filter(f => f.impact === 'critical').length,
              serious: scanResult.findings.filter(f => f.impact === 'serious').length,
              moderate: scanResult.findings.filter(f => f.impact === 'moderate').length,
              minor: scanResult.findings.filter(f => f.impact === 'minor').length,
              scanTime: Date.now() - scanStart,
            });
          } catch {
            // Skip failed pages
          }
        }

        const avgScore = results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
          : 0;

        return reply.send({
          startUrl: url,
          pagesScanned: results.length,
          averageScore: avgScore,
          totalIssues: results.reduce((sum, r) => sum + r.totalIssues, 0),
          summary: {
            critical: results.reduce((sum, r) => sum + r.critical, 0),
            serious: results.reduce((sum, r) => sum + r.serious, 0),
            moderate: results.reduce((sum, r) => sum + r.moderate, 0),
            minor: results.reduce((sum, r) => sum + r.minor, 0),
          },
          results,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Crawl failed';
        return reply.status(500).send({ error: message });
      }
    }
  );
}