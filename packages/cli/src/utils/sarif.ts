import type { ScanResult, Finding, SiteScanResult } from './api.js';

/**
 * SARIF (Static Analysis Results Interchange Format) output
 * For integration with GitHub Code Scanning and other SARIF-compatible tools
 * @see https://sarifweb.azurewebsites.net/
 */

interface SarifLocation {
  physicalLocation?: {
    artifactLocation?: {
      uri: string;
      uriBaseId?: string;
    };
    region?: {
      startLine?: number;
      startColumn?: number;
      snippet?: {
        text: string;
      };
    };
  };
  logicalLocations?: Array<{
    name: string;
    kind: string;
  }>;
}

interface SarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note' | 'none';
  message: {
    text: string;
  };
  locations?: SarifLocation[];
  partialFingerprints?: Record<string, string>;
  properties?: Record<string, unknown>;
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: {
    text: string;
  };
  fullDescription?: {
    text: string;
  };
  helpUri?: string;
  help?: {
    text: string;
    markdown?: string;
  };
  properties?: {
    tags?: string[];
    precision?: string;
    'problem.severity'?: string;
    'security-severity'?: string;
  };
}

interface SarifRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
  invocations?: Array<{
    executionSuccessful: boolean;
    endTimeUtc?: string;
  }>;
  properties?: Record<string, unknown>;
}

interface SarifLog {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

/**
 * Map severity to SARIF level
 */
function mapSeverityToLevel(severity: string): 'error' | 'warning' | 'note' | 'none' {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'serious':
      return 'error';
    case 'moderate':
      return 'warning';
    case 'minor':
      return 'note';
    default:
      return 'warning';
  }
}

/**
 * Create a SARIF rule from a finding
 */
function createRule(finding: Finding): SarifRule {
  return {
    id: finding.ruleId,
    name: finding.ruleTitle,
    shortDescription: {
      text: finding.ruleTitle,
    },
    fullDescription: {
      text: finding.description,
    },
    helpUri: finding.helpUrl,
    help: {
      text: finding.description,
      markdown: `**${finding.ruleTitle}**\n\n${finding.description}\n\n[Learn more](${finding.helpUrl})`,
    },
    properties: {
      tags: ['accessibility', 'a11y', ...finding.wcagTags],
      precision: 'high',
      'problem.severity': finding.impact,
    },
  };
}

/**
 * Create a SARIF result from a finding
 */
function createResult(finding: Finding, pageUrl: string): SarifResult {
  return {
    ruleId: finding.ruleId,
    level: mapSeverityToLevel(finding.impact),
    message: {
      text: `${finding.ruleTitle}: ${finding.description}`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: pageUrl,
          },
          region: {
            snippet: {
              text: finding.html,
            },
          },
        },
        logicalLocations: [
          {
            name: finding.selector,
            kind: 'element',
          },
        ],
      },
    ],
    partialFingerprints: {
      primaryLocationLineHash: Buffer.from(`${finding.ruleId}:${finding.selector}`).toString('base64'),
    },
    properties: {
      impact: finding.impact,
      wcagTags: finding.wcagTags,
      selector: finding.selector,
      html: finding.html,
    },
  };
}

/**
 * Convert scan result to SARIF format
 */
export function toSarif(result: ScanResult): SarifLog {
  // Collect unique rules
  const rulesMap = new Map<string, SarifRule>();
  for (const finding of result.findings) {
    if (!rulesMap.has(finding.ruleId)) {
      rulesMap.set(finding.ruleId, createRule(finding));
    }
  }

  // Create results
  const results: SarifResult[] = result.findings.map(finding =>
    createResult(finding, result.url)
  );

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'AllyLab',
            version: '1.0.0',
            informationUri: 'https://github.com/jorgejac1/allylab',
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
        invocations: [
          {
            executionSuccessful: true,
            endTimeUtc: result.timestamp,
          },
        ],
      },
    ],
  };
}

/**
 * Convert site scan result to SARIF format
 */
export function siteScanToSarif(result: SiteScanResult, findings: Finding[]): SarifLog {
  // Collect unique rules
  const rulesMap = new Map<string, SarifRule>();
  for (const finding of findings) {
    if (!rulesMap.has(finding.ruleId)) {
      rulesMap.set(finding.ruleId, createRule(finding));
    }
  }

  // Create results - would need page URL context
  // For now, site scans don't include full findings in the API response
  const results: SarifResult[] = [];

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'AllyLab',
            version: '1.0.0',
            informationUri: 'https://github.com/jorgejac1/allylab',
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
        invocations: [
          {
            executionSuccessful: true,
            endTimeUtc: new Date().toISOString(),
          },
        ],
        properties: {
          pagesScanned: result.pagesScanned,
          averageScore: result.averageScore,
          totalIssues: result.totalIssues,
          critical: result.critical,
          serious: result.serious,
          moderate: result.moderate,
          minor: result.minor,
        },
      },
    ],
  };
}

/**
 * Format SARIF log as JSON string
 */
export function formatSarif(result: ScanResult): string {
  return JSON.stringify(toSarif(result), null, 2);
}
