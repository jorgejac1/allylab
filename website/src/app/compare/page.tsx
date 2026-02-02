import { Section, SectionHeader } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  Code,
  GitPullRequest,
  Bot,
  Shield,
  DollarSign,
  Lock,
  RefreshCw,
  Settings,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "AllyLab vs Competitors - Why Choose AllyLab",
  description:
    "Compare AllyLab to AudioEye, accessiBe, UserWay, and Deque. See why developers choose AllyLab for AI-powered accessibility fixes.",
};

const competitors = [
  {
    name: "AudioEye",
    type: "Overlay + Managed",
    pricing: "From $49/mo",
    pros: [
      "Legal protection included",
      "Human expert review",
      "Quick installation",
    ],
    cons: [
      "No code fixes generated",
      "No Git integration",
      "Overlay approach controversial",
      "Higher pricing",
    ],
  },
  {
    name: "accessiBe",
    type: "AI Overlay Widget",
    pricing: "From $59/mo",
    pros: ["Fast implementation", "AI-powered", "Affordable for small sites"],
    cons: [
      "Overlay doesn't fix actual code",
      "Criticized by accessibility community",
      "No developer tools",
      "No CI/CD integration",
    ],
  },
  {
    name: "UserWay",
    type: "Widget + Scanner",
    pricing: "Free widget, paid plans",
    pros: ["Free widget option", "Easy to install", "Good for quick wins"],
    cons: [
      "Widget masks issues",
      "Limited scanning",
      "No code generation",
      "No Git/JIRA integration",
    ],
  },
  {
    name: "Deque (axe)",
    type: "Developer Tools",
    pricing: "Free to Enterprise",
    pros: [
      "Industry-standard engine",
      "Excellent developer tools",
      "Open-source core",
      "CI/CD friendly",
    ],
    cons: [
      "No AI fix generation",
      "No PR automation",
      "Steep learning curve",
      "Enterprise pricing opaque",
    ],
  },
  {
    name: "Siteimprove",
    type: "Enterprise Platform",
    pricing: "Custom (expensive)",
    pros: ["Comprehensive platform", "Good reporting", "SEO + accessibility"],
    cons: [
      "Very expensive",
      "No code fixes",
      "No Git integration",
      "Overkill for small teams",
    ],
  },
  {
    name: "Level Access",
    type: "Enterprise + Services",
    pricing: "Custom (expensive)",
    pros: ["Expert audits", "Legal documentation", "VPAT generation"],
    cons: [
      "Very expensive",
      "No automated fixes",
      "Long audit timelines",
      "Enterprise only",
    ],
  },
];

