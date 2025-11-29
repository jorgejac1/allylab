// Site configuration constants
export const siteConfig = {
  name: "AllyLab",
  description: "Enterprise-grade web accessibility scanner with AI-powered fix suggestions",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://allylab.io",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.allylab.io",
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.allylab.io",
  github: "https://github.com/jorgejac1/allylab",
  twitter: "@allylab",
  
  links: {
    signup: `${process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.allylab.io"}/signup`,
    login: `${process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.allylab.io"}/login`,
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.allylab.io",
    docs: "/docs",
    pricing: "/pricing",
    blog: "/blog",
    contact: "/contact",
    github: "https://github.com/jorgejac1/allylab",
    twitter: "https://twitter.com/allylab",
    linkedin: "https://linkedin.com/company/allylab",
  },
  
  // SEO defaults
  seo: {
    title: "AllyLab - AI-Powered Accessibility Scanner",
    titleTemplate: "%s | AllyLab",
    description: "Enterprise-grade web accessibility scanner with AI-powered fix suggestions. Scan for WCAG compliance, get code fixes, and create GitHub PRs automatically.",
    keywords: [
      "accessibility",
      "a11y",
      "WCAG",
      "accessibility scanner",
      "accessibility testing",
      "web accessibility",
      "ADA compliance",
      "Section 508",
      "axe-core",
      "AI accessibility",
    ],
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "AllyLab",
    },
    twitter: {
      card: "summary_large_image",
      site: "@allylab",
      creator: "@allylab",
    },
  },
};

// Navigation links
export const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

// Footer links
export const footerLinks = {
  product: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/changelog", label: "Changelog" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/docs#api-reference", label: "API Reference" },
    { href: "/docs#cli", label: "CLI Guide" },
    { href: "/blog", label: "Blog" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};