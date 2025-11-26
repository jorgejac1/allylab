import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { 
  JiraIssuePayload, 
  JiraCreateResponse, 
  JiraBulkRequest, 
  JiraBulkResponse,
  JiraLinkRequest 
} from '../types/jira';

// In-memory store for mock mode and tracking
const mockIssues = new Map<string, JiraIssuePayload>();
const linkedIssues = new Map<string, string>(); // findingId -> issueKey
let mockCounter = 1;

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  mockMode: boolean;
}

interface JiraUser {
  displayName: string;
  emailAddress?: string;
}

interface JiraErrorResponse {
  errorMessages?: string[];
  errors?: Record<string, string>;
}

interface JiraIssueResponse {
  key: string;
  id: string;
  self: string;
}

// Load from env or use mock
function getJiraConfig(): JiraConfig {
  return {
    baseUrl: process.env.JIRA_BASE_URL || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
    mockMode: !process.env.JIRA_BASE_URL || process.env.JIRA_MOCK_MODE === 'true',
  };
}

function getAuthHeader(config: JiraConfig): string {
  const credentials = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function jiraRoutes(fastify: FastifyInstance) {
  // Test Connection
  fastify.post('/jira/test', async (_request: FastifyRequest, reply: FastifyReply) => {
    const config = getJiraConfig();

    if (config.mockMode) {
      return reply.send({
        success: true,
        message: 'Mock mode - connection simulated',
        mockMode: true,
      });
    }

    try {
      const response = await fetch(`${config.baseUrl}/rest/api/2/myself`, {
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const user = (await response.json()) as JiraUser;
        return reply.send({
          success: true,
          message: `Connected as ${user.displayName}`,
          mockMode: false,
        });
      } else {
        const error = (await response.json()) as JiraErrorResponse;
        return reply.status(400).send({
          success: false,
          message: error.errorMessages?.join(', ') || 'Connection failed',
        });
      }
    } catch (err) {
      return reply.status(500).send({
        success: false,
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  });

  // Create Single Issue
  fastify.post<{ Body: JiraIssuePayload }>(
    '/jira/create',
    async (request, reply) => {
      const config = getJiraConfig();
      const payload = request.body;

      if (config.mockMode) {
        const mockKey = `MOCK-${mockCounter++}`;
        mockIssues.set(mockKey, payload);
        
        return reply.send({
          success: true,
          key: mockKey,
          id: `${10000 + mockCounter}`,
          self: `http://localhost:3001/jira/issue/${mockKey}`,
          mockMode: true,
        });
      }

      try {
        const response = await fetch(`${config.baseUrl}/rest/api/2/issue`, {
          method: 'POST',
          headers: {
            Authorization: getAuthHeader(config),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = (await response.json()) as JiraIssueResponse;
          return reply.send({
            success: true,
            key: data.key,
            id: data.id,
            self: data.self,
          });
        } else {
          const data = (await response.json()) as JiraErrorResponse;
          return reply.status(400).send({
            success: false,
            error: data.errorMessages?.join(', ') || 'Failed to create issue',
          });
        }
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: err instanceof Error ? err.message : 'Network error',
        });
      }
    }
  );

  // Bulk Create Issues
  fastify.post<{ Body: JiraBulkRequest }>(
    '/jira/bulk',
    async (request, reply) => {
      const config = getJiraConfig();
      const { issues } = request.body;

      const results: JiraCreateResponse[] = [];
      let successful = 0;
      let failed = 0;

      for (const issue of issues) {
        if (config.mockMode) {
          const mockKey = `MOCK-${mockCounter++}`;
          mockIssues.set(mockKey, issue);
          results.push({
            success: true,
            key: mockKey,
            id: `${10000 + mockCounter}`,
            self: `http://localhost:3001/jira/issue/${mockKey}`,
          });
          successful++;
          // Small delay to simulate real API
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          try {
            const response = await fetch(`${config.baseUrl}/rest/api/2/issue`, {
              method: 'POST',
              headers: {
                Authorization: getAuthHeader(config),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(issue),
            });

            if (response.ok) {
              const data = (await response.json()) as JiraIssueResponse;
              results.push({
                success: true,
                key: data.key,
                id: data.id,
                self: data.self,
              });
              successful++;
            } else {
              const data = (await response.json()) as JiraErrorResponse;
              results.push({
                success: false,
                error: data.errorMessages?.join(', ') || 'Failed',
              });
              failed++;
            }

            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            results.push({
              success: false,
              error: err instanceof Error ? err.message : 'Network error',
            });
            failed++;
          }
        }
      }

      const bulkResponse: JiraBulkResponse = {
        total: issues.length,
        successful,
        failed,
        results,
      };

      return reply.send(bulkResponse);
    }
  );

  // Get Issue (for mock mode verification)
  fastify.get<{ Params: { key: string } }>(
    '/jira/issue/:key',
    async (request, reply) => {
      const config = getJiraConfig();
      const { key } = request.params;

      if (config.mockMode) {
        const issue = mockIssues.get(key);
        if (issue) {
          return reply.send({
            key,
            fields: issue.fields,
            mockMode: true,
          });
        }
        return reply.status(404).send({ error: 'Issue not found' });
      }

      try {
        const response = await fetch(`${config.baseUrl}/rest/api/2/issue/${key}`, {
          headers: {
            Authorization: getAuthHeader(config),
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return reply.send(data);
        } else {
          return reply.status(response.status).send({ error: 'Issue not found' });
        }
      } catch (err) {
        return reply.status(500).send({
          error: err instanceof Error ? err.message : 'Network error',
        });
      }
    }
  );

  // Link Finding to Existing Issue
  fastify.post<{ Body: JiraLinkRequest }>(
    '/jira/link',
    async (request, reply) => {
      const { findingId, issueKey, scanId } = request.body;

      // Store the link
      linkedIssues.set(`${scanId}:${findingId}`, issueKey);

      return reply.send({
        success: true,
        findingId,
        issueKey,
        message: `Finding linked to ${issueKey}`,
      });
    }
  );

  // Get Linked Issues for a Scan
  fastify.get<{ Params: { scanId: string } }>(
    '/jira/links/:scanId',
    async (request, reply) => {
      const { scanId } = request.params;

      const links: Record<string, string> = {};
      for (const [key, issueKey] of linkedIssues.entries()) {
        if (key.startsWith(`${scanId}:`)) {
          const findingId = key.split(':')[1];
          links[findingId] = issueKey;
        }
      }

      return reply.send({ scanId, links });
    }
  );

  // Get all mock issues (for debugging)
  fastify.get('/jira/mock/issues', async (_request, reply) => {
    const config = getJiraConfig();
    
    if (!config.mockMode) {
      return reply.status(400).send({ error: 'Not in mock mode' });
    }

    const issues = Array.from(mockIssues.entries()).map(([key, payload]) => ({
      key,
      summary: payload.fields.summary,
      project: payload.fields.project.key,
      created: new Date().toISOString(),
    }));

    return reply.send({ mockMode: true, issues });
  });

  // Clear mock issues (for testing)
  fastify.delete('/jira/mock/issues', async (_request, reply) => {
    const config = getJiraConfig();
    
    if (!config.mockMode) {
      return reply.status(400).send({ error: 'Not in mock mode' });
    }

    mockIssues.clear();
    mockCounter = 1;

    return reply.send({ success: true, message: 'Mock issues cleared' });
  });
}