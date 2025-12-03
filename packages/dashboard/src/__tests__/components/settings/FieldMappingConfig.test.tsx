import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FieldMappingConfig } from "../../../components/settings/FieldMappingConfig";
import type { JiraFieldMapping } from "../../../types";

const baseMapping: JiraFieldMapping = {
  severity: {
    field: "priority",
    values: {
      critical: "Highest",
      serious: "High",
      moderate: "Medium",
      minor: "Low",
    },
  },
  wcagTags: { field: "labels", prefix: "wcag-" },
  ruleId: { field: "labels" },
  selector: { field: "customfield_selector" },
  url: { field: "customfield_url" },
  customFields: [],
};

describe("settings/FieldMappingConfig", () => {
  it("updates severity field and values, wcag settings, and preview", () => {
    const onChange = vi.fn();
    render(<FieldMappingConfig mapping={baseMapping} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("priority"), { target: { value: "customfield_1" } });
    expect(onChange).toHaveBeenCalledWith({
      ...baseMapping,
      severity: { ...baseMapping.severity, field: "customfield_1" },
    });

    fireEvent.change(screen.getByDisplayValue("Highest"), { target: { value: "High" } });
    expect(onChange).toHaveBeenCalledWith({
      ...baseMapping,
      severity: {
        ...baseMapping.severity,
        values: { ...baseMapping.severity.values, critical: "High" },
      },
    });

    fireEvent.change(screen.getByPlaceholderText("labels"), { target: { value: "custom_labels" } });
    expect(onChange).toHaveBeenCalledWith({
      ...baseMapping,
      wcagTags: { ...baseMapping.wcagTags, field: "custom_labels" },
    });

    fireEvent.change(screen.getByPlaceholderText("wcag-"), { target: { value: "tag-" } });
    expect(onChange).toHaveBeenCalledWith({
      ...baseMapping,
      wcagTags: { ...baseMapping.wcagTags, prefix: "tag-" },
    });

    fireEvent.change(screen.getByPlaceholderText("labels or customfield_xxxxx"), {
      target: { value: "customfield_200" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...baseMapping,
      ruleId: { field: "customfield_200" },
    });

    // Preview renders current mapping
    expect(screen.getByText(/WCAG tags → labels/)).toBeInTheDocument();
  });

  it("shows empty prefix fallback in input and preview", () => {
    const onChange = vi.fn();
    const mapping = { ...baseMapping, wcagTags: { ...baseMapping.wcagTags, prefix: "" } };
    render(<FieldMappingConfig mapping={mapping} onChange={onChange} />);

    const prefixInput = (screen.getAllByPlaceholderText("wcag-") as HTMLInputElement[]).find(
      input => input.value === ""
    ) as HTMLInputElement;
    expect(prefixInput).toBeDefined();
    expect(screen.getByText((content) => content.includes('prefix: ""'))).toBeInTheDocument();
  });
});
