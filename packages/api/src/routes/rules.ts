import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CustomRule, CreateRuleRequest, UpdateRuleRequest } from '../types/rules';
import { randomUUID } from 'crypto';

// In-memory storage (replace with database in production)
const rulesStore: Map<string, CustomRule> = new Map();

export async function rulesRoutes(fastify: FastifyInstance) {
  // GET /rules - List all custom rules
  fastify.get('/rules', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = Array.from(rulesStore.values());
      
      return reply.send({
        success: true,
        data: {
          rules,
          total: rules.length,
          enabled: rules.filter(r => r.enabled).length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`[Rules] List error: ${message}`);
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });

  // GET /rules/:id - Get a single rule
  fastify.get<{ Params: { id: string } }>(
    '/rules/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const rule = rulesStore.get(id);

        if (!rule) {
          return reply.status(404).send({
            success: false,
            error: 'Rule not found',
          });
        }

        return reply.send({
          success: true,
          data: rule,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Rules] Get error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // POST /rules - Create a new rule
  fastify.post<{ Body: CreateRuleRequest }>(
    '/rules',
    async (request: FastifyRequest<{ Body: CreateRuleRequest }>, reply: FastifyReply) => {
      try {
        const body = request.body;

        // Validate required fields
        if (!body.name || !body.selector || !body.type || !body.severity) {
          return reply.status(400).send({
            success: false,
            error: 'name, selector, type, and severity are required',
          });
        }

        // Validate selector syntax
        if (!body.selector.trim()) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid CSS selector',
          });
        }

        const now = new Date().toISOString();
        const rule: CustomRule = {
          id: `rule-${randomUUID().slice(0, 8)}`,
          name: body.name,
          description: body.description || '',
          type: body.type,
          severity: body.severity,
          selector: body.selector,
          condition: body.condition || {},
          message: body.message || `${body.name} violation`,
          helpUrl: body.helpUrl,
          wcagTags: body.wcagTags || [],
          enabled: body.enabled !== false,
          createdAt: now,
          updatedAt: now,
        };

        rulesStore.set(rule.id, rule);

        fastify.log.info(`[Rules] Created rule: ${rule.id} - ${rule.name}`);

        return reply.status(201).send({
          success: true,
          data: rule,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Rules] Create error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // PUT /rules/:id - Update a rule
  fastify.put<{ Params: { id: string }; Body: UpdateRuleRequest }>(
    '/rules/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateRuleRequest }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const body = request.body;
        const existing = rulesStore.get(id);

        if (!existing) {
          return reply.status(404).send({
            success: false,
            error: 'Rule not found',
          });
        }

        const updated: CustomRule = {
          ...existing,
          name: body.name ?? existing.name,
          description: body.description ?? existing.description,
          type: body.type ?? existing.type,
          severity: body.severity ?? existing.severity,
          selector: body.selector ?? existing.selector,
          condition: body.condition ?? existing.condition,
          message: body.message ?? existing.message,
          helpUrl: body.helpUrl ?? existing.helpUrl,
          wcagTags: body.wcagTags ?? existing.wcagTags,
          enabled: body.enabled ?? existing.enabled,
          updatedAt: new Date().toISOString(),
        };

        rulesStore.set(id, updated);

        fastify.log.info(`[Rules] Updated rule: ${id}`);

        return reply.send({
          success: true,
          data: updated,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Rules] Update error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // DELETE /rules/:id - Delete a rule
  fastify.delete<{ Params: { id: string } }>(
    '/rules/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const existing = rulesStore.get(id);

        if (!existing) {
          return reply.status(404).send({
            success: false,
            error: 'Rule not found',
          });
        }

        rulesStore.delete(id);

        fastify.log.info(`[Rules] Deleted rule: ${id}`);

        return reply.send({
          success: true,
          message: 'Rule deleted',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Rules] Delete error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // POST /rules/test - Test a rule against HTML
  fastify.post<{ Body: { rule: CreateRuleRequest; html: string } }>(
    '/rules/test',
    async (request: FastifyRequest<{ Body: { rule: CreateRuleRequest; html: string } }>, reply: FastifyReply) => {
      try {
        const { rule, html } = request.body;

        if (!rule || !html) {
          return reply.status(400).send({
            success: false,
            error: 'rule and html are required',
          });
        }

        // Simple test - in real implementation, use JSDOM or similar
        const violations: Array<{ selector: string; message: string }> = [];
        
        // Basic regex-based check for demonstration
        const selectorPattern = rule.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(selectorPattern, 'gi');
        
        if (rule.condition.operator === 'not-exists') {
          if (!regex.test(html)) {
            violations.push({
              selector: rule.selector,
              message: rule.message || 'Violation found',
            });
          }
        } else if (rule.condition.operator === 'exists') {
          if (regex.test(html)) {
            violations.push({
              selector: rule.selector,
              message: rule.message || 'Violation found',
            });
          }
        }

        return reply.send({
          success: true,
          data: {
            violations,
            passed: violations.length === 0,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Rules] Test error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // POST /rules/import - Import rules from JSON
  fastify.post<{ Body: { rules: CustomRule[] } }>(
    '/rules/import',
    async (request: FastifyRequest<{ Body: { rules: CustomRule[] } }>, reply: FastifyReply) => {
      try {
        const { rules } = request.body;

        if (!rules || !Array.isArray(rules)) {
          return reply.status(400).send({
            success: false,
            error: 'rules array is required',
          });
        }

        let imported = 0;
        const now = new Date().toISOString();

        for (const rule of rules) {
          if (rule.name && rule.selector && rule.type && rule.severity) {
            const newRule: CustomRule = {
              ...rule,
              id: rule.id || `rule-${randomUUID().slice(0, 8)}`,
              createdAt: rule.createdAt || now,
              updatedAt: now,
            };
            rulesStore.set(newRule.id, newRule);
            imported++;
          }
        }

        fastify.log.info(`[Rules] Imported ${imported} rules`);

        return reply.send({
          success: true,
          data: {
            imported,
            total: rulesStore.size,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`[Rules] Import error: ${message}`);
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // GET /rules/export - Export all rules as JSON
  fastify.get('/rules/export', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = Array.from(rulesStore.values());

      return reply.send({
        success: true,
        data: {
          rules,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`[Rules] Export error: ${message}`);
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });
}