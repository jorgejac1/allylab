import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { exportToCSV, exportToJSON } from "../../utils/export";
import type { Finding, SavedScan } from "../../types";
type GlobalWithDocument = typeof globalThis & { document?: Document };

const baseFinding: Finding = {
  id: "1",
  ruleId: "r1",
  ruleTitle: "Title",
  description: 'desc "quoted"',
  impact: "critical",
  selector: ".a",
  html: "<div>",
  helpUrl: "http://help",
  wcagTags: ["1.1.1"],
};

const baseScan: SavedScan = {
  id: "s1",
  url: "https://example.com",
  timestamp: "2024-01-01T00:00:00.000Z",
  score: 90,
  totalIssues: 1,
  critical: 1,
  serious: 0,
  moderate: 0,
  minor: 0,
  findings: [baseFinding],
  scanDuration: 1000,
};

function setupDomMocks() {
  const click = vi.fn();
  const link = { click, setAttribute: vi.fn(), style: {}, href: "", download: "" };

  // Provide global document if missing
  const globalWithDocument = globalThis as GlobalWithDocument;
  const doc = globalWithDocument.document || (globalWithDocument.document = {} as Document);
  Object.defineProperty(doc, "createElement", { value: vi.fn().mockReturnValue(link), configurable: true });
  const appendChild: Mock = vi.fn();
  const removeChild: Mock = vi.fn();
  Object.defineProperty(doc, "body", {
    value: { appendChild, removeChild },
    configurable: true,
  });
  const revoke = vi.fn();
  const urlCreate = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob://");
  const urlRevoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoke);
  return { click, appendChild, removeChild, urlCreate, urlRevoke };
}

describe("utils/export", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports findings to CSV", () => {
    const mocks = setupDomMocks();
    exportToCSV([baseFinding], "out.csv");
    expect(mocks.click).toHaveBeenCalled();
    expect(mocks.urlRevoke).toHaveBeenCalled();
  });

  it("exports scans to JSON", () => {
    const mocks = setupDomMocks();
    exportToJSON(baseScan, "out.json");
    expect(mocks.click).toHaveBeenCalled();
    expect(mocks.urlRevoke).toHaveBeenCalled();
  });
});
