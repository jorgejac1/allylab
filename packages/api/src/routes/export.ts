import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface Finding {
  id: string;
  ruleId: string;
  ruleTitle: string;
  description: string;
  impact: string;
  selector: string;
  wcagTags: string[];
  status?: string;
  falsePositive?: boolean;
}

interface ExportBody {
  findings: Finding[];
  scanUrl: string;
  scanDate: string;
  format: 'csv' | 'json';
}

export async function exportRoutes(fastify: FastifyInstance) {
  // Export findings to CSV
  fastify.post<{ Body: ExportBody }>(
    '/export/csv',
    async (request: FastifyRequest<{ Body: ExportBody }>, reply: FastifyReply) => {
      const { findings, scanUrl, scanDate } = request.body;

      // CSV Header
      const headers = [
        'ID',
        'Severity',
        'Status',
        'Rule ID',
        'Issue Title',
        'Description',
        'Element Selector',
        'WCAG Tags',
        'False Positive',
        'Scan URL',
        'Scan Date',
      ];

      // CSV Rows
      const rows = findings.map(f => [
        f.id,
        f.impact,
        f.status || 'new',
        f.ruleId,
        `"${(f.ruleTitle || '').replace(/"/g, '""')}"`,
        `"${(f.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(f.selector || '').replace(/"/g, '""')}"`,
        `"${(f.wcagTags || []).join(', ')}"`,
        f.falsePositive ? 'Yes' : 'No',
        scanUrl,
        scanDate,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="allylab-findings-${Date.now()}.csv"`)
        .send(csv);
    }
  );

  // Export findings to JSON
  fastify.post<{ Body: ExportBody }>(
    '/export/json',
    async (request: FastifyRequest<{ Body: ExportBody }>, reply: FastifyReply) => {
      const { findings, scanUrl, scanDate } = request.body;

      const exportData = {
        exportedAt: new Date().toISOString(),
        scanUrl,
        scanDate,
        totalFindings: findings.length,
        summary: {
          critical: findings.filter(f => f.impact === 'critical').length,
          serious: findings.filter(f => f.impact === 'serious').length,
          moderate: findings.filter(f => f.impact === 'moderate').length,
          minor: findings.filter(f => f.impact === 'minor').length,
        },
        findings: findings.map(f => ({
          id: f.id,
          severity: f.impact,
          status: f.status || 'new',
          ruleId: f.ruleId,
          title: f.ruleTitle,
          description: f.description,
          selector: f.selector,
          wcagTags: f.wcagTags,
          falsePositive: f.falsePositive || false,
        })),
      };

      reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="allylab-findings-${Date.now()}.json"`)
        .send(JSON.stringify(exportData, null, 2));
    }
  );
}