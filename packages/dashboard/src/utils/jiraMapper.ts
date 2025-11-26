import type {
  Finding,
  JiraConfig,
  JiraFieldMapping,
  JiraIssuePayload,
} from "../types";

export function mapFindingToJira(
  finding: Finding,
  pageUrl: string,
  config: JiraConfig,
  mapping: JiraFieldMapping
): JiraIssuePayload {
  const labels: string[] = [];
  const customFields: Record<string, unknown> = {};

  // Map WCAG tags to labels
  if (mapping.wcagTags.field === "labels") {
    finding.wcagTags.forEach((tag) => {
      labels.push(`${mapping.wcagTags.prefix || ""}${tag}`);
    });
  } else {
    customFields[mapping.wcagTags.field] = finding.wcagTags.map(
      (tag) => `${mapping.wcagTags.prefix || ""}${tag}`
    );
  }

  // Map ruleId
  if (mapping.ruleId.field === "labels") {
    labels.push(finding.ruleId);
  } else {
    customFields[mapping.ruleId.field] = finding.ruleId;
  }

  // Build description
  const descriptionParts = [
    `*Issue:* ${finding.ruleTitle}`,
    "",
    `*Description:* ${finding.description}`,
    "",
    `*Severity:* ${finding.impact}`,
    "",
    `*URL:* ${pageUrl}`,
    "",
    `*Selector:* {code}${finding.selector}{code}`,
    "",
    `*HTML:*`,
    `{code:html}${finding.html}{code}`,
    "",
    `*WCAG Criteria:* ${finding.wcagTags.join(", ")}`,
    "",
    `*More Info:* ${finding.helpUrl}`,
  ];

  if (finding.fixSuggestion) {
    descriptionParts.push(
      "",
      `*Suggested Fix:*`,
      `{code}${finding.fixSuggestion}{code}`
    );
  }

  const payload: JiraIssuePayload = {
    fields: {
      project: { key: config.projectKey },
      issuetype: { name: config.issueType },
      summary: `[A11Y] ${finding.ruleTitle} - ${finding.impact.toUpperCase()}`,
      description: descriptionParts.join("\n"),
      labels: labels.length > 0 ? labels : undefined,
      ...customFields,
    },
  };

  // Map severity to priority
  if (mapping.severity.field === "priority") {
    payload.fields.priority = {
      name: mapping.severity.values[finding.impact] || "Medium",
    };
  } else {
    payload.fields[mapping.severity.field] =
      mapping.severity.values[finding.impact];
  }

  // Apply custom field mappings
  mapping.customFields.forEach(({ allyLabField, jiraField, transform }) => {
    const value = (finding as unknown as Record<string, unknown>)[allyLabField];
    if (value !== undefined) {
      switch (transform) {
        case "array":
          payload.fields[jiraField] = Array.isArray(value) ? value : [value];
          break;
        case "label":
          if (Array.isArray(payload.fields.labels)) {
            payload.fields.labels.push(String(value));
          }
          break;
        default:
          payload.fields[jiraField] = value;
      }
    }
  });

  return payload;
}

export function mapMultipleFindings(
  findings: Finding[],
  pageUrl: string,
  config: JiraConfig,
  mapping: JiraFieldMapping
): JiraIssuePayload[] {
  return findings.map((finding) =>
    mapFindingToJira(finding, pageUrl, config, mapping)
  );
}
