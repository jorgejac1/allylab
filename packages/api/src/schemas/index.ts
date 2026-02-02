/**
 * Zod Validation Schemas
 *
 * Centralized input validation for all API endpoints.
 * Provides type-safe validation with detailed error messages.
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

/**
 * URL validator - validates format only (SSRF check done separately)
 */
export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .max(2048, 'URL exceeds maximum length (2048 characters)')
  .url('Invalid URL format');

/**
 * CSS Selector validator - basic safety checks
 */
export const cssSelectorSchema = z
  .string()
  .min(1, 'Selector is required')
  .max(500, 'Selector exceeds maximum length')
  .refine(
    (val) => {
      // Block potentially dangerous patterns
      const dangerous = [
        /['"`;]/,           // Quote injection
        /javascript:/i,     // JavaScript protocol
        /expression\s*\(/i, // CSS expression
        /<script/i,         // Script injection
        /on\w+\s*=/i,       // Event handlers
      ];
      return !dangerous.some(pattern => pattern.test(val));
    },
    { message: 'Selector contains potentially unsafe characters' }
  );

/**
 * Safe regex pattern validator
 */
export const regexPatternSchema = z
  .string()
  .max(200, 'Pattern exceeds maximum length')
  .refine(
    (val) => {
      try {
        // Try to compile the regex
        new RegExp(val);
        // Check for ReDoS patterns (simple heuristic)
        const redosPatterns = [
          /\(\.\*\)\+/,        // (.*)+
          /\(\.\+\)\+/,        // (.+)+
          /\([^)]+\)\{[0-9]+,\}/,  // Nested quantifiers
        ];
        return !redosPatterns.some(p => p.test(val));
      } catch {
        return false;
      }
    },
    { message: 'Invalid or potentially unsafe regex pattern' }
  );

// ============================================
// Scan Schemas
// ============================================

export const wcagStandardSchema = z.enum([
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
]);

export const viewportSchema = z.enum(['desktop', 'tablet', 'mobile']);

// ============================================
// Authentication Schemas
// ============================================

export const authCookieSchema = z.object({
  name: z.string().min(1).max(256),
  value: z.string().max(4096),
  domain: z.string().min(1).max(256),
  path: z.string().max(256).optional(),
  expires: z.number().optional(),
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.enum(['Strict', 'Lax', 'None']).optional(),
});

export const loginStepSchema = z.object({
  action: z.enum(['goto', 'fill', 'click', 'wait', 'waitForNavigation']),
  selector: z.string().max(500).optional(),
  value: z.string().max(1000).optional(),
  url: z.string().url().optional(),
  timeout: z.number().min(0).max(60000).optional(),
});

export const loginFlowSchema = z.object({
  loginUrl: z.string().url(),
  steps: z.array(loginStepSchema).min(1).max(20),
  successIndicator: z.object({
    type: z.enum(['url-contains', 'selector-exists', 'cookie-exists']),
    value: z.string().min(1).max(500),
  }),
});

export const storageStateSchema = z.object({
  cookies: z.array(authCookieSchema),
  origins: z.array(z.object({
    origin: z.string(),
    localStorage: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })),
  })).optional(),
});

export const scanAuthOptionsSchema = z.object({
  cookies: z.array(authCookieSchema).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  storageState: storageStateSchema.optional(),
  basicAuth: z.object({
    username: z.string().min(1).max(256),
    password: z.string().min(1).max(1000),
  }).optional(),
  loginFlow: loginFlowSchema.optional(),
}).refine(
  (data) => {
    // At least one auth method must be provided
    return data.cookies || data.headers || data.storageState || data.basicAuth || data.loginFlow;
  },
  { message: 'At least one authentication method must be provided' }
).optional();

export type AuthCookieInput = z.infer<typeof authCookieSchema>;
export type LoginStepInput = z.infer<typeof loginStepSchema>;
export type LoginFlowInput = z.infer<typeof loginFlowSchema>;
export type StorageStateInput = z.infer<typeof storageStateSchema>;
export type ScanAuthOptionsInput = z.infer<typeof scanAuthOptionsSchema>;

