import { Section, SectionHeader } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Search,
  Bot,
  GitBranch,
  BarChart3,
  Zap,
  Settings,
  Calendar,
  Bell,
  Target,
  Users,
  Shield,
  FileText,
  Code,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  GitPullRequest,
  Clock,
  TrendingUp,
  CheckCheck,
  Layers,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";

export const metadata = {
  title: "Features - AllyLab",
  description:
    "Explore AllyLab's comprehensive accessibility scanning features including AI-powered fixes, GitHub integration, and WCAG compliance tools.",
};

const mainFeatures = [
  {
    id: "scanning",
    icon: Search,
    title: "Comprehensive Scanning",
    subtitle: "WCAG 2.0, 2.1, 2.2 Support",
    description:
      "Enterprise-grade accessibility scanning powered by axe-core, the industry-leading testing engine used by Microsoft, Google, and thousands of organizations.",
    color: "green",
    features: [
      { icon: Globe, text: "Single page and multi-page site crawling" },
      {
        icon: Monitor,
        text: "Multi-viewport testing (Desktop, Tablet, Mobile)",
      },
      { icon: Zap, text: "Real-time streaming results via SSE" },
      { icon: Settings, text: "Configurable crawl depth and page limits" },
      { icon: FileText, text: "Automatic sitemap detection" },
      { icon: Shield, text: "Section 508 compliance support" },
    ],
  },
  {
    id: "ai-fixes",
    icon: Bot,
    title: "AI-Powered Fixes",
    subtitle: "Powered by Claude AI",
    description:
      "Stop spending hours researching WCAG criteria. Get production-ready code fixes tailored to your specific codebase and framework.",
    color: "blue",
    features: [
      { icon: Code, text: "Framework-specific code (HTML, React, Vue)" },
      { icon: CheckCircle, text: "Confidence scores and effort estimates" },
      { icon: Layers, text: "Context-aware suggestions" },
      { icon: FileText, text: "WCAG criteria explanations" },
      { icon: GitPullRequest, text: "One-click PR creation" },
      { icon: CheckCheck, text: "Fix verification after merge" },
    ],
  },
  {
    id: "github",
    icon: GitBranch,
    title: "GitHub Integration",
    subtitle: "Streamlined Workflow",
    description:
      "Connect your repositories and create pull requests with accessibility fixes directly from the dashboard. Supports batch fixes and automatic verification.",
    color: "purple",
    features: [
      { icon: GitPullRequest, text: "Automatic PR creation with fixes" },
      { icon: Layers, text: "Batch multiple fixes in single PR" },
      { icon: CheckCheck, text: "Fix verification after merge" },
      { icon: Globe, text: "Works with any accessible repository" },
      { icon: Shield, text: "GitHub Enterprise support" },
      { icon: Clock, text: "PR status tracking" },
    ],
  },
  {
    id: "reporting",
    icon: BarChart3,
    title: "Reporting & Analytics",
    subtitle: "Executive Dashboards",
    description:
      "Track accessibility progress with comprehensive dashboards, historical trends, and exportable reports for stakeholders.",
    color: "orange",
    features: [
      { icon: TrendingUp, text: "Score trends over time" },
      { icon: BarChart3, text: "Issue trends by severity" },
      { icon: Target, text: "Competitor benchmarking" },
      { icon: FileText, text: "PDF reports for stakeholders" },
      { icon: FileSpreadsheet, text: "CSV, JSON, Excel exports" },
      { icon: Clock, text: "Period comparison analysis" },
    ],
  },
];

