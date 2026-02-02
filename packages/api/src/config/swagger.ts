/**
 * OpenAPI/Swagger Configuration
 *
 * Provides auto-generated API documentation using @fastify/swagger.
 * Documentation available at /docs endpoint.
 */

import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'AllyLab API',
      description: 'Accessibility scanning and remediation API',
      version: '1.0.0',
      contact: {
        name: 'AllyLab Support',
        url: 'https://github.com/allylab/allylab',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check and metrics endpoints' },
      { name: 'Scan', description: 'Accessibility scanning operations' },
      { name: 'Findings', description: 'Manage scan findings and issues' },
      { name: 'Fixes', description: 'AI-powered fix generation' },
      { name: 'GitHub', description: 'GitHub integration and PR creation' },
      { name: 'Jira', description: 'Jira integration for issue tracking' },
      { name: 'Schedules', description: 'Scheduled scan management' },
      { name: 'Webhooks', description: 'Webhook notifications' },
      { name: 'Rules', description: 'Custom accessibility rules' },
      { name: 'Trends', description: 'Historical trend data' },
      { name: 'Export', description: 'Report export functionality' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
            requestId: { type: 'string', format: 'uuid' },
          },
          required: ['success', 'error'],
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            service: { type: 'string', example: 'allylab-api' },
            version: { type: 'string', example: '1.0.0' },
          },
        },
        Violation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            impact: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
            description: { type: 'string' },
            help: { type: 'string' },
            helpUrl: { type: 'string', format: 'uri' },
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  html: { type: 'string' },
                  target: { type: 'array', items: { type: 'string' } },
                  failureSummary: { type: 'string' },
                },
              },
            },
          },
        },
        ScanResult: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
            timestamp: { type: 'string', format: 'date-time' },
            viewport: { type: 'string', enum: ['desktop', 'tablet', 'mobile'] },
            violations: {
              type: 'array',
              items: { $ref: '#/components/schemas/Violation' },
            },
            passes: { type: 'integer' },
            incomplete: { type: 'integer' },
            inapplicable: { type: 'integer' },
          },
        },
        Finding: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string', format: 'uri' },
            ruleId: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
            element: { type: 'string' },
            message: { type: 'string' },
            wcagCriteria: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['open', 'fixed', 'wont_fix', 'false_positive'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Fix: {
          type: 'object',
          properties: {
            findingId: { type: 'string', format: 'uuid' },
            originalCode: { type: 'string' },
            fixedCode: { type: 'string' },
            explanation: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
        Schedule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string', format: 'uri' },
            frequency: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly'] },
            enabled: { type: 'boolean' },
            lastRun: { type: 'string', format: 'date-time' },
            nextRun: { type: 'string', format: 'date-time' },
          },
        },
        Webhook: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string' } },
            enabled: { type: 'boolean' },
          },
        },
        CustomRule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            selector: { type: 'string' },
            type: { type: 'string', enum: ['selector', 'attribute', 'content', 'structure'] },
            severity: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
            message: { type: 'string' },
            enabled: { type: 'boolean' },
          },
        },
      },
    },
  },
};

export const swaggerUiConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
};
