import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import {
  Search,
  Bot,
  GitBranch,
  BarChart3,
  Settings,
  Calendar,
  Bell,
  Target,
  Code,
  CheckCircle,
  AlertTriangle,
  Key,
  Lightbulb,
  Play,
  RefreshCw,
  Link2,
  HelpCircle,
  Monitor,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Documentation - AllyLab",
  description:
    "Learn how to use AllyLab to scan websites for accessibility issues, generate AI-powered fixes, and integrate with your workflow.",
};

const quickStartSteps = [
  {
    step: 1,
    title: "Enter a URL",
    description: "Paste any website URL into the scanner",
  },
  {
    step: 2,
    title: "Configure scan",
    description: "Choose WCAG standard and viewport",
  },
  {
    step: 3,
    title: "View results",
    description: "See issues organized by severity",
  },
  {
    step: 4,
    title: "Generate fixes",
    description: "Get AI-powered code suggestions",
  },
];

const docSections = [
  {
    id: "quick-start",
    icon: Play,
    title: "Quick Start",
    description: "Get scanning in 60 seconds",
  },
  {
    id: "scanning",
    icon: Search,
    title: "Scanning",
    description: "Single page & site crawls",
  },
  {
    id: "understanding-results",
    icon: BarChart3,
    title: "Understanding Results",
    description: "Scores, severities & findings",
  },
  {
    id: "ai-fixes",
    icon: Bot,
    title: "AI-Powered Fixes",
    description: "Generate code solutions",
  },
  {
    id: "git-integration",
    icon: GitBranch,
    title: "GitHub & GitLab",
    description: "Create PRs/MRs automatically",
  },
  {
    id: "scheduled-scans",
    icon: Calendar,
    title: "Scheduled Scans",
    description: "Automate monitoring",
  },
  {
    id: "custom-rules",
    icon: Settings,
    title: "Custom Rules",
    description: "Create your own checks",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Slack, Teams & webhooks",
  },
  {
    id: "jira-integration",
    icon: Target,
    title: "JIRA Integration",
    description: "Export issues to JIRA",
  },
  {
    id: "api-reference",
    icon: Code,
    title: "API Reference",
    description: "Integrate programmatically",
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    description: "Configure your workspace",
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "FAQ",
    description: "Common questions",
  },
];