// ============================================
// Scan Request Schema (with auth support)
// ============================================

export const scanRequestSchema = z.object({
  url: urlSchema,
  standard: wcagStandardSchema.default('wcag21aa'),
  viewport: viewportSchema.default('desktop'),
  includeWarnings: z.boolean().default(false),
  includeCustomRules: z.boolean().default(true),
  auth: scanAuthOptionsSchema,
});

export type ScanRequestInput = z.infer<typeof scanRequestSchema>;

// Schema for testing auth profiles
const testAuthOptionsSchema = z.object({
  cookies: z.array(authCookieSchema).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  storageState: storageStateSchema.optional(),
  basicAuth: z.object({
    username: z.string().min(1).max(256),
    password: z.string().min(1).max(1000),
  }).optional(),
  loginFlow: loginFlowSchema.optional(),
});

export const testAuthSchema = z.object({
  url: urlSchema,
  auth: testAuthOptionsSchema,
});

export type TestAuthInput = z.infer<typeof testAuthSchema>;

// ============================================
// Crawl Schemas
// ============================================

export const crawlRequestSchema = z.object({
  url: urlSchema,
  maxPages: z.number().int().min(1).max(100).default(10),
  maxDepth: z.number().int().min(1).max(5).default(3),
});

export const crawlScanRequestSchema = crawlRequestSchema.extend({
  standard: wcagStandardSchema.default('wcag21aa'),
  viewport: viewportSchema.default('desktop'),
  includeWarnings: z.boolean().default(false),
  includeCustomRules: z.boolean().default(true),
});

export type CrawlRequestInput = z.infer<typeof crawlRequestSchema>;
export type CrawlScanRequestInput = z.infer<typeof crawlScanRequestSchema>;

// ============================================
// Rules Schemas
// ============================================

export const ruleTypeSchema = z.enum(['selector', 'attribute', 'content', 'structure']);
export const severitySchema = z.enum(['critical', 'serious', 'moderate', 'minor']);

export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  selector: cssSelectorSchema,
  type: ruleTypeSchema,
  severity: severitySchema,
  message: z.string().min(1).max(500),
  wcagCriteria: z.string().max(20).optional(),
  enabled: z.boolean().default(true),
  // For attribute type
  attribute: z.string().max(50).optional(),
  attributeValue: z.string().max(200).optional(),
  // For content type
  contentPattern: regexPatternSchema.optional(),
  // For structure type
  parentSelector: cssSelectorSchema.optional(),
  childSelector: cssSelectorSchema.optional(),
});

export const updateRuleSchema = createRuleSchema.partial();

export const testRuleSchema = z.object({
  rule: createRuleSchema,
  html: z.string().min(1).max(50000),
});

export const importRulesSchema = z.object({
  rules: z.array(createRuleSchema).max(100, 'Cannot import more than 100 rules at once'),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type TestRuleInput = z.infer<typeof testRuleSchema>;
export type ImportRulesInput = z.infer<typeof importRulesSchema>;

// ============================================
// Webhook Schemas
// ============================================

export const webhookEventSchema = z.enum([
  'scan.completed',
  'scan.failed',
  'critical.found',
  'score.threshold',
]);

export const webhookPlatformSchema = z.enum(['slack', 'teams', 'custom']);

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: urlSchema,
  events: z.array(webhookEventSchema).min(1).max(10),
  platform: webhookPlatformSchema.default('custom'),
  enabled: z.boolean().default(true),
  scoreThreshold: z.number().min(0).max(100).optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

// ============================================
// Schedule Schemas
// ============================================

export const scheduleFrequencySchema = z.enum(['hourly', 'daily', 'weekly', 'monthly']);

export const createScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  url: urlSchema,
  frequency: scheduleFrequencySchema,
  standard: wcagStandardSchema.default('wcag21aa'),
  viewport: viewportSchema.default('desktop'),
  enabled: z.boolean().default(true),
  authProfileId: z.string().max(100).optional().nullable(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

// ============================================
// GitHub Schemas
// ============================================

export const githubConnectSchema = z.object({
  token: z.string().min(1, 'GitHub token is required'),
  userId: z.string().min(1).default('default'),
});

export const createPRSchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  branch: z.string().min(1).max(100),
  baseBranch: z.string().min(1).max(100).default('main'),
  title: z.string().min(1).max(200),
  body: z.string().max(10000).default(''),
  changes: z.array(z.object({
    path: z.string().min(1).max(500),
    content: z.string().max(100000),
  })).min(1).max(50),
});

export type GitHubConnectInput = z.infer<typeof githubConnectSchema>;
export type CreatePRInput = z.infer<typeof createPRSchema>;

// ============================================
// JIRA Schemas
// ============================================

export const jiraConfigSchema = z.object({
  baseUrl: urlSchema,
  email: z.string().email(),
  apiToken: z.string().min(1),
  projectKey: z.string().min(1).max(20),
  issueType: z.string().default('Bug'),
});

export const jiraCreateIssueSchema = z.object({
  summary: z.string().min(1).max(500),
  description: z.string().max(10000).default(''),
  priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).default('Medium'),
  labels: z.array(z.string().max(50)).max(10).default([]),
});