const additionalFeatures = [
  {
    id: "cicd",
    icon: Zap,
    title: "CI/CD Integration",
    description:
      "Integrate accessibility testing into your pipeline. Fail builds on critical issues with configurable thresholds.",
    badges: ["GitHub Actions", "GitLab CI", "Harness", "Jenkins"],
  },
  {
    id: "custom-rules",
    icon: Settings,
    title: "Custom Rules",
    description:
      "Create organization-specific accessibility rules with pattern matching, structure validation, and attribute checks.",
    badges: ["Selector", "Attribute", "Content", "Structure"],
  },
  {
    id: "scheduling",
    icon: Calendar,
    title: "Scheduled Scans",
    description:
      "Automate recurring scans hourly, daily, weekly, or monthly. Track improvements with historical data.",
    badges: ["Hourly", "Daily", "Weekly", "Monthly"],
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description:
      "Stay informed with Slack and Microsoft Teams integration. Rich formatting with Block Kit and Adaptive Cards.",
    badges: ["Slack", "Teams", "Webhooks"],
  },
  {
    id: "jira",
    icon: Target,
    title: "JIRA Integration",
    description:
      "Export issues directly to JIRA with custom field mapping. Bulk creation supports up to 1,000 issues at once.",
    badges: ["Bulk Export", "Field Mapping", "Issue Linking"],
  },
  {
    id: "issue-tracking",
    icon: CheckCheck,
    title: "Issue Tracking",
    description:
      "Automatic fingerprinting tracks issues across scans. See new, recurring, and fixed issues at a glance.",
    badges: ["Fingerprinting", "Status Tracking", "False Positives"],
  },
  {
    id: "cli",
    icon: Code,
    title: "CLI Tool",
    description:
      "Command-line scanning for CI/CD pipelines. Single page and multi-page scans with multiple output formats.",
    badges: ["npm", "npx", "JSON Output"],
  },
  {
    id: "benchmarking",
    icon: Users,
    title: "Competitor Benchmarking",
    description:
      "Compare your accessibility scores against competitors. Track relative position and improvements over time.",
    badges: ["Side-by-side", "Score Comparison", "Trends"],
  },
];

const wcagStandards = [
  { version: "WCAG 2.0", levels: ["A", "AA"] },
  { version: "WCAG 2.1", levels: ["A", "AA"] },
  { version: "WCAG 2.2", levels: ["A", "AA"] },
  { version: "Section 508", levels: ["Compliant"] },
];

const viewports = [
  { name: "Desktop", icon: Monitor, size: "1280×720" },
  { name: "Tablet", icon: Tablet, size: "768×1024" },
  { name: "Mobile", icon: Smartphone, size: "375×667" },
];

const frameworks = [
  { name: "HTML", description: "Clean, semantic markup" },
  { name: "React", description: "JSX with ARIA attributes" },
  { name: "Vue", description: "Template syntax bindings" },
  { name: "Angular", description: "Coming soon" },
];

