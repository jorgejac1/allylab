// English language pack for AllyLab website
export const en = {
  // Site metadata
  site: {
    name: "AllyLab",
    tagline: "AI-Powered Accessibility Scanner",
    description:
      "Enterprise-grade web accessibility scanner with AI-powered fix suggestions. Scan for WCAG compliance, get code fixes, and create GitHub PRs or GitLab MRs automatically.",
  },

  // Navigation
  nav: {
    features: "Features",
    pricing: "Pricing",
    docs: "Docs",
    blog: "Blog",
    about: "About",
    contact: "Contact",
    login: "Log in",
    signup: "Sign up",
    getStarted: "Get Started",
    getEarlyAccess: "Get Early Access",
  },

  // Homepage
  home: {
    hero: {
      badge: "Now with WCAG 2.2 Support",
      title: "Accessibility Testing That",
      titleHighlight: "Actually Fixes",
      titleEnd: "Issues",
      description:
        "Stop just finding problems. AllyLab generates production-ready code fixes and creates GitHub PRs or GitLab MRs automatically. Fix accessibility issues in minutes, not days.",
      cta: {
        primary: "Get Early Access",
        secondary: "See How It Works",
      },
      trustSignals: {
        freePlan: "Free forever plan",
        noCard: "No credit card required",
        quickSetup: "Setup in 2 minutes",
      },
    },
    stats: {
      scans: "Page Scans",
      issues: "Issues Fixed",
      prs: "PRs Created",
      time: "Time Saved",
    },
    features: {
      title: "Everything You Need",
      description: "From scanning to fixing, all in one platform",
    },
    ai: {
      title: "AI-Powered Fix Generation",
      description:
        "Get production-ready code fixes tailored to your framework",
    },
    pricing: {
      label: "Pricing",
      title: "Simple, Transparent Pricing",
      description: "Start free, upgrade when you need more.",
      viewDetails: "View full pricing details →",
    },
    cta: {
      title: "Ready to Make Your Site Accessible?",
      description: "Start scanning in under 2 minutes. No credit card required.",
      primary: "Get Early Access",
      secondary: "Schedule Demo",
      trust: "Open Source • Self-Hostable • Enterprise Ready",
    },
  },

  // Features page
  features: {
    meta: {
      title: "Features - AllyLab",
      description:
        "Explore AllyLab's comprehensive accessibility scanning features including AI-powered fixes, GitHub & GitLab integration, and WCAG compliance tools.",
    },
    hero: {
      badge: "50+ Features",
      title: "Powerful Features for",
      titleHighlight: "Accessibility Excellence",
      description:
        "Everything you need to scan, fix, and monitor web accessibility at scale. From automated scanning to AI-powered remediation.",
      cta: {
        primary: "Start Free Trial",
        secondary: "Read Documentation",
      },
    },
    scanning: {
      title: "Comprehensive Scanning",
      subtitle: "WCAG 2.0, 2.1, 2.2 Support",
      description:
        "Enterprise-grade accessibility scanning powered by axe-core, the industry-leading testing engine used by Microsoft, Google, and thousands of organizations.",
      items: [
        "Single page and multi-page site crawling",
        "Multi-viewport testing (Desktop, Tablet, Mobile)",
        "Real-time streaming results via SSE",
        "Configurable crawl depth and page limits",
        "Automatic sitemap detection",
        "Section 508 compliance support",
      ],
    },
    aiFixes: {
      title: "AI-Powered Fixes",
      subtitle: "Powered by Claude AI",
      description:
        "Stop spending hours researching WCAG criteria. Get production-ready code fixes tailored to your specific codebase and framework.",
      items: [
        "Framework-specific code (HTML, React, Vue)",
        "Confidence scores and effort estimates",
        "Context-aware suggestions",
        "WCAG criteria explanations",
        "One-click PR creation",
        "Fix verification after merge",
      ],
    },
    github: {
      title: "GitHub & GitLab Integration",
      subtitle: "Streamlined Workflow",
      description:
        "Connect your repositories and create pull requests or merge requests with accessibility fixes directly from the dashboard. Supports batch fixes and automatic verification.",
      items: [
        "Automatic PR/MR creation with fixes",
        "Batch multiple fixes in single PR/MR",
        "Fix verification after merge",
        "GitHub.com and GitLab.com support",
        "Self-hosted Enterprise instances",
        "PR/MR status tracking",
      ],
    },
    reporting: {
      title: "Reporting & Analytics",
      subtitle: "Executive Dashboards",
      description:
        "Track accessibility progress with comprehensive dashboards, historical trends, and exportable reports for stakeholders.",
      items: [
        "Score trends over time",
        "Issue trends by severity",
        "Competitor benchmarking",
        "PDF reports for stakeholders",
        "CSV, JSON, Excel exports",
        "Period comparison analysis",
      ],
    },
    additional: {
      cicd: {
        title: "CI/CD Integration",
        description:
          "Integrate accessibility testing into your pipeline. Fail builds on critical issues with configurable thresholds.",
      },
      customRules: {
        title: "Custom Rules",
        description:
          "Create organization-specific accessibility rules with pattern matching, structure validation, and attribute checks.",
      },
      scheduling: {
        title: "Scheduled Scans",
        description:
          "Automate recurring scans hourly, daily, weekly, or monthly. Track improvements with historical data.",
      },
      notifications: {
        title: "Notifications",
        description:
          "Stay informed with Slack and Microsoft Teams integration. Rich formatting with Block Kit and Adaptive Cards.",
      },
      jira: {
        title: "JIRA Integration",
        description:
          "Export issues directly to JIRA with custom field mapping. Bulk creation supports up to 1,000 issues at once.",
      },
      issueTracking: {
        title: "Issue Tracking",
        description:
          "Automatic fingerprinting tracks issues across scans. See new, recurring, and fixed issues at a glance.",
      },
      cli: {
        title: "CLI Tool",
        description:
          "Full-featured command-line scanning with batch processing, watch mode, and multiple output formats including HTML and SARIF.",
      },
      benchmarking: {
        title: "Competitor Benchmarking",
        description:
          "Compare your accessibility scores against competitors. Track relative position and improvements over time.",
      },
      watchMode: {
        title: "Watch Mode",
        description:
          "Continuously monitor URLs at configurable intervals. Get notified only when accessibility scores change.",
      },
      batchScanning: {
        title: "Batch Scanning",
        description:
          "Scan multiple URLs from a file with configurable concurrency. Perfect for large sites and staging environments.",
      },
      configSystem: {
        title: "Configuration System",
        description:
          "Flexible configuration via files, environment variables, or CLI flags. Share settings across your team.",
      },
      htmlReports: {
        title: "HTML Reports",
        description:
          "Generate standalone HTML reports that can be shared without any dependencies. Perfect for stakeholder reviews.",
      },
    },
    frameworks: {
      title: "Framework-Specific Code",
      description: "Get fixes in the language and framework you actually use",
      html: { name: "HTML", description: "Clean, semantic markup" },
      react: { name: "React", description: "JSX with ARIA attributes" },
      vue: { name: "Vue", description: "Template syntax bindings" },
      svelte: { name: "Svelte", description: "Component bindings" },
    },
    exports: {
      title: "Export in Any Format",
      pdf: { label: "PDF Reports", desc: "For stakeholders" },
      html: { label: "HTML", desc: "Standalone reports" },
      sarif: { label: "SARIF", desc: "GitHub Code Scanning" },
      json: { label: "JSON", desc: "For integrations" },
      excel: { label: "Excel", desc: "For analysis" },
      csv: { label: "CSV", desc: "For spreadsheets" },
    },
    comparison: {
      title: "Beyond Traditional Scanners",
      description: "See how AllyLab compares to other accessibility tools",
      allylab: "AllyLab",
      traditional: "Traditional Tools",
    },
    cta: {
      title: "Ready to Try These Features?",
      description:
        "Start your free trial today and scan your first site in under 2 minutes. No credit card required.",
      primary: "Start Free Trial",
      secondary: "View Pricing",
      trust: "✓ Free tier available  ✓ No credit card required  ✓ Cancel anytime",
    },
  },

  // Pricing page
  pricing: {
    meta: {
      title: "Pricing - AllyLab",
      description:
        "Simple, transparent pricing for AllyLab. Start free, upgrade as you grow. Save thousands compared to traditional accessibility tools.",
    },
    hero: {
      badge: "Simple Pricing",
      title: "Start Free, Scale as You Grow",
      description: "No hidden fees. No long-term contracts. Cancel anytime.",
      savings: "Save up to 70% compared to AudioEye, accessiBe, and other tools.",
    },
    plans: {
      free: {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for individual developers and small projects",
        cta: "Get Started Free",
      },
      pro: {
        name: "Pro",
        price: "$49",
        period: "/month",
        description: "For teams serious about accessibility compliance",
        cta: "Start Free Trial",
        popular: "Most Popular",
      },
      team: {
        name: "Team",
        price: "$149",
        period: "/month",
        description: "For growing teams managing multiple properties",
        cta: "Start Free Trial",
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For organizations with advanced security and compliance needs",
        cta: "Contact Sales",
      },
    },
    comparison: {
      title: "How AllyLab Stacks Up",
      description: "See why teams choose AllyLab over traditional accessibility tools",
    },
    savings: {
      title: "Calculate Your Savings",
      description:
        "Companies using AllyLab save an average of $8,400/year compared to AudioEye and similar tools.",
      note: "Plus, AllyLab includes AI code fixes and GitHub/GitLab integration that others charge extra for or don't offer at all.",
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Everything you need to know about AllyLab pricing",
      items: [
        {
          q: "Can I try AllyLab before purchasing?",
          a: "Yes! Our Free plan is available forever with no credit card required. Pro and Team plans include a 14-day free trial.",
        },
        {
          q: "What happens if I exceed my scan limits?",
          a: "On the Free plan, you'll need to wait until the next month or upgrade. Paid plans have unlimited scans.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Absolutely. No long-term contracts. Cancel anytime and you'll retain access until the end of your billing period.",
        },
        {
          q: "Do you offer discounts for nonprofits or education?",
          a: "Yes! We offer 50% off for registered nonprofits, educational institutions, and open-source projects. Contact us to apply.",
        },
        {
          q: "What's included in the self-hosted option?",
          a: "Enterprise customers can deploy AllyLab on their own infrastructure for complete data control. Includes setup support and updates.",
        },
        {
          q: "How does AllyLab compare to overlay solutions?",
          a: "Unlike overlays that mask issues, AllyLab helps you actually fix your code. Our AI generates real code changes that permanently resolve accessibility issues.",
        },
      ],
    },
    cta: {
      title: "Ready to Fix Accessibility Issues?",
      description: "Start free today. No credit card required.",
      primary: "Get Early Access",
      secondary: "Talk to Sales",
    },
  },

  // Compare page
  compare: {
    meta: {
      title: "AllyLab vs Competitors - Why Choose AllyLab",
      description:
        "Compare AllyLab to AudioEye, accessiBe, UserWay, and Deque. See why developers choose AllyLab for AI-powered accessibility fixes.",
    },
    hero: {
      badge: "Compare",
      title: "Why Teams Choose",
      titleHighlight: "AllyLab",
      description:
        "Unlike tools that just identify problems or overlays that mask them, AllyLab generates production-ready code fixes and creates GitHub PRs or GitLab MRs automatically.",
      cta: {
        primary: "Try AllyLab Free",
        secondary: "View Pricing",
      },
    },
    differentiators: {
      title: "Fix Issues, Don't Mask Them",
      description: "Here's what sets AllyLab apart from every other accessibility tool",
      items: {
        realFixes: {
          title: "Real Code Fixes",
          description:
            "We generate actual code changes that permanently fix accessibility issues. No overlays, no band-aids—real solutions.",
        },
        aiPowered: {
          title: "AI-Powered Intelligence",
          description:
            "Our AI understands your codebase and generates framework-specific fixes for React, Vue, Angular, and vanilla HTML.",
        },
        githubNative: {
          title: "Git-Native Workflow",
          description:
            "Create GitHub PRs or GitLab MRs with one click. Review diffs, merge fixes, and verify they worked—all from one platform.",
        },
        affordable: {
          title: "Actually Affordable",
          description:
            "Start free forever. Pro plans cost less than competitors while offering more features. No enterprise-only gotchas.",
        },
        selfHost: {
          title: "Self-Host Option",
          description:
            "Keep your data on your infrastructure. Perfect for enterprises with strict security requirements.",
        },
        devFirst: {
          title: "Developer-First Design",
          description:
            "Built by developers, for developers. CLI tools, CI/CD integration, and API access on all plans.",
        },
      },
    },
    overlayProblems: {
      title: "Why Overlay Solutions Fall Short",
      description:
        "Tools like accessiBe, UserWay, and AudioEye's widget approach have fundamental limitations",
      items: {
        noFix: {
          title: "Overlays Don't Fix Your Code",
          description:
            "Overlay widgets inject JavaScript to modify how your site appears, but your actual HTML remains inaccessible. This creates technical debt and doesn't address the root cause.",
        },
        legal: {
          title: "Limited Legal Protection",
          description:
            "Despite marketing claims, overlay solutions have been named in numerous accessibility lawsuits. The DOJ has stated overlays don't ensure compliance.",
        },
        performance: {
          title: "Performance Impact",
          description:
            "Overlays add JavaScript that runs on every page load, slowing down your site and potentially conflicting with your existing code.",
        },
        opposition: {
          title: "Accessibility Community Opposition",
          description:
            "Major accessibility advocates and organizations have spoken out against overlays, with some users specifically blocking them with browser extensions.",
        },
      },
      note: "AllyLab takes a different approach: we help you fix your actual code so your site is genuinely accessible, not just appears to be.",
    },
    migration: {
      title: "Switching from Another Tool?",
      description:
        "We make it easy to migrate from AudioEye, accessiBe, or any other accessibility tool. Import your existing scan data and start fixing issues immediately.",
      cta: {
        primary: "Start Free Migration",
        secondary: "Talk to Us",
      },
    },
    cta: {
      title: "Ready to Actually Fix Your Accessibility Issues?",
      description: "Join developers who chose code fixes over band-aid overlays.",
      primary: "Start Free Today",
      secondary: "Explore Features",
      trust: "Free forever plan available. No credit card required.",
    },
  },

  // Roadmap page
  roadmap: {
    meta: {
      title: "Roadmap - AllyLab",
      description:
        "See what's coming next for AllyLab. Our public roadmap of planned features and improvements.",
    },
    hero: {
      title: "Product",
      titleHighlight: "Roadmap",
      description:
        "See what we're working on and what's coming next. Your feedback shapes our priorities.",
    },
    sections: {
      completed: "Recently Completed",
      inProgress: "In Progress",
      plannedQ1: "Planned - Q1 2025",
      plannedQ2: "Planned - Q2 2025",
      future: "Future Ideas",
    },
    feedback: {
      title: "Have a Feature Request?",
      description:
        "We'd love to hear what features would help your team. Your feedback directly influences our roadmap.",
      cta: {
        primary: "Submit Feedback",
        secondary: "GitHub Issues",
      },
    },
  },

  // About page
  about: {
    meta: {
      title: "About - AllyLab",
      description:
        "Learn about AllyLab's mission to make the web accessible for everyone through AI-powered accessibility tools.",
    },
    hero: {
      title: "Making the Web",
      titleHighlight: "Accessible",
      description:
        "We believe everyone deserves equal access to the web. AllyLab makes accessibility achievable for development teams of all sizes.",
    },
    mission: {
      title: "Our Mission",
      description:
        "To democratize web accessibility by providing AI-powered tools that don't just find problems—they fix them.",
    },
    values: {
      title: "Our Values",
      items: {
        openSource: {
          title: "Open Source First",
          description:
            "Transparency builds trust. Our core scanning engine is open source, allowing anyone to verify, contribute, or self-host.",
        },
        devFocused: {
          title: "Developer Focused",
          description:
            "Built by developers, for developers. We prioritize tools that integrate into existing workflows—CLI, CI/CD, GitHub PRs, GitLab MRs.",
        },
        realFixes: {
          title: "Real Solutions",
          description:
            "No overlays, no band-aids. We generate actual code fixes that permanently resolve accessibility issues.",
        },
        accessible: {
          title: "Accessibility for All",
          description:
            "Our generous free tier ensures that budget constraints never prevent teams from building accessible products.",
        },
      },
    },
    story: {
      title: "Our Story",
      content:
        "AllyLab was born from frustration. After spending countless hours manually researching WCAG criteria and writing accessibility fixes, we realized there had to be a better way. What if AI could generate those fixes automatically? What if creating a PR was just one click away? That's AllyLab.",
    },
    cta: {
      title: "Join Us in Making the Web Accessible",
      description: "Start scanning your first site today—it's free.",
      primary: "Get Started Free",
      secondary: "View Open Source",
    },
  },

  // Contact page
  contact: {
    meta: {
      title: "Contact - AllyLab",
      description:
        "Get in touch with the AllyLab team. We're here to help with sales, support, and partnership inquiries.",
    },
    hero: {
      title: "Get in Touch",
      description:
        "Have questions about AllyLab? Want to discuss enterprise needs? We'd love to hear from you.",
    },
    form: {
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "you@company.com",
      company: "Company",
      companyPlaceholder: "Your company (optional)",
      subject: "Subject",
      subjectPlaceholder: "What can we help with?",
      message: "Message",
      messagePlaceholder: "Tell us more about your needs...",
      submit: "Send Message",
      submitting: "Sending...",
      success: "Thanks! We'll be in touch soon.",
    },
    options: {
      title: "Or reach us directly",
      email: "Email us",
      github: "GitHub Issues",
      twitter: "Twitter/X",
    },
    enterprise: {
      title: "Enterprise Inquiries",
      description:
        "Need SSO, self-hosting, or custom integrations? Let's talk about how AllyLab can work for your organization.",
      cta: "Schedule a Call",
    },
  },

  // Docs page
  docs: {
    meta: {
      title: "Documentation - AllyLab",
      description:
        "Learn how to use AllyLab with our comprehensive documentation. Get started with scanning, AI fixes, and integrations.",
    },
    hero: {
      title: "Documentation",
      description: "Everything you need to get started with AllyLab",
    },
    sections: {
      gettingStarted: {
        title: "Getting Started",
        items: [
          { title: "Installation", description: "Set up AllyLab in minutes" },
          { title: "First Scan", description: "Scan your first page" },
          { title: "Understanding Results", description: "Interpret scan findings" },
        ],
      },
      features: {
        title: "Core Features",
        items: [
          { title: "AI Fixes", description: "Generate code fixes with AI" },
          { title: "GitHub & GitLab", description: "Create PRs/MRs automatically" },
          { title: "Custom Rules", description: "Define your own rules" },
        ],
      },
      integrations: {
        title: "Integrations",
        items: [
          { title: "GitHub & GitLab", description: "Connect your repositories" },
          { title: "JIRA", description: "Export to JIRA" },
          { title: "Slack", description: "Get notifications" },
        ],
      },
      cli: {
        title: "CLI Reference",
        items: [
          { title: "scan", description: "Scan a single page" },
          { title: "site", description: "Crawl an entire site" },
          { title: "batch", description: "Scan multiple URLs" },
          { title: "watch", description: "Monitor continuously" },
        ],
      },
      api: {
        title: "API Reference",
        description: "Full API documentation for developers",
      },
    },
  },

  // Blog page
  blog: {
    meta: {
      title: "Blog - AllyLab",
      description:
        "Accessibility insights, tutorials, and updates from the AllyLab team.",
    },
    hero: {
      title: "Blog",
      description: "Accessibility insights, tutorials, and product updates",
    },
    categories: {
      all: "All Posts",
      tutorials: "Tutorials",
      updates: "Product Updates",
      accessibility: "Accessibility",
    },
    empty: "No posts yet. Check back soon!",
  },

  // Footer
  footer: {
    description:
      "Enterprise-grade web accessibility scanner with AI-powered fix suggestions.",
    sections: {
      product: {
        title: "Product",
        links: ["Features", "Pricing", "Changelog", "Roadmap"],
      },
      resources: {
        title: "Resources",
        links: ["Documentation", "API Reference", "CLI Guide", "Blog"],
      },
      company: {
        title: "Company",
        links: ["About", "Contact", "Privacy", "Terms"],
      },
    },
    copyright: "© {year} AllyLab. All rights reserved.",
    madeWith: "Made with ♥ for accessibility",
  },

  // Common/Shared
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try again",
    learnMore: "Learn more",
    viewAll: "View all",
    new: "NEW",
    comingSoon: "Coming soon",
    beta: "Beta",
    deprecated: "Deprecated",
    yes: "Yes",
    no: "No",
    or: "or",
    and: "and",
  },

  // Accessibility labels
  a11y: {
    skipToContent: "Skip to main content",
    skipToNav: "Skip to navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    externalLink: "Opens in new tab",
    loading: "Loading content",
  },
} as const;

export type Translations = typeof en;