export const jiraBulkCreateSchema = z.object({
  issues: z.array(jiraCreateIssueSchema).min(1).max(100),
});

export type JiraConfigInput = z.infer<typeof jiraConfigSchema>;
export type JiraCreateIssueInput = z.infer<typeof jiraCreateIssueSchema>;
export type JiraBulkCreateInput = z.infer<typeof jiraBulkCreateSchema>;

// ============================================
// Trends Schemas
// ============================================

export const trendsQuerySchema = z.object({
  url: urlSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
});

export const trendsScanSchema = z.object({
  id: z.string(),
  url: z.string(),
  score: z.number().min(0).max(100),
  totalIssues: z.number().int().min(0),
  critical: z.number().int().min(0).default(0),
  serious: z.number().int().min(0).default(0),
  moderate: z.number().int().min(0).default(0),
  minor: z.number().int().min(0).default(0),
  timestamp: z.string(),
});

export const trendsRequestSchema = z.object({
  scans: z.array(trendsScanSchema).min(1).max(10000),
});

export type TrendsQueryInput = z.infer<typeof trendsQuerySchema>;
export type TrendsScanInput = z.infer<typeof trendsScanSchema>;
export type TrendsRequestInput = z.infer<typeof trendsRequestSchema>;

// ============================================
// Export Schemas
// ============================================

export const exportRequestSchema = z.object({
  findings: z.array(z.object({
    id: z.string(),
    ruleId: z.string(),
    ruleTitle: z.string(),
    impact: severitySchema,
    wcagCriteria: z.string().optional(),
    selector: z.string(),
    message: z.string(),
    url: z.string(),
  })).min(1).max(10000),
  format: z.enum(['csv', 'json']).default('csv'),
});

export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

// ============================================
// Fix Generation Schemas
// ============================================

export const generateFixSchema = z.object({
  finding: z.object({
    id: z.string(),
    ruleId: z.string(),
    ruleTitle: z.string(),
    impact: severitySchema,
    message: z.string(),
    selector: z.string(),
    html: z.string().max(50000),
    wcagCriteria: z.string().optional(),
  }),
  context: z.object({
    url: z.string(),
    framework: z.enum(['html', 'react', 'vue', 'angular']).default('html'),
  }),
});

export type GenerateFixInput = z.infer<typeof generateFixSchema>;

// ============================================
// ID Parameter Schema
// ============================================

export const idParamSchema = z.object({
  id: z.string().min(1).max(100),
});

export type IdParamInput = z.infer<typeof idParamSchema>;

// ============================================
// Validation Helper
// ============================================

/**
 * Validate input and return parsed data or throw formatted error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e: z.ZodIssue) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    const error = new Error('Validation failed') as Error & { details: typeof errors };
    error.details = errors;
    throw error;
  }

  return result.data;
}

/**
 * Create a Fastify preValidation hook for schema validation
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return async (request: { body: unknown }, reply: { status: (code: number) => { send: (data: unknown) => void } }) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const errors = result.error.issues.map((e: z.ZodIssue) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    request.body = result.data;
  };
}