const colorClasses = {
  green: "bg-primary/15 text-primary",
  blue: "bg-accent-blue/15 text-accent-blue",
  purple: "bg-accent-purple/15 text-accent-purple",
  orange: "bg-accent-orange/15 text-accent-orange",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">
            50+ Features
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Powerful Features for
            <br />
            <span className="gradient-text">Accessibility Excellence</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Everything you need to scan, fix, and monitor web accessibility at
            scale. From automated scanning to AI-powered remediation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="secondary" size="lg">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Standards & Viewports Bar */}
      <section className="py-8 px-6 bg-surface-secondary border-y border-border-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-muted font-medium">
                Standards:
              </span>
              <div className="flex gap-2">
                {wcagStandards.map((std) => (
                  <Badge key={std.version} variant="green">
                    {std.version}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-muted font-medium">
                Viewports:
              </span>
              <div className="flex gap-3">
                {viewports.map((vp) => (
                  <div
                    key={vp.name}
                    className="flex items-center gap-1.5 text-text-secondary"
                  >
                    <vp.icon size={16} />
                    <span className="text-sm">{vp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features - Detailed */}
      <Section>
        <div className="space-y-24">
          {mainFeatures.map((feature, index) => (
            <div
              key={feature.id}
              id={feature.id}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 ${
                    colorClasses[feature.color as keyof typeof colorClasses]
                  }`}
                >
                  <feature.icon size={28} />
                </div>
                <Badge
                  variant={
                    feature.color as "green" | "blue" | "purple" | "orange"
                  }
                  className="mb-4"
                >
                  {feature.subtitle}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {feature.title}
                </h2>
                <p className="text-lg text-text-secondary mb-8">
                  {feature.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {feature.features.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                        <item.icon size={16} className="text-primary" />
                      </div>
                      <span className="text-text-secondary text-sm pt-1">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                {/* Feature Visual */}
                {feature.id === "scanning" && (
                  <div className="bg-surface border border-border rounded-2xl p-6 glow">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-semibold">Scan Results</h4>
                      <Badge variant="green">Score: 85</Badge>
                    </div>
                    <div className="space-y-3">
                      {[
                        { severity: "Critical", count: 0, color: "red" },
                        { severity: "Serious", count: 2, color: "orange" },
                        { severity: "Moderate", count: 6, color: "yellow" },
                        { severity: "Minor", count: 4, color: "blue" },
                      ].map((item) => (
                        <div
                          key={item.severity}
                          className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full bg-accent-${item.color}`}
                            />
                            <span className="text-sm">{item.severity}</span>
                          </div>
                          <span className="font-mono font-semibold">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between text-sm text-text-muted">
                        <span>12 issues found</span>
                        <span>Scan time: 4.8s</span>
                      </div>
                    </div>
                  </div>
                )}

                {feature.id === "ai-fixes" && (
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden glow">
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-tertiary border-b border-border">
                      <span className="text-sm font-mono text-text-muted">
                        Hero.tsx
                      </span>
                      <Badge variant="blue">React</Badge>
                    </div>
                    <div className="p-4 font-mono text-sm">
                      <div className="text-accent-red line-through opacity-60 mb-2">
                        {'<img src="hero.jpg" />'}
                      </div>
                      <div className="text-primary">
                        {"<img"}
                        <br />
                        {'  src="hero.jpg"'}
                        <br />
                        {'  alt="Team collaborating in office"'}
                        <br />
                        {'  loading="lazy"'}
                        <br />
                        {"/>"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-tertiary border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">
                          Confidence:
                        </span>
                        <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className="w-[94%] h-full bg-primary rounded-full" />
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          94%
                        </span>
                      </div>
                      <Button size="sm">Create PR</Button>
                    </div>
                  </div>
                )}

                {feature.id === "github" && (
                  <div className="bg-surface border border-border rounded-2xl p-6 glow">
                    <div className="flex items-center gap-3 mb-6">
                      <GitPullRequest className="text-primary" size={24} />
                      <div>
                        <h4 className="font-semibold">Pull Request Created</h4>
                        <p className="text-sm text-text-muted">
                          #42 opened just now
                        </p>
                      </div>
                    </div>
                    <div className="bg-surface-secondary rounded-lg p-4 mb-4">
                      <p className="font-semibold mb-1">
                        [AllyLab] Fix 3 accessibility issues
                      </p>
                      <p className="text-sm text-text-muted">
                        Fixes image-alt, button-name, color-contrast
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-primary" />
                        </div>
                        <span className="text-text-secondary">
                          All checks passed
                        </span>
                      </div>
                      <Badge variant="green">Ready to merge</Badge>
                    </div>
                  </div>
                )}

                {feature.id === "reporting" && (
                  <div className="bg-surface border border-border rounded-2xl p-6 glow">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-semibold">Score Trend</h4>
                      <Badge variant="green">+12 pts</Badge>
                    </div>
                    <div className="h-48 flex items-end justify-between gap-3 mb-4 px-2">
                      {[
                        { month: "Jan", score: 65 },
                        { month: "Feb", score: 68 },
                        { month: "Mar", score: 72 },
                        { month: "Apr", score: 70 },
                        { month: "May", score: 75 },
                        { month: "Jun", score: 78 },
                        { month: "Jul", score: 82 },
                        { month: "Aug", score: 85 },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div className="w-full flex flex-col justify-end h-36">
                            <div
                              className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-md transition-all duration-500"
                              style={{ height: `${(item.score / 100) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted">
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm text-text-muted">
                          Accessibility Score
                        </span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        Avg:{" "}
                        <span className="text-primary font-semibold">77</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Framework Support */}
      <Section className="bg-surface-secondary">
        <SectionHeader
          label="AI Fix Generation"
          title="Framework-Specific Code"
          description="Get fixes in the language and framework you actually use"
        />
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {frameworks.map((fw) => (
            <Card key={fw.name} className="text-center">
              <div className="w-12 h-12 bg-surface-tertiary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Code size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{fw.name}</h3>
              <p className="text-sm text-text-muted">{fw.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Additional Features Grid */}
      <Section>
        <SectionHeader
          label="And Much More"
          title="Additional Features"
          description="Everything else you need for enterprise-grade accessibility management"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {additionalFeatures.map((feature) => (
            <Card key={feature.id} className="h-full">
              <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                <feature.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm mb-4">
                {feature.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {feature.badges.map((badge) => (
                  <Badge key={badge}>{badge}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* CI/CD Code Examples */}
      <Section className="bg-surface-secondary">
        <SectionHeader
          label="CI/CD Integration"
          title="Automate Accessibility Testing"
          description="Catch issues before they reach production with native CI/CD support"
        />
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-surface-tertiary border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-text-muted" />
              <span className="text-sm font-medium">GitHub Actions</span>
            </div>
            <pre className="p-4 text-xs overflow-x-auto">
              <code className="text-text-secondary">{`name: Accessibility
on: [push]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: allylab/scan@v1
        with:
          url: \${{ env.URL }}
          fail-on: critical`}</code>
            </pre>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-surface-tertiary border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-orange" />
              <span className="text-sm font-medium">GitLab CI</span>
            </div>
            <pre className="p-4 text-xs overflow-x-auto">
              <code className="text-text-secondary">{`accessibility:
  image: node:20
  script:
    - npx @allylab/cli scan
      \$CI_ENVIRONMENT_URL
      --fail-on serious
      --format json`}</code>
            </pre>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-surface-tertiary border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-blue" />
              <span className="text-sm font-medium">CLI</span>
            </div>
            <pre className="p-4 text-xs overflow-x-auto">
              <code className="text-text-secondary">{`# Install CLI
npm i -g @allylab/cli

# Scan single page
allylab scan https://example.com

# Scan entire site
allylab site https://example.com
  --max-pages 20`}</code>
            </pre>
          </div>
        </div>
      </Section>

      {/* Feature Comparison */}
      <Section>
        <SectionHeader
          label="Why AllyLab?"
          title="Beyond Traditional Scanners"
          description="See how AllyLab compares to other accessibility tools"
        />
        <div className="max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-4 font-semibold">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold text-primary">
                    AllyLab
                  </th>
                  <th className="py-4 px-4 text-center font-semibold text-text-muted">
                    Traditional Tools
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["WCAG 2.2 Support", true, "Partial"],
                  ["AI-Powered Fix Suggestions", true, false],
                  ["Framework-Specific Code", true, false],
                  ["One-Click GitHub PRs", true, false],
                  ["Batch Fix Creation", true, false],
                  ["Fix Verification", true, false],
                  ["Custom Rules Engine", true, "Limited"],
                  ["Real-time SSE Streaming", true, false],
                  ["CI/CD Integration", true, true],
                  ["JIRA Integration", true, true],
                  ["Slack/Teams Notifications", true, true],
                  ["Historical Trends", true, "Limited"],
                  ["Competitor Benchmarking", true, false],
                  ["Open Source", true, false],
                ].map(([feature, allylab, others], i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4">{feature}</td>
                    <td className="py-3 px-4 text-center">
                      {allylab === true ? (
                        <CheckCircle
                          size={18}
                          className="text-primary mx-auto"
                        />
                      ) : (
                        <span className="text-text-muted">{allylab}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {others === true ? (
                        <CheckCircle
                          size={18}
                          className="text-text-muted mx-auto"
                        />
                      ) : others === false ? (
                        <span className="text-text-dim">—</span>
                      ) : (
                        <span className="text-text-muted">{others}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Export Formats */}
      <Section className="bg-surface-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Export in Any Format</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              {
                icon: FileText,
                label: "PDF Reports",
                desc: "For stakeholders",
              },
              { icon: FileJson, label: "JSON", desc: "For integrations" },
              { icon: FileSpreadsheet, label: "Excel", desc: "For analysis" },
              { icon: FileText, label: "CSV", desc: "For spreadsheets" },
            ].map((format) => (
              <div
                key={format.label}
                className="flex items-center gap-3 px-6 py-4 bg-surface border border-border rounded-xl"
              >
                <format.icon size={24} className="text-primary" />
                <div className="text-left">
                  <p className="font-medium">{format.label}</p>
                  <p className="text-xs text-text-muted">{format.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="py-24 px-6 gradient-mesh">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Try These Features?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Start your free trial today and scan your first site in under 2
            minutes. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-text-muted mt-6">
            ✓ Free tier available &nbsp; ✓ No credit card required &nbsp; ✓
            Cancel anytime
          </p>
        </div>
      </section>
    </>
  );
}