export default function DocsPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">
            Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Learn How to Use <span className="gradient-text">AllyLab</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Everything you need to scan websites, fix accessibility issues, and
            monitor compliance over time.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 px-6 bg-surface-secondary border-y border-border-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {docSections.slice(0, 6).map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-surface border border-border rounded-xl hover:border-primary/50 hover:bg-surface-tertiary transition-all text-center"
              >
                <section.icon size={20} className="text-primary" />
                <span className="text-sm font-medium">{section.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <Section>
        <div className="max-w-4xl mx-auto">
          {/* Quick Start */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Play size={20} className="text-primary" />
              </div>
              <h2 id="quick-start" className="text-3xl font-bold">
                Quick Start
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Start scanning for accessibility issues in under 60 seconds. No
              setup required.
            </p>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {quickStartSteps.map((step) => (
                <div key={step.step} className="relative">
                  <div className="bg-surface border border-border rounded-xl p-4 h-full">
                    <div className="w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center font-bold text-sm mb-3">
                      {step.step}
                    </div>
                    <h4 className="font-semibold mb-1">{step.title}</h4>
                    <p className="text-sm text-text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-primary" />
                Pro Tips
              </h4>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-primary mt-0.5 flex-shrink-0"
                  />
                  <span>
                    Start with your homepage to get an overall accessibility
                    score
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-primary mt-0.5 flex-shrink-0"
                  />
                  <span>
                    Use site crawl to scan multiple pages and find patterns
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-primary mt-0.5 flex-shrink-0"
                  />
                  <span>
                    Focus on Critical and Serious issues first for maximum
                    impact
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Scanning */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Search size={20} className="text-primary" />
              </div>
              <h2 id="scanning" className="text-3xl font-bold">
                Scanning
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              AllyLab offers two scanning modes: single page scans for quick
              checks and site crawls for comprehensive audits.
            </p>

            <h3 className="text-xl font-semibold mb-4">Single Page Scan</h3>
            <p className="text-text-secondary mb-4">
              Perfect for testing individual pages or checking fixes. Enter a
              URL and click &quot;Scan Page&quot; to analyze accessibility.
            </p>

            <h4 className="font-semibold mb-3">Scan Options</h4>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">Option</th>
                    <th className="py-3 px-4 font-semibold">Values</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">WCAG Standard</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        <Badge>2.0 A</Badge>
                        <Badge>2.0 AA</Badge>
                        <Badge>2.1 AA</Badge>
                        <Badge variant="green">2.2 AA</Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      Which WCAG success criteria to test against. 2.1 AA
                      recommended.
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Viewport</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Monitor size={14} /> Desktop
                        </span>
                        <span className="flex items-center gap-1">
                          <Tablet size={14} /> Tablet
                        </span>
                        <span className="flex items-center gap-1">
                          <Smartphone size={14} /> Mobile
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      Screen size for testing. Some issues only appear on
                      specific viewports.
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Include Warnings</td>
                    <td className="py-3 px-4">On / Off</td>
                    <td className="py-3 px-4">
                      Show incomplete checks that need manual review.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-4">
              Multi-Page Site Crawl
            </h3>
            <p className="text-text-secondary mb-4">
              Automatically discover and scan all pages on your website. The
              crawler follows internal links to find pages.
            </p>

            <h4 className="font-semibold mb-3">Crawl Options</h4>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">Option</th>
                    <th className="py-3 px-4 font-semibold">Default</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Max Pages</td>
                    <td className="py-3 px-4">10</td>
                    <td className="py-3 px-4">
                      Maximum number of pages to scan (up to 100 on Pro plan)
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Max Depth</td>
                    <td className="py-3 px-4">2</td>
                    <td className="py-3 px-4">
                      How many clicks deep from the starting URL
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">
                      Respect robots.txt
                    </td>
                    <td className="py-3 px-4">Yes</td>
                    <td className="py-3 px-4">
                      Skip pages disallowed in robots.txt
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Understanding Results */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-primary" />
              </div>
              <h2 id="understanding-results" className="text-3xl font-bold">
                Understanding Results
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Learn how to interpret scan results, severity levels, and
              accessibility scores.
            </p>

            <h3 className="text-xl font-semibold mb-4">Accessibility Score</h3>
            <p className="text-text-secondary mb-4">
              Your accessibility score (0-100) is calculated based on the number
              and severity of issues found. Higher scores indicate better
              accessibility.
            </p>

            <div className="grid grid-cols-5 gap-3 mb-8">
              {[
                { grade: "A", range: "90-100", color: "bg-primary" },
                { grade: "B", range: "80-89", color: "bg-accent-blue" },
                { grade: "C", range: "70-79", color: "bg-accent-yellow" },
                { grade: "D", range: "60-69", color: "bg-accent-orange" },
                { grade: "F", range: "0-59", color: "bg-accent-red" },
              ].map((item) => (
                <div
                  key={item.grade}
                  className="bg-surface border border-border rounded-xl p-4 text-center"
                >
                  <div
                    className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2 text-black font-bold`}
                  >
                    {item.grade}
                  </div>
                  <p className="text-sm text-text-muted">{item.range}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mb-4">Severity Levels</h3>
            <p className="text-text-secondary mb-4">
              Issues are categorized by their impact on users with disabilities:
            </p>

            <div className="space-y-3 mb-8">
              {[
                {
                  severity: "Critical",
                  color: "bg-accent-red",
                  description:
                    "Blocks access completely. Screen reader users or keyboard-only users cannot access the content.",
                  example:
                    "Missing form labels, no keyboard access to interactive elements",
                  action: "Fix immediately",
                },
                {
                  severity: "Serious",
                  color: "bg-accent-orange",
                  description:
                    "Creates significant barriers. Users can access content but with major difficulty.",
                  example:
                    "Poor color contrast, missing alt text on important images",
                  action: "Fix as soon as possible",
                },
                {
                  severity: "Moderate",
                  color: "bg-accent-yellow",
                  description:
                    "Causes some difficulty. Users can work around the issue but experience is degraded.",
                  example: "Unclear link text, missing document language",
                  action: "Plan to fix",
                },
                {
                  severity: "Minor",
                  color: "bg-accent-blue",
                  description:
                    "Minor inconvenience. Best practice violations that have minimal impact.",
                  example: "Redundant alt text, minor heading order issues",
                  action: "Fix when convenient",
                },
              ].map((item) => (
                <div
                  key={item.severity}
                  className="bg-surface border border-border rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-4 h-4 ${item.color} rounded-full flex-shrink-0 mt-1`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{item.severity}</h4>
                        <Badge>{item.action}</Badge>
                      </div>
                      <p className="text-text-secondary text-sm mb-2">
                        {item.description}
                      </p>
                      <p className="text-text-muted text-sm">
                        <strong>Examples:</strong> {item.example}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mb-4">Issue Status</h3>
            <p className="text-text-secondary mb-4">
              AllyLab tracks issues across scans to show your progress:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  status: "New",
                  icon: AlertTriangle,
                  color: "text-accent-orange",
                  description: "First time this issue was detected",
                },
                {
                  status: "Recurring",
                  icon: RefreshCw,
                  color: "text-accent-blue",
                  description: "Issue was present in previous scans",
                },
                {
                  status: "Fixed",
                  icon: CheckCircle,
                  color: "text-primary",
                  description: "Issue no longer detected",
                },
              ].map((item) => (
                <Card key={item.status} hover={false}>
                  <item.icon size={20} className={`${item.color} mb-2`} />
                  <h4 className="font-semibold mb-1">{item.status}</h4>
                  <p className="text-sm text-text-muted">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* AI-Powered Fixes */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Bot size={20} className="text-primary" />
              </div>
              <h2 id="ai-fixes" className="text-3xl font-bold">
                AI-Powered Fixes
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Generate production-ready code fixes for accessibility issues
              using AI. Get framework-specific solutions tailored to your
              codebase.
            </p>

            <h3 className="text-xl font-semibold mb-4">How It Works</h3>
            <ol className="space-y-4 mb-8">
              {[
                {
                  step: "Select an issue",
                  description: "Click on any finding in your scan results",
                },
                {
                  step: "Choose framework",
                  description: "Select HTML, React, or Vue for targeted code",
                },
                {
                  step: "Generate fix",
                  description:
                    "Click 'Generate AI Fix' to get a code suggestion",
                },
                {
                  step: "Review & apply",
                  description: "Copy the code or create a GitHub PR / GitLab MR directly",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.step}</h4>
                    <p className="text-text-secondary text-sm">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className="text-xl font-semibold mb-4">Supported Frameworks</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  name: "HTML",
                  description: "Clean, semantic markup with ARIA attributes",
                },
                {
                  name: "React",
                  description: "JSX with proper accessibility props and hooks",
                },
                {
                  name: "Vue",
                  description:
                    "Template syntax with v-bind and accessibility directives",
                },
              ].map((fw) => (
                <Card key={fw.name} hover={false}>
                  <Code size={20} className="text-primary mb-2" />
                  <h4 className="font-semibold mb-1">{fw.name}</h4>
                  <p className="text-sm text-text-muted">{fw.description}</p>
                </Card>
              ))}
            </div>

            <h3 className="text-xl font-semibold mb-4">Confidence Levels</h3>
            <p className="text-text-secondary mb-4">
              Each fix includes a confidence score indicating how likely the
              suggestion is correct:
            </p>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">Level</th>
                    <th className="py-3 px-4 font-semibold">Score</th>
                    <th className="py-3 px-4 font-semibold">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="green">High</Badge>
                    </td>
                    <td className="py-3 px-4">90-100%</td>
                    <td className="py-3 px-4">
                      Safe to apply with minimal review
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="blue">Medium</Badge>
                    </td>
                    <td className="py-3 px-4">70-89%</td>
                    <td className="py-3 px-4">
                      Review before applying, may need adjustment
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="orange">Low</Badge>
                    </td>
                    <td className="py-3 px-4">Below 70%</td>
                    <td className="py-3 px-4">
                      Use as a starting point, likely needs modification
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GitHub & GitLab Integration */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <GitBranch size={20} className="text-primary" />
              </div>
              <h2 id="git-integration" className="text-3xl font-bold">
                GitHub & GitLab Integration
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Connect your GitHub or GitLab account to create pull requests (PRs) or
              merge requests (MRs) with accessibility fixes directly from AllyLab.
            </p>

            <h3 className="text-xl font-semibold mb-4">Connecting Your Provider</h3>
            <ol className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <span className="text-text-secondary">
                  Go to <strong>Settings → Git</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <span className="text-text-secondary">
                  Select <strong>GitHub</strong> or <strong>GitLab</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <span className="text-text-secondary">
                  Enter your Personal Access Token (PAT)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  4
                </div>
                <span className="text-text-secondary">
                  For self-hosted GitLab, enter your instance URL
                </span>
              </li>
            </ol>

            <h3 className="text-xl font-semibold mb-4">
              Creating Pull Requests / Merge Requests
            </h3>
            <div className="bg-surface border border-border rounded-xl p-6 mb-8">
              <h4 className="font-semibold mb-4">Single Fix PR/MR</h4>
              <ol className="space-y-2 text-text-secondary text-sm mb-6">
                <li>1. Generate an AI fix for an issue</li>
                <li>
                  2. Click <strong>Create PR</strong> (GitHub) or <strong>Create MR</strong> (GitLab)
                </li>
                <li>3. Select repository/project and base branch</li>
                <li>4. Review the details and confirm</li>
              </ol>

              <h4 className="font-semibold mb-4">Batch PR/MR (Multiple Fixes)</h4>
              <ol className="space-y-2 text-text-secondary text-sm">
                <li>1. Select multiple issues using checkboxes</li>
                <li>
                  2. Click <strong>Create Batch PR/MR</strong>
                </li>
                <li>3. Map file paths for each fix</li>
                <li>4. All fixes are combined into a single PR/MR</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold mb-4">Fix Verification</h3>
            <p className="text-text-secondary mb-4">
              After merging a PR/MR, AllyLab can verify the fixes were applied
              correctly:
            </p>
            <ul className="space-y-2 text-text-secondary mb-8">
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>
                  Click <strong>Verify Fixes</strong> on any merged PR/MR
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>
                  AllyLab re-scans the page to check if issues are resolved
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>Issues marked as fixed update automatically</span>
              </li>
            </ul>
          </div>

          {/* Scheduled Scans */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-primary" />
              </div>
              <h2 id="scheduled-scans" className="text-3xl font-bold">
                Scheduled Scans
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Automate accessibility monitoring with recurring scans. Get
              notified when new issues are detected.
            </p>

            <h3 className="text-xl font-semibold mb-4">Creating a Schedule</h3>
            <ol className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <span className="text-text-secondary">
                  Go to <strong>Schedules</strong> in the sidebar
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <span className="text-text-secondary">
                  Click <strong>New Schedule</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <span className="text-text-secondary">
                  Enter the URL to monitor
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  4
                </div>
                <span className="text-text-secondary">
                  Select frequency (hourly, daily, weekly, monthly)
                </span>
              </li>
            </ol>

            <h3 className="text-xl font-semibold mb-4">Frequency Options</h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">Frequency</th>
                    <th className="py-3 px-4 font-semibold">Best For</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Hourly</td>
                    <td className="py-3 px-4">
                      Critical production sites, high-traffic pages
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="purple">Enterprise</Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Daily</td>
                    <td className="py-3 px-4">
                      Active development, staging environments
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="blue">Pro</Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Weekly</td>
                    <td className="py-3 px-4">
                      Production monitoring, compliance tracking
                    </td>
                    <td className="py-3 px-4">
                      <Badge>Free</Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Monthly</td>
                    <td className="py-3 px-4">
                      Quarterly audits, low-change sites
                    </td>
                    <td className="py-3 px-4">
                      <Badge>Free</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Rules */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Settings size={20} className="text-primary" />
              </div>
              <h2 id="custom-rules" className="text-3xl font-bold">
                Custom Rules
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Create organization-specific accessibility rules to enforce your
              own standards beyond WCAG.
            </p>

            <h3 className="text-xl font-semibold mb-4">Rule Types</h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Selector</td>
                    <td className="py-3 px-4">
                      Check if a CSS selector exists or doesn&apos;t exist
                    </td>
                    <td className="py-3 px-4">Require skip navigation link</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Attribute</td>
                    <td className="py-3 px-4">
                      Check element attribute values
                    </td>
                    <td className="py-3 px-4">
                      Require lang attribute on html
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Content</td>
                    <td className="py-3 px-4">
                      Check text content of elements
                    </td>
                    <td className="py-3 px-4">Flag empty buttons</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Structure</td>
                    <td className="py-3 px-4">
                      Check DOM structure and hierarchy
                    </td>
                    <td className="py-3 px-4">Require single h1 element</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-4">
              Creating a Custom Rule
            </h3>
            <ol className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <span className="text-text-secondary">
                  Go to <strong>Settings → Custom Rules</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <span className="text-text-secondary">
                  Click <strong>New Rule</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <span className="text-text-secondary">
                  Configure rule type, selector, condition, and severity
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  4
                </div>
                <span className="text-text-secondary">
                  Test with sample HTML to verify it works
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  5
                </div>
                <span className="text-text-secondary">
                  Save and enable the rule
                </span>
              </li>
            </ol>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h4 className="font-semibold mb-3">
                Example: Skip Navigation Link
              </h4>
              <pre className="bg-surface-secondary rounded-lg p-4 overflow-x-auto text-sm">
                <code className="text-text-secondary">{`{
  "name": "Skip Navigation Link",
  "type": "selector",
  "severity": "serious",
  "selector": "body > a[href^='#']:first-child",
  "condition": { "operator": "not-exists" },
  "message": "Add a skip to main content link",
  "wcagTags": ["wcag2a", "wcag241"]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-primary" />
              </div>
              <h2 id="notifications" className="text-3xl font-bold">
                Notifications
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Stay informed with real-time notifications in Slack, Microsoft
              Teams, or via custom webhooks.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card hover={false}>
                <div className="w-10 h-10 bg-surface-tertiary rounded-xl flex items-center justify-center mb-4">
                  <span className="text-xl">#</span>
                </div>
                <h4 className="font-semibold mb-2">Slack</h4>
                <p className="text-sm text-text-muted mb-4">
                  Rich Block Kit messages with score summaries and direct links.
                </p>
                <Badge>Block Kit</Badge>
              </Card>

              <Card hover={false}>
                <div className="w-10 h-10 bg-surface-tertiary rounded-xl flex items-center justify-center mb-4">
                  <Users size={20} />
                </div>
                <h4 className="font-semibold mb-2">Microsoft Teams</h4>
                <p className="text-sm text-text-muted mb-4">
                  Adaptive Card notifications with action buttons.
                </p>
                <Badge>Adaptive Cards</Badge>
              </Card>

              <Card hover={false}>
                <div className="w-10 h-10 bg-surface-tertiary rounded-xl flex items-center justify-center mb-4">
                  <Link2 size={20} />
                </div>
                <h4 className="font-semibold mb-2">Custom Webhook</h4>
                <p className="text-sm text-text-muted mb-4">
                  JSON payload to any HTTP endpoint.
                </p>
                <Badge>JSON</Badge>
              </Card>
            </div>

            <h3 className="text-xl font-semibold mb-4">Setting Up Slack</h3>
            <ol className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <span className="text-text-secondary">
                  Create an Incoming Webhook in Slack
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <span className="text-text-secondary">
                  Go to <strong>Settings → Notifications</strong> in AllyLab
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <span className="text-text-secondary">
                  Click <strong>Add Webhook</strong> and paste your Slack URL
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  4
                </div>
                <span className="text-text-secondary">
                  Click <strong>Test</strong> to verify the connection
                </span>
              </li>
            </ol>
          </div>

          {/* JIRA Integration */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Target size={20} className="text-primary" />
              </div>
              <h2 id="jira-integration" className="text-3xl font-bold">
                JIRA Integration
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Export accessibility issues directly to JIRA for tracking in your
              existing workflow.
            </p>

            <h3 className="text-xl font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-text-secondary mb-8">
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>
                  <strong>Single issue export</strong> — Create one JIRA ticket
                  from a finding
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>
                  <strong>Bulk export</strong> — Create up to 1,000 issues at
                  once
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>
                  <strong>Field mapping</strong> — Map severity to JIRA priority
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span>
                  <strong>Issue linking</strong> — Link findings to existing
                  JIRA issues
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">
              Severity to Priority Mapping
            </h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">
                      AllyLab Severity
                    </th>
                    <th className="py-3 px-4 font-semibold">JIRA Priority</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="red">Critical</Badge>
                    </td>
                    <td className="py-3 px-4">Highest</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="orange">Serious</Badge>
                    </td>
                    <td className="py-3 px-4">High</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="purple">Moderate</Badge>
                    </td>
                    <td className="py-3 px-4">Medium</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="blue">Minor</Badge>
                    </td>
                    <td className="py-3 px-4">Low</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* API Reference */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Code size={20} className="text-primary" />
              </div>
              <h2 id="api-reference" className="text-3xl font-bold">
                API Reference
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Integrate AllyLab programmatically using our REST API. All
              endpoints require authentication with your API key.
            </p>

            <h3 className="text-xl font-semibold mb-4">Authentication</h3>
            <p className="text-text-secondary mb-4">
              Include your API key in the{" "}
              <code className="bg-surface-tertiary px-2 py-0.5 rounded">
                Authorization
              </code>{" "}
              header:
            </p>
            <pre className="bg-surface border border-border rounded-xl p-4 overflow-x-auto mb-8">
              <code className="text-sm text-text-secondary">{`curl -X POST https://api.allylab.io/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}</code>
            </pre>

            <h3 className="text-xl font-semibold mb-4">Endpoints</h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Endpoint</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary font-mono text-xs">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="green">POST</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/scan</td>
                    <td className="py-3 px-4 font-sans">
                      Start a single page scan
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="green">POST</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/crawl</td>
                    <td className="py-3 px-4 font-sans">
                      Start a multi-page site crawl
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="blue">GET</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/scans</td>
                    <td className="py-3 px-4 font-sans">List all scans</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="blue">GET</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/scans/:id</td>
                    <td className="py-3 px-4 font-sans">Get scan details</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="green">POST</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/fixes/generate</td>
                    <td className="py-3 px-4 font-sans">
                      Generate AI fix for an issue
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="blue">GET</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/schedules</td>
                    <td className="py-3 px-4 font-sans">
                      List scheduled scans
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="green">POST</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/schedules</td>
                    <td className="py-3 px-4 font-sans">
                      Create a scheduled scan
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="blue">GET</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/rules</td>
                    <td className="py-3 px-4 font-sans">List custom rules</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <Badge variant="green">POST</Badge>
                    </td>
                    <td className="py-3 px-4">/v1/rules</td>
                    <td className="py-3 px-4 font-sans">
                      Create a custom rule
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-4">Scan Request</h3>
            <pre className="bg-surface border border-border rounded-xl p-4 overflow-x-auto mb-4">
              <code className="text-sm text-text-secondary">{`POST /v1/scan
{
  "url": "https://example.com",
  "standard": "wcag21aa",
  "viewport": "desktop",
  "includeWarnings": false
}`}</code>
            </pre>

            <h3 className="text-xl font-semibold mb-4">Scan Response</h3>
            <pre className="bg-surface border border-border rounded-xl p-4 overflow-x-auto mb-8">
              <code className="text-sm text-text-secondary">{`{
  "id": "scan_abc123",
  "url": "https://example.com",
  "score": 85,
  "totalIssues": 12,
  "critical": 0,
  "serious": 2,
  "moderate": 6,
  "minor": 4,
  "findings": [...],
  "timestamp": "2025-01-15T10:30:00.000Z"
}`}</code>
            </pre>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Key size={18} className="text-primary" />
                Getting Your API Key
              </h4>
              <ol className="space-y-2 text-text-secondary text-sm">
                <li>
                  1. Go to <strong>Settings → API</strong>
                </li>
                <li>
                  2. Click <strong>Generate API Key</strong>
                </li>
                <li>3. Copy your key (it won&apos;t be shown again)</li>
                <li>4. Store it securely in your environment variables</li>
              </ol>
            </div>
          </div>

          {/* Settings */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <Settings size={20} className="text-primary" />
              </div>
              <h2 id="settings" className="text-3xl font-bold">
                Settings
              </h2>
            </div>
            <p className="text-text-secondary text-lg mb-8">
              Configure AllyLab to match your workflow and preferences.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: "General",
                  description:
                    "Default WCAG standard, viewport, and scan preferences",
                  settings: [
                    "Default WCAG Standard",
                    "Default Viewport",
                    "Include Warnings",
                    "Auto-save Scans",
                  ],
                },
                {
                  title: "Custom Rules",
                  description:
                    "Create and manage organization-specific accessibility rules",
                  settings: [
                    "Create Rules",
                    "Import/Export",
                    "Enable/Disable",
                    "Test Rules",
                  ],
                },
                {
                  title: "Git",
                  description: "Connect GitHub or GitLab for PR/MR creation",
                  settings: [
                    "Connect Provider",
                    "Select Repositories",
                    "Default Branch",
                    "PR/MR Templates",
                  ],
                },
                {
                  title: "Notifications",
                  description: "Configure Slack, Teams, and webhook alerts",
                  settings: [
                    "Add Webhooks",
                    "Test Connections",
                    "Event Types",
                    "Formatting",
                  ],
                },
                {
                  title: "JIRA",
                  description: "Export issues to your JIRA project",
                  settings: [
                    "Connect JIRA",
                    "Project Selection",
                    "Field Mapping",
                    "Issue Types",
                  ],
                },
                {
                  title: "API",
                  description: "Manage API keys for programmatic access",
                  settings: [
                    "Generate Keys",
                    "View Usage",
                    "Revoke Keys",
                    "Rate Limits",
                  ],
                },
                {
                  title: "Team",
                  description: "Manage team members and permissions",
                  settings: [
                    "Invite Members",
                    "Roles",
                    "Permissions",
                    "Remove Members",
                  ],
                },
                {
                  title: "Billing",
                  description: "Manage your subscription and payment",
                  settings: [
                    "Current Plan",
                    "Usage",
                    "Invoices",
                    "Upgrade/Downgrade",
                  ],
                },
              ].map((section) => (
                <div
                  key={section.title}
                  className="bg-surface border border-border rounded-xl p-6"
                >
                  <h4 className="font-semibold mb-1">{section.title}</h4>
                  <p className="text-sm text-text-muted mb-3">
                    {section.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {section.settings.map((setting) => (
                      <Badge key={setting}>{setting}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                <HelpCircle size={20} className="text-primary" />
              </div>
              <h2 id="faq" className="text-3xl font-bold">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "What WCAG standards does AllyLab support?",
                  a: "AllyLab supports WCAG 2.0 (A, AA), WCAG 2.1 (A, AA), and WCAG 2.2 (AA). We recommend WCAG 2.1 AA for most projects as it's the current industry standard.",
                },
                {
                  q: "How accurate is the scanning?",
                  a: "AllyLab uses axe-core, the industry-standard accessibility testing engine. Automated testing catches approximately 30-50% of WCAG issues. We recommend combining automated scans with manual testing for complete coverage.",
                },
                {
                  q: "Can I scan pages that require login?",
                  a: "Yes! On Pro and Enterprise plans, you can configure authentication to scan pages behind login. We support cookie-based auth, basic auth, and custom headers.",
                },
                {
                  q: "Are AI fixes always correct?",
                  a: "AI fixes are suggestions, not guaranteed solutions. Each fix includes a confidence score. High confidence fixes (90%+) are usually safe to apply directly, while lower confidence fixes should be reviewed.",
                },
                {
                  q: "How long are scan results stored?",
                  a: "Free plans store the last 30 days of scans. Pro plans store 1 year, and Enterprise plans have unlimited retention.",
                },
                {
                  q: "Can I export my data?",
                  a: "Yes! Export scan results as PDF, CSV, JSON, or Excel. You can also export all your data for backup or migration at any time from Settings.",
                },
                {
                  q: "Is there an API rate limit?",
                  a: "Free plans: 100 requests/hour. Pro plans: 1,000 requests/hour. Enterprise plans: Custom limits available.",
                },
                {
                  q: "How do I cancel my subscription?",
                  a: "Go to Settings → Billing → Cancel Subscription. You'll continue to have access until the end of your billing period.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-xl p-6"
                >
                  <h4 className="font-semibold mb-2">{item.q}</h4>
                  <p className="text-text-secondary">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Help CTA */}
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              Can&apos;t find what you&apos;re looking for? Our support team is
              here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button>Contact Support</Button>
              </Link>
              <Link
                href="https://github.com/allylab/allylab/discussions"
                target="_blank"
              >
                <Button variant="secondary">Community Forum</Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
