import type { FastifyInstance } from 'fastify';

interface VerifyFixesOptions {
  url: string;
  findingIds: string[];
  standard?: string;
  viewport?: string;
}

interface FindingVerification {
  findingId: string;
  ruleId: string;
  stillPresent: boolean;
}

interface VerifyFixesResult {
  success: boolean;
  findingsVerified: FindingVerification[];
  allFixed: boolean;
  scanScore: number;
  scanTimestamp: string;
}

export async function verifyFixes(
  server: FastifyInstance,
  options: VerifyFixesOptions
): Promise<VerifyFixesResult> {
  // Run a scan on the URL
  const scanResponse = await server.inject({
    method: 'POST',
    url: '/scan/json',
    payload: {
      url: options.url,
      standard: options.standard || 'wcag21aa',
      viewport: options.viewport || 'desktop',
    },
  });

  const scanResult = JSON.parse(scanResponse.body);

  if (!scanResult.score && scanResult.score !== 0) {
    throw new Error('Scan failed');
  }

  // Get current finding rule IDs
  const currentRuleIds = new Set(
    (scanResult.findings || []).map((f: { ruleId: string }) => f.ruleId)
  );

  // Check each original finding
  const findingsVerified: FindingVerification[] = options.findingIds.map((findingId) => {
    // Extract ruleId from findingId (format: ruleId_hash or ruleId-index)
    const ruleId = findingId.split('_')[0] || findingId.split('-')[0] || findingId;
    return {
      findingId,
      ruleId,
      stillPresent: currentRuleIds.has(ruleId),
    };
  });

  const allFixed = findingsVerified.every((f) => !f.stillPresent);

  return {
    success: true,
    findingsVerified,
    allFixed,
    scanScore: scanResult.score,
    scanTimestamp: new Date().toISOString(),
  };
}
