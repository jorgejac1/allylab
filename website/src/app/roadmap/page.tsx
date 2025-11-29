import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Check, Clock, Circle, Lightbulb } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Roadmap - AllyLab",
  description: "See what's coming next for AllyLab. Our public roadmap of planned features and improvements.",
};

const roadmapSections = [
  {
    title: "Recently Completed",
    icon: Check,
    badgeVariant: "green" as const,
    badgeText: "✓",
    items: [
      {
        title: "Batch PR Fixes",
        description: "Select multiple issues and create a single PR with all fixes combined.",
        status: "done",
      },
      {
        title: "Custom Rules Engine",
        description: "Create organization-specific accessibility rules with pattern matching, structure validation, and attribute checks.",
        status: "done",
      },
      {
        title: "GitHub Action",
        description: "Official marketplace action for CI/CD integration with configurable thresholds.",
        status: "done",
      },
      {
        title: "npm CLI",
        description: "Command-line tool for scanning from terminal and CI pipelines.",
        status: "done",
      },
      {
        title: "JIRA Integration",
        description: "Export accessibility issues directly to JIRA with custom field mapping and bulk creation.",
        status: "done",
      },
      {
        title: "Slack & Teams Notifications",
        description: "Real-time notifications with rich formatting via Block Kit and Adaptive Cards.",
        status: "done",
      },
    ],
  },
  {
    title: "In Progress",
    icon: Clock,
    badgeVariant: "blue" as const,
    badgeText: "🔄",
    items: [
      {
        title: "Database Migration",
        description: "Moving from localStorage to SQLite (local) and DynamoDB/S3 (cloud) for production-grade data persistence.",
        status: "progress",
      },
      {
        title: "User Authentication",
        description: "Login system with API keys, user accounts, and team management.",
        status: "progress",
      },
      {
        title: "Real-time JIRA Sync",
        description: "Bi-directional sync with JIRA for seamless issue tracking.",
        status: "progress",
      },
    ],
  },
  {
    title: "Planned - Q1 2025",
    icon: Circle,
    badgeVariant: "purple" as const,
    badgeText: "📅",
    items: [
      {
        title: "Rate Limiting",
        description: "Protect API from abuse with configurable rate limits per plan.",
        status: "planned",
      },
      {
        title: "Multi-Tenancy",
        description: "Support for teams, organizations, and permissions within a single account.",
        status: "planned",
      },
      {
        title: "Role-Based Access Control",
        description: "Define user roles (Admin, Editor, Viewer) with granular permissions.",
        status: "planned",
      },
      {
        title: "SSO / SAML Authentication",
        description: "Enterprise single sign-on integration for seamless authentication.",
        status: "planned",
      },
    ],
  },
  {
    title: "Planned - Q2 2025",
    icon: Circle,
    badgeVariant: "default" as const,
    badgeText: "🔮",
    items: [
      {
        title: "Browser Extension",
        description: "Scan pages directly from Chrome/Firefox with instant results overlay.",
        status: "planned",
      },
      {
        title: "VS Code Extension",
        description: "Scan and fix accessibility issues directly in your editor.",
        status: "planned",
      },
      {
        title: "Audit Logs",
        description: "Track all user actions for compliance and security auditing.",
        status: "planned",
      },
      {
        title: "API Keys Management",
        description: "Create and manage multiple API keys with scope restrictions.",
        status: "planned",
      },
    ],
  },
  {
    title: "Future Ideas",
    icon: Lightbulb,
    badgeVariant: "orange" as const,
    badgeText: "💡",
    items: [
      {
        title: "TV App Accessibility Testing",
        description: "Computer vision-based testing for native TV applications — a unique market differentiator.",
        status: "idea",
      },
      {
        title: "Mobile App Testing",
        description: "Native iOS and Android accessibility testing with device emulation.",
        status: "idea",
      },
      {
        title: "Performance Scanning",
        description: "Lighthouse-style performance metrics alongside accessibility.",
        status: "idea",
      },
      {
        title: "Security Vulnerability Scanning",
        description: "Basic security checks integrated with accessibility scanning.",
        status: "idea",
      },
      {
        title: "SEO Analysis",
        description: "SEO best practices checking alongside accessibility.",
        status: "idea",
      },
    ],
  },
];

const statusStyles = {
  done: "bg-primary/20 text-primary",
  progress: "bg-accent-blue/20 text-accent-blue",
  planned: "bg-surface-tertiary text-text-muted",
  idea: "bg-surface-tertiary text-text-muted",
};

const statusIcons = {
  done: <Check size={16} />,
  progress: <Clock size={16} className="animate-pulse" />,
  planned: <Circle size={16} />,
  idea: <Lightbulb size={16} />,
};

export default function RoadmapPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Product <span className="gradient-text">Roadmap</span>
          </h1>
          <p className="text-xl text-text-secondary">
            See what we&apos;re working on and what&apos;s coming next. Your feedback shapes our priorities.
          </p>
        </div>
      </section>

      {/* Roadmap Content */}
      <Section>
        <div className="max-w-4xl mx-auto space-y-16">
          {roadmapSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <Badge variant={section.badgeVariant}>{section.badgeText}</Badge>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>

              {/* Items */}
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 p-4 bg-surface border border-border rounded-xl hover:border-border-light transition-colors"
                  >
                    {/* Status Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        statusStyles[item.status as keyof typeof statusStyles]
                      }`}
                    >
                      {statusIcons[item.status as keyof typeof statusIcons]}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-text-secondary text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Feedback CTA */}
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Have a Feature Request?</h3>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              We&apos;d love to hear what features would help your team. Your feedback directly
              influences our roadmap.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button>Submit Feedback</Button>
              </Link>
              <Link href="https://github.com/allylab/allylab/issues" target="_blank">
                <Button variant="secondary">GitHub Issues</Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}