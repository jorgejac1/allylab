import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GitBranch, Package, Zap, Bug, Sparkles } from "lucide-react";

export const metadata = {
  title: "Changelog - AllyLab",
  description: "Stay up to date with the latest AllyLab releases, features, and improvements.",
};

const releases = [
  {
    version: "1.3.0",
    date: "January 2025",
    type: "minor" as const,
    product: "Platform",
    highlights: "Authenticated scanning for protected pages with enterprise security features",
    changes: [
      {
        type: "feature",
        title: "Authenticated Scanning",
        description: "Scan protected pages like dashboards and admin panels. Support for cookies, HTTP headers, storage state, login flows, and basic auth.",
      },
      {
        type: "feature",
        title: "Cookie Capture Extension",
        description: "Chrome extension to easily capture session cookies from authenticated sites with one-click export in AllyLab format.",
      },
      {
        type: "feature",
        title: "Credential Encryption",
        description: "AES-256-GCM encryption for stored credentials with PBKDF2 key derivation. Device-specific keys ensure credentials are protected at rest.",
      },
      {
        type: "feature",
        title: "Profile Health Monitoring",
        description: "Track credential freshness with automatic health checks. Get warned when profiles need attention or re-testing.",
      },
      {
        type: "feature",
        title: "Auth Profile Management",
        description: "Save and manage authentication profiles for different domains. Auto-detect matching profiles, import/export for team sharing.",
      },
      {
        type: "improvement",
        title: "Scheduled Scans with Auth",
        description: "Assign authentication profiles to scheduled scans for automated monitoring of protected pages.",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "January 2025",
    type: "minor" as const,
    product: "Platform",
    highlights: "GitLab integration and enhanced Git workflow",
    changes: [
      {
        type: "feature",
        title: "GitLab Integration",
        description: "Full GitLab support for merge request creation, including GitLab.com and self-hosted instances.",
      },
      {
        type: "feature",
        title: "Unified Git Settings",
        description: "New Git settings page with provider selector for connecting both GitHub and GitLab simultaneously.",
      },
      {
        type: "improvement",
        title: "Self-Hosted Support",
        description: "Configure custom instance URLs for GitHub Enterprise and GitLab Self-Managed.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "January 2025",
    type: "minor" as const,
    product: "CLI",
    highlights: "Batch scanning, watch mode, and new output formats",
    changes: [
      {
        type: "feature",
        title: "Batch URL Scanning",
        description: "Scan multiple URLs from a file with configurable concurrency using the new --file flag.",
      },
      {
        type: "feature",
        title: "Watch Mode",
        description: "Continuously monitor URLs at configurable intervals with --watch and --interval flags.",
      },
      {
        type: "feature",
        title: "HTML Report Export",
        description: "Generate beautiful, self-contained HTML reports with the --format html option.",
      },
      {
        type: "feature",
        title: "SARIF Output",
        description: "Export results in SARIF format for GitHub Advanced Security integration.",
      },
      {
        type: "feature",
        title: "Configuration File Support",
        description: "Use allylab.config.json for persistent scan configuration across your project.",
      },
      {
        type: "improvement",
        title: "Enhanced Progress Reporting",
        description: "Better progress indicators and real-time feedback during batch scans.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "December 2024",
    type: "major" as const,
    product: "Platform",
    highlights: "Initial public release of AllyLab",
    changes: [
      {
        type: "feature",
        title: "WCAG 2.2 Support",
        description: "Full support for WCAG 2.0, 2.1, and 2.2 guidelines at A and AA conformance levels.",
      },
      {
        type: "feature",
        title: "AI-Powered Fix Suggestions",
        description: "Generate production-ready code fixes using Claude AI with framework-specific output.",
      },
      {
        type: "feature",
        title: "GitHub & GitLab Integration",
        description: "Create pull requests (GitHub) or merge requests (GitLab) directly from scan results with single-click fix deployment.",
      },
      {
        type: "feature",
        title: "JIRA Integration",
        description: "Export accessibility findings to JIRA with customizable field mapping.",
      },
      {
        type: "feature",
        title: "Scheduled Scans",
        description: "Automate accessibility monitoring with hourly, daily, weekly, or monthly scans.",
      },
      {
        type: "feature",
        title: "Custom Rules Engine",
        description: "Create organization-specific accessibility checks beyond WCAG standards.",
      },
      {
        type: "feature",
        title: "CLI Tool",
        description: "Command-line interface for scanning URLs, generating reports, and CI/CD integration.",
      },
      {
        type: "feature",
        title: "Dashboard",
        description: "Web-based interface for managing scans, viewing results, and tracking progress.",
      },
      {
        type: "feature",
        title: "API",
        description: "RESTful API for programmatic access to scanning and fix generation capabilities.",
      },
    ],
  },
  {
    version: "0.9.0",
    date: "November 2024",
    type: "minor" as const,
    product: "Beta",
    highlights: "Public beta release",
    changes: [
      {
        type: "feature",
        title: "Beta Program Launch",
        description: "Limited public beta with core scanning and AI fix functionality.",
      },
      {
        type: "feature",
        title: "Multi-Page Crawling",
        description: "Automatically discover and scan multiple pages from a single starting URL.",
      },
      {
        type: "feature",
        title: "Export Options",
        description: "Export scan results in PDF, CSV, and JSON formats.",
      },
      {
        type: "improvement",
        title: "Performance Optimizations",
        description: "Improved scan speed and reduced memory usage for large sites.",
      },
    ],
  },
  {
    version: "0.5.0",
    date: "October 2024",
    type: "minor" as const,
    product: "Alpha",
    highlights: "Internal alpha testing",
    changes: [
      {
        type: "feature",
        title: "Core Scanner",
        description: "Initial axe-core based accessibility scanning with Playwright browser automation.",
      },
      {
        type: "feature",
        title: "AI Fix Generation",
        description: "First implementation of Claude-powered fix suggestions.",
      },
      {
        type: "bug",
        title: "Various Bug Fixes",
        description: "Numerous stability improvements based on internal testing feedback.",
      },
    ],
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Sparkles size={16} className="text-primary" />;
    case "improvement":
      return <Zap size={16} className="text-accent-blue" />;
    case "bug":
      return <Bug size={16} className="text-accent-orange" />;
    default:
      return <Package size={16} className="text-text-muted" />;
  }
};

const getVersionBadge = (type: "major" | "minor" | "patch") => {
  switch (type) {
    case "major":
      return <Badge variant="green">Major Release</Badge>;
    case "minor":
      return <Badge variant="blue">Feature Update</Badge>;
    case "patch":
      return <Badge>Patch</Badge>;
  }
};

export default function ChangelogPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">Changelog</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            What&apos;s New in <span className="gradient-text">AllyLab</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and fixes across our platform.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <GitBranch size={16} />
              Follow releases on GitHub
            </span>
          </div>
        </div>
      </section>

      {/* Releases */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

            <div className="space-y-12">
              {releases.map((release) => (
                <div key={`${release.product}-${release.version}`} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-4 w-5 h-5 bg-surface border-2 border-primary rounded-full hidden md:flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>

                  <Card className="md:ml-16" hover={false}>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h2 className="text-xl font-bold">
                        {release.product} v{release.version}
                      </h2>
                      {getVersionBadge(release.type)}
                      <span className="text-sm text-text-muted">{release.date}</span>
                    </div>

                    <p className="text-text-secondary mb-6">{release.highlights}</p>

                    <div className="space-y-4">
                      {release.changes.map((change, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {getTypeIcon(change.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{change.title}</h4>
                            <p className="text-sm text-text-muted">{change.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Subscribe CTA */}
          <div className="mt-16 bg-surface border border-border rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              Get notified about new releases, features, and important updates.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/jorgejac1/allylab/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <GitBranch size={18} />
                Watch on GitHub
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
