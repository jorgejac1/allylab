import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BlogPostJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/constants";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, ArrowRight } from "lucide-react";

// Blog post content database
const blogPosts: Record<string, {
  title: string;
  description: string;
  date: string;
  dateISO: string;
  author: string;
  readTime: string;
  tags: string[];
  content: React.ReactNode;
}> = {
  "wcag-2-2-guide": {
    title: "WCAG 2.2: Everything You Need to Know",
    description: "WCAG 2.2 introduces 9 new success criteria focused on cognitive disabilities and mobile accessibility. Here's what developers need to know.",
    date: "January 15, 2025",
    dateISO: "2025-01-15",
    author: "AllyLab Team",
    readTime: "12 min read",
    tags: ["WCAG", "Guide", "Accessibility"],
    content: (
      <>
        <p className="text-lg text-text-secondary mb-6">
          The Web Content Accessibility Guidelines (WCAG) 2.2 was officially published as a W3C Recommendation on October 5, 2023. This update brings 9 new success criteria that address gaps in the previous version, particularly for users with cognitive disabilities and those using mobile devices.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">What&apos;s New in WCAG 2.2</h2>
        <p className="text-text-secondary mb-6">
          WCAG 2.2 adds 9 new success criteria to the existing framework. These additions focus on three main areas: improving experiences for users with cognitive or learning disabilities, addressing mobile accessibility challenges, and enhancing authentication processes.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">1. Focus Not Obscured (Minimum) - Level AA</h3>
        <p className="text-text-secondary mb-4">
          When an element receives keyboard focus, it must not be entirely hidden by author-created content. This prevents situations where sticky headers or footers completely obscure the focused element.
        </p>
        <div className="bg-surface-secondary border border-border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-2">How to test:</p>
          <p className="text-text-muted text-sm">Tab through your page and ensure the focused element is always at least partially visible, even with sticky headers or modal dialogs.</p>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-3">2. Focus Not Obscured (Enhanced) - Level AAA</h3>
        <p className="text-text-secondary mb-4">
          The enhanced version requires that no part of the focused element is hidden. This is a stricter requirement than the minimum level.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">3. Focus Appearance - Level AAA</h3>
        <p className="text-text-secondary mb-4">
          Focus indicators must have sufficient size and contrast. The focus indicator area must be at least as large as a 2px thick perimeter of the unfocused element.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">4. Dragging Movements - Level AA</h3>
        <p className="text-text-secondary mb-4">
          Any functionality that uses dragging must have an alternative that doesn&apos;t require dragging. This helps users with motor impairments who may struggle with drag-and-drop interfaces.
        </p>
        <div className="bg-surface-secondary border border-border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-2">Example fix:</p>
          <p className="text-text-muted text-sm">For a drag-and-drop file upload, also provide a button-based file picker. For sortable lists, add up/down buttons alongside drag handles.</p>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-3">5. Target Size (Minimum) - Level AA</h3>
        <p className="text-text-secondary mb-4">
          Interactive targets must be at least 24×24 CSS pixels, unless the target is inline text, has user agent styling, or meets specific spacing requirements.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">6. Consistent Help - Level A</h3>
        <p className="text-text-secondary mb-4">
          If help mechanisms (contact info, self-help options, chatbots) are provided on multiple pages, they must appear in the same relative order on each page.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">7. Redundant Entry - Level A</h3>
        <p className="text-text-secondary mb-4">
          Don&apos;t require users to re-enter information they&apos;ve already provided in the same process. Either auto-populate fields or allow users to select previously entered information.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">8. Accessible Authentication (Minimum) - Level AA</h3>
        <p className="text-text-secondary mb-4">
          Authentication processes must not require cognitive function tests (like remembering passwords or solving puzzles) unless alternatives are provided.
        </p>
        <div className="bg-surface-secondary border border-border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-2">Compliant alternatives:</p>
          <ul className="text-text-muted text-sm list-disc pl-4 space-y-1">
            <li>Password managers (copy/paste support)</li>
            <li>Biometric authentication</li>
            <li>Email/SMS magic links</li>
            <li>OAuth/social login</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-3">9. Accessible Authentication (Enhanced) - Level AAA</h3>
        <p className="text-text-secondary mb-4">
          The enhanced level removes the exception for object recognition and personal content, requiring even more accessible authentication methods.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">What Was Removed?</h2>
        <p className="text-text-secondary mb-6">
          WCAG 2.2 removes success criterion 4.1.1 Parsing. This criterion was deemed obsolete because modern browsers handle parsing errors gracefully, and HTML validators now catch these issues during development.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">How AllyLab Helps</h2>
        <p className="text-text-secondary mb-6">
          AllyLab fully supports WCAG 2.2 testing. Our scanner checks for all 9 new success criteria and provides AI-powered fix suggestions tailored to your codebase. Here&apos;s how to get started:
        </p>
        <ol className="list-decimal pl-6 text-text-secondary space-y-2 mb-6">
          <li>Select WCAG 2.2 AA as your testing standard in scan settings</li>
          <li>Run a scan on your site</li>
          <li>Review issues grouped by the new criteria</li>
          <li>Generate AI fixes for each issue</li>
          <li>Create GitHub PRs with one click</li>
        </ol>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">Ready to test for WCAG 2.2?</h3>
          <p className="text-text-secondary text-sm mb-4">
            Start scanning your site for WCAG 2.2 compliance today. AllyLab&apos;s AI will help you fix issues faster than ever.
          </p>
          <Link href="/contact">
            <Button size="sm">Start Free Trial</Button>
          </Link>
        </div>
      </>
    ),
  },
  "ai-accessibility-testing": {
    title: "How AI is Transforming Accessibility Testing",
    description: "Discover how AI-powered tools are changing the game for accessibility remediation and making the web more inclusive.",
    date: "January 10, 2025",
    dateISO: "2025-01-10",
    author: "AllyLab Team",
    readTime: "8 min read",
    tags: ["AI", "Accessibility", "Machine Learning"],
    content: (
      <>
        <p className="text-lg text-text-secondary mb-6">
          Accessibility testing has traditionally been a manual, time-consuming process. While automated scanners can detect issues, fixing them still required developers to research WCAG criteria and write remediation code. AI is changing this paradigm entirely.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">The Problem with Traditional Approaches</h2>
        <p className="text-text-secondary mb-6">
          Traditional accessibility tools excel at finding problems but fall short when it comes to fixing them. A typical workflow looks like this:
        </p>
        <ol className="list-decimal pl-6 text-text-secondary space-y-2 mb-6">
          <li>Run an automated scan (2 minutes)</li>
          <li>Export results to spreadsheet (5 minutes)</li>
          <li>Research each WCAG criterion (30-60 minutes per issue)</li>
          <li>Write fix code (15-30 minutes per issue)</li>
          <li>Test the fix (10-15 minutes per issue)</li>
          <li>Repeat for dozens or hundreds of issues</li>
        </ol>
        <p className="text-text-secondary mb-6">
          For a site with 50 accessibility issues, this process can take weeks of developer time. And that&apos;s assuming the developer has accessibility expertise.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">How AI Changes Everything</h2>
        <p className="text-text-secondary mb-6">
          Modern large language models (LLMs) like Claude have been trained on vast amounts of accessibility documentation, WCAG criteria, and code examples. This enables them to:
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li><strong>Understand context:</strong> AI can analyze the surrounding HTML and determine the purpose of an element</li>
          <li><strong>Generate appropriate fixes:</strong> Instead of generic suggestions, AI produces code that fits your specific situation</li>
          <li><strong>Explain the &quot;why&quot;:</strong> AI can articulate why a fix works, helping developers learn</li>
          <li><strong>Adapt to frameworks:</strong> The same issue gets different fixes for React, Vue, or plain HTML</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Real-World Examples</h2>

        <h3 className="text-xl font-semibold mt-8 mb-3">Example 1: Missing Alt Text</h3>
        <p className="text-text-secondary mb-4">
          Traditional tools say: &quot;Image missing alt attribute&quot;
        </p>
        <p className="text-text-secondary mb-4">
          AI says: &quot;This appears to be a product image of a laptop. Suggested alt text: &apos;MacBook Pro 14-inch laptop with silver finish, viewed from front angle&apos;&quot;
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">Example 2: Color Contrast</h3>
        <p className="text-text-secondary mb-4">
          Traditional tools say: &quot;Color contrast ratio is 3.2:1, required 4.5:1&quot;
        </p>
        <p className="text-text-secondary mb-4">
          AI says: &quot;Change the text color from #888888 to #6B6B6B to achieve 4.5:1 contrast while maintaining visual similarity to your design system&quot;
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">The AllyLab Approach</h2>
        <p className="text-text-secondary mb-6">
          AllyLab combines the speed of automated scanning with the intelligence of AI fix generation. Here&apos;s how it works:
        </p>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { step: "1", title: "Scan", desc: "Automated detection finds all issues in seconds" },
            { step: "2", title: "Analyze", desc: "AI examines each issue in context" },
            { step: "3", title: "Fix", desc: "One-click PRs deploy fixes to your repo" },
          ].map((item) => (
            <div key={item.step} className="bg-surface-secondary border border-border rounded-xl p-4">
              <div className="w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center font-bold mb-3">
                {item.step}
              </div>
              <h4 className="font-semibold mb-1">{item.title}</h4>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Confidence Scores: Knowing When to Trust AI</h2>
        <p className="text-text-secondary mb-6">
          Not all AI suggestions are equal. AllyLab provides confidence scores for each fix:
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li><strong>High confidence (90%+):</strong> Simple, well-understood fixes like adding alt text or form labels. Safe to apply directly.</li>
          <li><strong>Medium confidence (70-89%):</strong> More complex fixes that may need minor adjustments. Review before applying.</li>
          <li><strong>Low confidence (&lt;70%):</strong> Complex cases requiring human judgment. Use as a starting point.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">The Future of AI in Accessibility</h2>
        <p className="text-text-secondary mb-6">
          We&apos;re only at the beginning. Future developments will include:
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li>Automatic alt text generation from image analysis</li>
          <li>Component-level fixes that propagate across your entire design system</li>
          <li>Predictive accessibility—catching issues before they&apos;re deployed</li>
          <li>Natural language accessibility audits (&quot;Is this page accessible?&quot;)</li>
        </ul>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">Experience AI-powered accessibility</h3>
          <p className="text-text-secondary text-sm mb-4">
            See how AI can cut your accessibility remediation time by 80%. Try AllyLab free today.
          </p>
          <Link href="/contact">
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>
      </>
    ),
  },
  "cicd-accessibility": {
    title: "Integrating Accessibility Testing into CI/CD",
    description: "Learn how to catch accessibility issues before they reach production by integrating automated testing into your deployment pipeline.",
    date: "January 5, 2025",
    dateISO: "2025-01-05",
    author: "AllyLab Team",
    readTime: "6 min read",
    tags: ["CI/CD", "DevOps", "Automation"],
    content: (
      <>
        <p className="text-lg text-text-secondary mb-6">
          The best time to catch accessibility issues is before they reach production. By integrating accessibility testing into your CI/CD pipeline, you can prevent regressions and ensure every deployment maintains your accessibility standards.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Why CI/CD Integration Matters</h2>
        <p className="text-text-secondary mb-6">
          Manual accessibility audits are valuable but infrequent. A typical organization might audit quarterly, leaving months where new issues can accumulate. CI/CD integration provides:
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li><strong>Immediate feedback:</strong> Know about issues within minutes of committing code</li>
          <li><strong>Prevention:</strong> Block merges that introduce accessibility regressions</li>
          <li><strong>Documentation:</strong> Every scan result is logged for compliance records</li>
          <li><strong>Developer education:</strong> Engineers learn accessibility through real feedback</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Setting Up AllyLab CLI</h2>
        <p className="text-text-secondary mb-4">
          First, install the AllyLab CLI in your project:
        </p>
        <pre className="bg-surface-secondary border border-border rounded-xl p-4 overflow-x-auto mb-6">
          <code className="text-sm text-text-secondary">npm install -D @allylab/cli</code>
        </pre>

        <h2 className="text-2xl font-bold mt-10 mb-4">GitHub Actions Example</h2>
        <pre className="bg-surface-secondary border border-border rounded-xl p-4 overflow-x-auto mb-6">
          <code className="text-sm text-text-secondary">{`name: Accessibility
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  a11y-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npm run build

      - name: Start server
        run: npm run start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run accessibility scan
        run: |
          npx @allylab/cli scan http://localhost:3000 \\
            --standard wcag21aa \\
            --fail-on serious \\
            --format sarif \\
            --output results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif`}</code>
        </pre>

        <h2 className="text-2xl font-bold mt-10 mb-4">GitLab CI Example</h2>
        <pre className="bg-surface-secondary border border-border rounded-xl p-4 overflow-x-auto mb-6">
          <code className="text-sm text-text-secondary">{`accessibility:
  stage: test
  image: node:20
  services:
    - name: your-app:$CI_COMMIT_SHA
      alias: app
  script:
    - npm install -g @allylab/cli
    - allylab scan http://app:3000
        --fail-on critical
        --format json
        --output a11y-report.json
  artifacts:
    reports:
      accessibility: a11y-report.json
    when: always`}</code>
        </pre>

        <h2 className="text-2xl font-bold mt-10 mb-4">Configuring Failure Thresholds</h2>
        <p className="text-text-secondary mb-4">
          The <code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-sm">--fail-on</code> flag controls when your build fails:
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li><code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-sm">--fail-on critical</code>: Only fail on critical issues (strictest threshold)</li>
          <li><code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-sm">--fail-on serious</code>: Fail on critical and serious issues</li>
          <li><code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-sm">--fail-on moderate</code>: Fail on critical, serious, and moderate</li>
          <li><code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-sm">--fail-on minor</code>: Fail on any issue</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Best Practices</h2>
        <div className="space-y-4 mb-6">
          {[
            { title: "Start permissive", desc: "Begin with --fail-on critical and gradually increase strictness as you fix existing issues." },
            { title: "Scan staging environments", desc: "Test against deployed preview environments rather than localhost for more realistic results." },
            { title: "Use SARIF for GitHub", desc: "SARIF format integrates with GitHub's security tab for inline annotations on PRs." },
            { title: "Cache dependencies", desc: "The CLI installs Playwright browsers. Cache these to speed up builds." },
            { title: "Run on PR and main", desc: "Catch issues in PRs and verify main stays clean after merge." },
          ].map((item) => (
            <div key={item.title} className="bg-surface-secondary border border-border rounded-xl p-4">
              <h4 className="font-semibold mb-1">{item.title}</h4>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">Need help setting up CI/CD?</h3>
          <p className="text-text-secondary text-sm mb-4">
            Our docs include examples for GitHub Actions, GitLab CI, Jenkins, and more. Or contact us for hands-on help.
          </p>
          <div className="flex gap-3">
            <Link href="/docs">
              <Button size="sm" variant="secondary">Read Docs</Button>
            </Link>
            <Link href="/contact">
              <Button size="sm">Contact Us</Button>
            </Link>
          </div>
        </div>
      </>
    ),
  },
  "color-contrast-guide": {
    title: "Color Contrast: A Developer's Complete Guide",
    description: "Everything you need to know about WCAG color contrast requirements, testing tools, and techniques for meeting accessibility standards.",
    date: "December 28, 2024",
    dateISO: "2024-12-28",
    author: "AllyLab Team",
    readTime: "10 min read",
    tags: ["Design", "WCAG", "Color"],
    content: (
      <>
        <p className="text-lg text-text-secondary mb-6">
          Color contrast is one of the most common accessibility issues on the web. It affects users with low vision, color blindness, and anyone viewing a screen in bright sunlight. Understanding and implementing proper contrast is essential for accessible design.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Understanding Contrast Ratios</h2>
        <p className="text-text-secondary mb-6">
          WCAG defines contrast ratio as the relative luminance of the lighter color divided by the relative luminance of the darker color, resulting in a ratio from 1:1 (no contrast) to 21:1 (maximum contrast, black on white).
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-3">WCAG Requirements</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 font-semibold">Text Type</th>
                <th className="py-3 px-4 font-semibold">Level AA</th>
                <th className="py-3 px-4 font-semibold">Level AAA</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border">
                <td className="py-3 px-4">Normal text (&lt;18pt)</td>
                <td className="py-3 px-4">4.5:1</td>
                <td className="py-3 px-4">7:1</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4">Large text (≥18pt or 14pt bold)</td>
                <td className="py-3 px-4">3:1</td>
                <td className="py-3 px-4">4.5:1</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4">UI components & graphics</td>
                <td className="py-3 px-4">3:1</td>
                <td className="py-3 px-4">3:1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Common Contrast Mistakes</h2>
        <div className="space-y-4 mb-6">
          {[
            {
              title: "Light gray on white",
              bad: "#999999 on #FFFFFF (2.8:1)",
              good: "#6B6B6B on #FFFFFF (5.0:1)"
            },
            {
              title: "Placeholder text",
              bad: "#CCCCCC on #FFFFFF (1.6:1)",
              good: "#757575 on #FFFFFF (4.6:1)"
            },
            {
              title: "Disabled states",
              bad: "Note: Disabled elements are exempt from contrast requirements, but still consider usability"
            },
          ].map((item) => (
            <div key={item.title} className="bg-surface-secondary border border-border rounded-xl p-4">
              <h4 className="font-semibold mb-2">{item.title}</h4>
              {item.bad && item.good ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg">
                    <span className="text-accent-red font-medium">Fail:</span> {item.bad}
                  </div>
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <span className="text-primary font-medium">Pass:</span> {item.good}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">{item.bad}</p>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Fixing Contrast Issues</h2>
        <p className="text-text-secondary mb-4">
          When AllyLab detects a contrast issue, it provides specific recommendations:
        </p>
        <pre className="bg-surface-secondary border border-border rounded-xl p-4 overflow-x-auto mb-6">
          <code className="text-sm text-text-secondary">{`/* Before: 3.2:1 contrast ratio - FAIL */
.muted-text {
  color: #888888;
}

/* After: 4.6:1 contrast ratio - PASS */
.muted-text {
  color: #6B6B6B;
}`}</code>
        </pre>

        <h2 className="text-2xl font-bold mt-10 mb-4">Tools for Testing Contrast</h2>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li><strong>AllyLab Scanner:</strong> Automatically checks all text contrast on your pages</li>
          <li><strong>Browser DevTools:</strong> Chrome and Firefox show contrast ratios in the color picker</li>
          <li><strong>WebAIM Contrast Checker:</strong> Manual testing for specific color combinations</li>
          <li><strong>Figma plugins:</strong> Stark, Contrast, and others for design-time testing</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Dark Mode Considerations</h2>
        <p className="text-text-secondary mb-6">
          Dark mode introduces unique contrast challenges. Light text on dark backgrounds can actually be harder to read at high contrast ratios due to &quot;halation&quot; (light bleeding into dark areas).
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-6">
          <li>Don&apos;t use pure white (#FFFFFF) on pure black (#000000)</li>
          <li>Aim for slightly reduced contrast in dark mode (e.g., #E0E0E0 on #1A1A1A)</li>
          <li>Test with users who actually use dark mode</li>
        </ul>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">Scan your site for contrast issues</h3>
          <p className="text-text-secondary text-sm mb-4">
            AllyLab automatically detects all color contrast violations and provides AI-generated CSS fixes. Try it free.
          </p>
          <Link href="/contact">
            <Button size="sm">Start Free Scan</Button>
          </Link>
        </div>
      </>
    ),
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} - AllyLab Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.dateISO,
      authors: [post.author],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  const postUrl = `${siteConfig.url}/blog/${slug}`;

  return (
    <>
      <BlogPostJsonLd
        title={post.title}
        description={post.description}
        datePublished={post.dateISO}
        author={post.author}
        url={postUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: `${siteConfig.url}/blog` },
          { name: post.title, url: postUrl },
        ]}
      />

      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="blue">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-text-secondary mb-6">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <User size={16} />
              {post.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {post.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <Section>
        <article className="max-w-3xl mx-auto">
          {post.content}
        </article>

        {/* Related Posts CTA */}
        <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-border">
          <h3 className="text-xl font-bold mb-6">Continue Reading</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(blogPosts)
              .filter(([key]) => key !== slug)
              .slice(0, 2)
              .map(([key, relatedPost]) => (
                <Link
                  key={key}
                  href={`/blog/${key}`}
                  className="p-4 bg-surface-secondary border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <h4 className="font-semibold mb-2 line-clamp-2">{relatedPost.title}</h4>
                  <p className="text-sm text-text-muted line-clamp-2">{relatedPost.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                    Read more <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </Section>
    </>
  );
}
