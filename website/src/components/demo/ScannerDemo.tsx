"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";

interface DemoIssue {
  id: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  title: string;
  description: string;
  element: string;
  wcag: string;
  fix?: string;
}

const DEMO_RESULTS: DemoIssue[] = [
  {
    id: "1",
    severity: "critical",
    title: "Images must have alternate text",
    description: "Image elements must have an alt attribute or role=\"presentation\"",
    element: "<img src=\"hero.jpg\">",
    wcag: "WCAG 1.1.1",
    fix: "<img src=\"hero.jpg\" alt=\"Team collaborating on accessibility improvements\">",
  },
  {
    id: "2",
    severity: "serious",
    title: "Form elements must have labels",
    description: "Form input elements must have a programmatically associated label",
    element: "<input type=\"email\" placeholder=\"Email\">",
    wcag: "WCAG 1.3.1",
    fix: "<label for=\"email\">Email</label>\n<input type=\"email\" id=\"email\" placeholder=\"Email\">",
  },
  {
    id: "3",
    severity: "moderate",
    title: "Links must have discernible text",
    description: "Links must have text that can be determined programmatically",
    element: "<a href=\"/more\">Click here</a>",
    wcag: "WCAG 2.4.4",
    fix: "<a href=\"/pricing\">View pricing details</a>",
  },
  {
    id: "4",
    severity: "minor",
    title: "Document should have one main landmark",
    description: "Document should have exactly one main landmark",
    element: "<div class=\"content\">...</div>",
    wcag: "WCAG 1.3.1",
    fix: "<main class=\"content\">...</main>",
  },
];

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-accent-red", bg: "bg-accent-red/15" },
  serious: { icon: AlertTriangle, color: "text-accent-orange", bg: "bg-accent-orange/15" },
  moderate: { icon: Info, color: "text-accent-yellow", bg: "bg-accent-yellow/15" },
  minor: { icon: Info, color: "text-accent-blue", bg: "bg-accent-blue/15" },
};

export function ScannerDemo() {
  const [url, setUrl] = useState("https://example.com");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [issues, setIssues] = useState<DemoIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<DemoIssue | null>(null);
  const [showFix, setShowFix] = useState(false);
  const [score, setScore] = useState(0);

  const runScan = useCallback(() => {
    setIsScanning(true);
    setScanComplete(false);
    setIssues([]);
    setSelectedIssue(null);
    setShowFix(false);
    setScore(0);

    // Simulate scanning animation
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < DEMO_RESULTS.length) {
        const issueToAdd = DEMO_RESULTS[currentIndex];
        if (issueToAdd) {
          setIssues((prev) => [...prev, issueToAdd]);
        }
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setScanComplete(true);
        setScore(72);
      }
    }, 600);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const getSeverityCounts = () => {
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    issues.forEach((issue) => {
      if (issue && issue.severity && counts[issue.severity] !== undefined) {
        counts[issue.severity]++;
      }
    });
    return counts;
  };

  const counts = getSeverityCounts();

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Scanner Header */}
      <div className="bg-surface-secondary border-b border-border p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2">
            <Search size={18} className="text-text-muted" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Enter URL to scan..."
            />
          </div>
          <Button onClick={runScan} disabled={isScanning}>
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={16} />
                Scan Page
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Area */}
      <div className="p-6">
        {!scanComplete && !isScanning && (
          <div className="text-center py-12 text-text-muted">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>Enter a URL and click Scan to see AllyLab in action</p>
            <p className="text-sm mt-2">This is a simulated demo with sample results</p>
          </div>
        )}

        {(isScanning || scanComplete) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="lg:col-span-1">
              <Card hover={false} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-surface-tertiary"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${score * 3.51} 351`}
                      className="text-primary transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">{score}</span>
                  </div>
                </div>
                <p className="text-sm text-text-muted mb-4">Accessibility Score</p>

                <div className="grid grid-cols-2 gap-2 text-left">
                  {Object.entries(counts).map(([severity, count]) => {
                    const config = severityConfig[severity as keyof typeof severityConfig];
                    return (
                      <div key={severity} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${config.bg.replace("/15", "")}`} />
                        <span className="capitalize text-text-muted">{severity}</span>
                        <span className="font-semibold ml-auto">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Issues List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Issues Found {issues.length > 0 && `(${issues.length})`}
                </h3>
                {isScanning && (
                  <Badge variant="blue">
                    <Loader2 size={12} className="animate-spin mr-1" />
                    Scanning...
                  </Badge>
                )}
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {issues.map((issue) => {
                  const config = severityConfig[issue.severity];
                  const Icon = config.icon;
                  const isSelected = selectedIssue?.id === issue.id;

                  return (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowFix(false);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface-secondary hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${config.bg}`}>
                          <Icon size={16} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{issue.title}</span>
                            <Badge variant="blue" className="text-xs">{issue.wcag}</Badge>
                          </div>
                          <p className="text-xs text-text-muted line-clamp-1">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Issue Details */}
              {selectedIssue && (
                <div className="mt-4 p-4 bg-surface-secondary border border-border rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Issue Details</h4>
                    <Button
                      size="sm"
                      onClick={() => setShowFix(!showFix)}
                      className="gap-1"
                    >
                      <Sparkles size={14} />
                      {showFix ? "Hide Fix" : "Generate AI Fix"}
                    </Button>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-text-muted mb-1">Current Code:</p>
                    <pre className="bg-surface border border-border rounded-lg p-3 text-xs overflow-x-auto">
                      <code className="text-accent-red">{selectedIssue.element}</code>
                    </pre>
                  </div>

                  {showFix && selectedIssue.fix && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs text-text-muted mb-1 flex items-center gap-1">
                        <CheckCircle size={12} className="text-primary" />
                        AI-Generated Fix (95% confidence):
                      </p>
                      <pre className="bg-surface border border-primary/30 rounded-lg p-3 text-xs overflow-x-auto">
                        <code className="text-primary">{selectedIssue.fix}</code>
                      </pre>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary">
                          Copy Code
                        </Button>
                        <Button size="sm">
                          Create PR
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
