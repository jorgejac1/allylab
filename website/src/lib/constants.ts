// Site configuration constants
export const siteConfig = {
  name: "AllyLab",
  description: "Enterprise-grade web accessibility scanner with AI-powered fix suggestions",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://allylab.io",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173",
  github: "https://github.com/jorgejac1/allylab",
  twitter: "@allylab",

  links: {
    // Use relative paths for now until production deployment
    signup: "/contact", // Redirect to contact until auth is ready
    login: "/contact", // Redirect to contact until auth is ready
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173",
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
    description: "Enterprise-grade web accessibility scanner with AI-powered fix suggestions. Scan for WCAG compliance, get code fixes, and create GitHub PRs or GitLab MRs automatically.",
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