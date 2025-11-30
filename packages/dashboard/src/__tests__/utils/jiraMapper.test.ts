import { describe, expect, it } from "vitest";
import { mapFindingToJira, mapMultipleFindings } from "../../utils/jiraMapper";
import type { Finding, JiraConfig, JiraFieldMapping } from "../../types";

const finding: Finding = {
  id: "1",
  ruleId: "r1",
  ruleTitle: "Title",
  description: "desc",
  impact: "critical",
  selector: "#a",
  html: "<div>",
  helpUrl: "http://help",
  wcagTags: ["1.1.1"],
};

const config: JiraConfig = {
  enabled: true,
  endpoint: "https://jira",
  projectKey: "PRJ",
  issueType: "Bug",
  authHeader: "Basic token",
};

const mapping: JiraFieldMapping = {
  wcagTags: { field: "labels", prefix: "wcag-" },
  ruleId: { field: "labels" },
  severity: { field: "priority", values: { critical: "Highest", serious: "High", moderate: "Medium", minor: "Low" } },
  selector: { field: "description" },
  url: { field: "labels" },
  customFields: [
    { allyLabField: "html", jiraField: "customfield_html" },
    { allyLabField: "wcagTags", jiraField: "customfield_tags", transform: "array" },
    { allyLabField: "ruleId", jiraField: "customfield_label", transform: "label" },
  ],
};

describe("utils/jiraMapper", () => {
  it("maps finding to jira payload with labels and priority", () => {
    const payload = mapFindingToJira(finding, "https://example.com", config, mapping);
    expect(payload.fields.labels).toEqual(["wcag-1.1.1", "r1", "r1"]);
    expect(payload.fields.priority?.name).toBe("Highest");
    expect(payload.fields.customfield_html).toBe(finding.html);
    expect(payload.fields.customfield_tags).toEqual(finding.wcagTags);
    expect(Array.isArray(payload.fields.labels)).toBe(true);
    expect((payload.fields.labels as string[])).toContain("r1");
    expect(payload.fields.customfield_label).toBeUndefined();
  });

  it("maps multiple findings", () => {
    const payloads = mapMultipleFindings([finding], "https://example.com", config, mapping);
    expect(payloads.length).toBe(1);
  });

  it("wraps scalar custom field in array when transform=array", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        customFields: [
          ...mapping.customFields,
          { allyLabField: "selector", jiraField: "custom_scalar_array", transform: "array" },
        ],
      }
    );

    expect(payload.fields.custom_scalar_array).toEqual([finding.selector]);
  });

  it("maps severity to custom field when not priority", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        severity: {
          field: "custom_priority",
          values: {
            critical: "Blocker",
            serious: "High",
            moderate: "Medium",
            minor: "Low",
          },
        },
      }
    );

    expect(payload.fields.custom_priority).toBe("Blocker");
    expect(payload.fields.priority).toBeUndefined();
  });

  it("falls back to Medium when priority mapping is missing value", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        severity: {
          field: "priority",
          values: {
            critical: "",
            serious: "High",
            moderate: "Medium",
            minor: "Low",
          },
        },
      }
    );

    expect(payload.fields.priority?.name).toBe("Medium");
  });

  it("skips custom field mapping when value is undefined", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        customFields: [
          ...mapping.customFields,
          { allyLabField: "optionalField", jiraField: "custom_optional" },
          { allyLabField: "optionalLabel", jiraField: "custom_label_optional", transform: "label" },
        ],
      }
    );

    expect(payload.fields.custom_optional).toBeUndefined();
    expect(payload.fields.labels).toEqual(["wcag-1.1.1", "r1", "r1"]);
  });

  it("includes fix suggestion in description when provided", () => {
    const payload = mapFindingToJira(
      { ...finding, fixSuggestion: "Add aria-label to input" },
      "https://example.com",
      config,
      mapping
    );

    expect(payload.fields.description).toContain("*Suggested Fix:*");
    expect(payload.fields.description).toContain("{code}Add aria-label to input{code}");
  });

  it("uses empty prefix when wcagTags prefix is not provided and field is labels", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        wcagTags: { field: "labels" },
      }
    );

    expect(payload.fields.labels).toEqual(["1.1.1", "r1", "r1"]);
  });

  it("uses empty prefix when wcagTags field is custom", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        wcagTags: { field: "custom_wcag" },
      }
    );

    expect(payload.fields.custom_wcag).toEqual(["1.1.1"]);
  });

  it("skips label transform when labels are not initialized as array", () => {
    const payload = mapFindingToJira(
      finding,
      "https://example.com",
      config,
      {
        ...mapping,
        wcagTags: { field: "custom_wcags", prefix: "wc-" },
        ruleId: { field: "custom_rule" },
        customFields: [
          { allyLabField: "ruleId", jiraField: "custom_label_missing", transform: "label" },
        ],
      }
    );

    expect(payload.fields.labels).toBeUndefined();
    expect(payload.fields.custom_rule).toBe(finding.ruleId);
    expect(payload.fields.custom_label_missing).toBeUndefined();
    expect(payload.fields.custom_wcags).toEqual(finding.wcagTags.map(tag => `wc-${tag}`));
  });
});