const detailedComparison = [
  {
    category: "Scanning & Detection",
    features: [
      {
        name: "WCAG 2.2 AA Support",
        allylab: true,
        audioeye: true,
        accessibe: "Partial",
        deque: true,
        userway: "Partial",
      },
      {
        name: "Multi-Page Site Crawling",
        allylab: true,
        audioeye: true,
        accessibe: false,
        deque: true,
        userway: "Limited",
      },
      {
        name: "Real-time SSE Streaming",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Custom Rules Engine",
        allylab: true,
        audioeye: "Limited",
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "Mobile Viewport Testing",
        allylab: true,
        audioeye: true,
        accessibe: true,
        deque: true,
        userway: true,
      },
    ],
  },
  {
    category: "Fix Generation",
    features: [
      {
        name: "AI-Powered Code Fixes",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Framework-Specific (React, Vue)",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Confidence Scores",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Fix Explanations",
        allylab: true,
        audioeye: "Generic",
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "Batch Fix Generation",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
    ],
  },
  {
    category: "Developer Workflow",
    features: [
      {
        name: "GitHub PR / GitLab MR Creation",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Batch PRs/MRs (Multiple Fixes)",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Fix Verification",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "CI/CD Integration",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "CLI Tool",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: true,
        userway: false,
      },
    ],
  },
  {
    category: "Integrations",
    features: [
      {
        name: "JIRA Export",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "Slack Notifications",
        allylab: true,
        audioeye: true,
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "Microsoft Teams",
        allylab: true,
        audioeye: true,
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "Webhooks",
        allylab: true,
        audioeye: "Limited",
        accessibe: false,
        deque: true,
        userway: false,
      },
      {
        name: "API Access",
        allylab: "All plans",
        audioeye: "Enterprise",
        accessibe: "Enterprise",
        deque: "Paid",
        userway: "Enterprise",
      },
    ],
  },
  {
    category: "Pricing & Deployment",
    features: [
      {
        name: "Free Tier",
        allylab: true,
        audioeye: "Trial only",
        accessibe: "Scan only",
        deque: true,
        userway: "Widget only",
      },
      {
        name: "Self-Hosted Option",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: false,
        userway: false,
      },
      {
        name: "Open Source",
        allylab: true,
        audioeye: false,
        accessibe: false,
        deque: "Partial",
        userway: false,
      },
      {
        name: "Transparent Pricing",
        allylab: true,
        audioeye: "Partial",
        accessibe: true,
        deque: false,
        userway: true,
      },
    ],
  },
];

const overlayProblems = [
  {
    icon: AlertTriangle,
    title: "Overlays Don't Fix Your Code",
    description:
      "Overlay widgets inject JavaScript to modify how your site appears, but your actual HTML remains inaccessible. This creates technical debt and doesn't address the root cause.",
  },
  {
    icon: Shield,
    title: "Limited Legal Protection",
    description:
      "Despite marketing claims, overlay solutions have been named in numerous accessibility lawsuits. The DOJ has stated overlays don't ensure compliance.",
  },
  {
    icon: RefreshCw,
    title: "Performance Impact",
    description:
      "Overlays add JavaScript that runs on every page load, slowing down your site and potentially conflicting with your existing code.",
  },
  {
    icon: X,
    title: "Accessibility Community Opposition",
    description:
      "Major accessibility advocates and organizations have spoken out against overlays, with some users specifically blocking them with browser extensions.",
  },
];

const whyAllyLab = [
  {
    icon: Code,
    title: "Real Code Fixes",
    description:
      "We generate actual code changes that permanently fix accessibility issues. No overlays, no band-aids—real solutions.",
  },
  {
    icon: Bot,
    title: "AI-Powered Intelligence",
    description:
      "Our AI understands your codebase and generates framework-specific fixes for React, Vue, Angular, and vanilla HTML.",
  },
  {
    icon: GitPullRequest,
    title: "Git-Native Workflow",
    description:
      "Create GitHub PRs or GitLab MRs with one click. Review diffs, merge fixes, and verify they worked—all from one platform.",
  },
  {
    icon: DollarSign,
    title: "Actually Affordable",
    description:
      "Start free forever. Pro plans cost less than competitors while offering more features. No enterprise-only gotchas.",
  },
  {
    icon: Lock,
    title: "Self-Host Option",
    description:
      "Keep your data on your infrastructure. Perfect for enterprises with strict security requirements.",
  },
  {
    icon: Settings,
    title: "Developer-First Design",
    description:
      "Built by developers, for developers. CLI tools, CI/CD integration, and API access on all plans.",
  },
];

export default function ComparePage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">
            Compare
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Why Teams Choose <span className="gradient-text">AllyLab</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Unlike tools that just identify problems or overlays that mask them,
            AllyLab generates production-ready code fixes and creates GitHub PRs
            automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button size="lg">
                Try AllyLab Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <Section>
        <SectionHeader
          label="The AllyLab Difference"
          title="Fix Issues, Don't Mask Them"
          description="Here's what sets AllyLab apart from every other accessibility tool"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {whyAllyLab.map((item) => (
            <Card key={item.title}>
              <item.icon size={24} className="text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-text-secondary text-sm">{item.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* The Problem with Overlays */}
      <Section className="bg-surface-secondary">
        <SectionHeader
          label="The Overlay Problem"
          title="Why Overlay Solutions Fall Short"
          description="Tools like accessiBe, UserWay, and AudioEye's widget approach have fundamental limitations"
        />
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {overlayProblems.map((problem) => (
            <Card key={problem.title} hover={false}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent-red/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <problem.icon size={20} className="text-accent-red" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{problem.title}</h4>
                  <p className="text-text-secondary text-sm">
                    {problem.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-text-muted text-sm">
            AllyLab takes a different approach: we help you fix your actual code
            so your site is genuinely accessible, not just appears to be.
          </p>
        </div>
      </Section>

      {/* Competitor Overview */}
      <Section>
        <SectionHeader
          label="Market Overview"
          title="How Competitors Compare"
          description="Quick overview of major accessibility tools and their approaches"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {competitors.map((competitor) => (
            <Card key={competitor.name} hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{competitor.name}</h3>
                <Badge>{competitor.type}</Badge>
              </div>
              <p className="text-primary font-medium mb-4">
                {competitor.pricing}
              </p>

              <div className="mb-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Pros
                </p>
                <ul className="space-y-1">
                  {competitor.pros.map((pro, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <Check
                        size={14}
                        className="text-primary mt-0.5 flex-shrink-0"
                      />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Cons
                </p>
                <ul className="space-y-1">
                  {competitor.cons.map((con, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <X
                        size={14}
                        className="text-accent-red mt-0.5 flex-shrink-0"
                      />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Detailed Feature Comparison */}
      <Section className="bg-surface-secondary">
        <SectionHeader
          label="Feature Comparison"
          title="Detailed Feature Breakdown"
          description="See exactly how AllyLab compares across every category"
        />

        <div className="max-w-6xl mx-auto space-y-8">
          {detailedComparison.map((category) => (
            <div key={category.category}>
              <h3 className="text-lg font-semibold mb-4 text-primary">
                {category.category}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm bg-surface rounded-xl border border-border">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 font-medium">Feature</th>
                      <th className="py-3 px-4 text-center font-bold text-primary">
                        AllyLab
                      </th>
                      <th className="py-3 px-4 text-center text-text-muted">
                        AudioEye
                      </th>
                      <th className="py-3 px-4 text-center text-text-muted">
                        accessiBe
                      </th>
                      <th className="py-3 px-4 text-center text-text-muted">
                        Deque
                      </th>
                      <th className="py-3 px-4 text-center text-text-muted">
                        UserWay
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.features.map((feature, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-3 px-4">{feature.name}</td>
                        {[
                          "allylab",
                          "audioeye",
                          "accessibe",
                          "deque",
                          "userway",
                        ].map((company) => {
                          const value =
                            feature[company as keyof typeof feature];
                          return (
                            <td key={company} className="py-3 px-4 text-center">
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check
                                    size={16}
                                    className={
                                      company === "allylab"
                                        ? "text-primary mx-auto"
                                        : "text-text-muted mx-auto"
                                    }
                                  />
                                ) : (
                                  <X
                                    size={16}
                                    className="text-text-dim mx-auto"
                                  />
                                )
                              ) : (
                                <span
                                  className={
                                    company === "allylab"
                                      ? "text-primary font-medium"
                                      : "text-text-muted"
                                  }
                                >
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Migration CTA */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center" hover={false}>
            <h3 className="text-2xl font-bold mb-4">
              Switching from Another Tool?
            </h3>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              We make it easy to migrate from AudioEye, accessiBe, or any other
              accessibility tool. Import your existing scan data and start
              fixing issues immediately.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button>
                  Start Free Migration
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="secondary">Talk to Us</Button>
              </Link>
            </div>
          </Card>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="py-24 px-6 gradient-mesh">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Actually Fix Your Accessibility Issues?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Join developers who chose code fixes over band-aid overlays.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button size="lg">
                Start Free Today
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="secondary" size="lg">
                Explore Features
              </Button>
            </Link>
          </div>
          <p className="text-sm text-text-muted mt-6">
            Free forever plan available. No credit card required.
          </p>
        </div>
      </section>
    </>
  );
}
