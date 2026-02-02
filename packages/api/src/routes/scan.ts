import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runScan } from '../services/scanner.js';
import { triggerWebhooks } from '../services/webhooks.js';
import { sendSSE, endSSE } from '../utils/sse.js';
import { validateUrlWithConfig } from '../utils/url-validator.js';
import { scanRequestSchema, testAuthSchema } from '../schemas/index.js';
import { config } from '../config/env.js';
import type { ScanRequest, ScanAuthOptions } from '../types/index.js';
import { createAuthenticatedContext, executeLoginFlow } from '../services/browser.js';

export async function scanRoutes(server: FastifyInstance) {
  // Apply stricter rate limit for scan endpoints
  const scanRateLimit = config.enableRateLimiting
    ? {
        config: {
          rateLimit: {
            max: config.scanRateLimitMax,
            timeWindow: config.scanRateLimitTimeWindow,
          },
        },
      }
    : {};

  server.post('/scan', scanRateLimit, async (request: FastifyRequest<{ Body: ScanRequest }>, reply: FastifyReply) => {
    // Validate input with Zod schema
    const parseResult = scanRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const {
      url,
      standard,
      viewport,
      includeWarnings,
      includeCustomRules,
      auth,
    } = parseResult.data;

    // Validate URL for SSRF protection
    const urlValidation = validateUrlWithConfig(url);
    if (!urlValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: urlValidation.error,
        code: 'INVALID_URL',
      });
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      sendSSE(reply, 'status', { message: 'Starting scan...', phase: 'init' });

      const result = await runScan({
        url,
        standard,
        viewport,
        includeWarnings,
        includeCustomRules,
        auth,
        onProgress: (progress) => {
          sendSSE(reply, 'progress', progress);
        },
        onFinding: (finding) => {
          sendSSE(reply, 'finding', finding);
        },
      });

      sendSSE(reply, 'complete', result);

      // Trigger webhooks on scan completion
      triggerWebhooks('scan.completed', {
        scanUrl: url,
        score: result.score,
        totalIssues: result.totalIssues,
        critical: result.findings.filter(f => f.impact === 'critical').length,
        serious: result.findings.filter(f => f.impact === 'serious').length,
        moderate: result.findings.filter(f => f.impact === 'moderate').length,
        minor: result.findings.filter(f => f.impact === 'minor').length,
        customRulesCount: result.customRulesCount,
      });

      // Trigger if critical issues found
      const criticalCount = result.findings.filter(f => f.impact === 'critical').length;
      if (criticalCount > 0) {
        triggerWebhooks('critical.found', {
          scanUrl: url,
          score: result.score,
          critical: criticalCount,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sendSSE(reply, 'error', { message });

      // Trigger webhook on scan failure
      triggerWebhooks('scan.failed', {
        scanUrl: url,
        error: message,
      });
    } finally {
      endSSE(reply);
    }
  });

  // Test authentication profile endpoint
  server.post<{ Body: { url: string; auth: ScanAuthOptions } }>(
    '/scan/test-auth',
    async (request, reply) => {
      // Validate input
      const parseResult = testAuthSchema.safeParse(request.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      const { url, auth } = parseResult.data;

      // Validate URL
      const urlValidation = validateUrlWithConfig(url);
      if (!urlValidation.valid) {
        return reply.status(400).send({
          success: false,
          error: urlValidation.error,
        });
      }

      let context: Awaited<ReturnType<typeof createAuthenticatedContext>> | null = null;

      try {
        // Create authenticated context
        context = await createAuthenticatedContext(
          'desktop',
          auth
        );

        const { page } = context;

        // Execute login flow if present
        if (auth.loginFlow) {
          const loginSuccess = await executeLoginFlow(page, auth.loginFlow);
          if (!loginSuccess) {
            return reply.send({
              success: false,
              message: 'Login flow failed',
              error: 'Could not verify successful login using the success indicator',
            });
          }
        }

        // Navigate to the target URL
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        const statusCode = response?.status() || 0;
        const finalUrl = page.url();

        // Check for common auth failure indicators
        const pageContent = await page.content();
        const isLoginPage =
          pageContent.includes('type="password"') ||
          finalUrl.toLowerCase().includes('login') ||
          finalUrl.toLowerCase().includes('signin') ||
          finalUrl.toLowerCase().includes('auth');

        if (statusCode === 401 || statusCode === 403) {
          return reply.send({
            success: false,
            message: `Authentication failed with status ${statusCode}`,
            statusCode,
            error: 'Server returned an authentication error',
          });
        }

        if (isLoginPage && finalUrl !== url) {
          return reply.send({
            success: false,
            message: 'Redirected to login page',
            statusCode,
            error: 'Authentication credentials may be expired or invalid',
          });
        }

        return reply.send({
          success: true,
          message: 'Authentication successful! Page accessed with provided credentials.',
          statusCode,
          authenticatedContent: !isLoginPage,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          success: false,
          error: message,
        });
      } finally {
        // Clean up
        if (context) {
          try {
            await context.page.close();
            await context.context.close();
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  );
}