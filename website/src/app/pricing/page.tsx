import { Section, SectionHeader } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Check, X, ArrowRight, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Pricing - AllyLab",
  description: "Simple, transparent pricing for AllyLab. Start free, upgrade as you grow. Save thousands compared to traditional accessibility tools.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individual developers and small projects",
    cta: "Get Started Free",
    ctaVariant: "secondary" as const,
    popular: false,
    features: [
      { text: "100 scans per month", included: true },
      { text: "WCAG 2.1 AA testing", included: true },
      { text: "AI-powered fix suggestions", included: true, limit: "10/month" },
      { text: "GitHub PR creation", included: true, limit: "5/month" },
      { text: "CSV export", included: true },
      { text: "Community support", included: true },
      { text: "1 team member", included: true },
      { text: "Scheduled scans", included: false },
      { text: "Custom rules", included: false },
      { text: "JIRA integration", included: false },
      { text: "Slack/Teams notifications", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For teams serious about accessibility compliance",
    cta: "Start Free Trial",
    ctaVariant: "primary" as const,
    popular: true,
    features: [
      { text: "Unlimited scans", included: true },
      { text: "WCAG 2.2 AA testing", included: true },
      { text: "AI-powered fix suggestions", included: true, limit: "Unlimited" },
      { text: "GitHub PR creation", included: true, limit: "Unlimited" },
      { text: "PDF, CSV, Excel export", included: true },
      { text: "Priority email support", included: true },
      { text: "5 team members", included: true },
      { text: "Scheduled scans", included: true, limit: "Daily" },
      { text: "Custom rules", included: true, limit: "10 rules" },
      { text: "JIRA integration", included: true },
      { text: "Slack/Teams notifications", included: true },
      { text: "API access", included: true, limit: "1,000 req/hr" },
    ],
  },
  {
    name: "Team",
    price: "$149",
    period: "/month",
    description: "For growing teams managing multiple properties",
    cta: "Start Free Trial",
    ctaVariant: "secondary" as const,
    popular: false,
    features: [
      { text: "Unlimited scans", included: true },
      { text: "WCAG 2.2 AA testing", included: true },
      { text: "AI-powered fix suggestions", included: true, limit: "Unlimited" },
      { text: "GitHub PR creation", included: true, limit: "Unlimited" },
      { text: "All export formats", included: true },
      { text: "Priority support + Slack", included: true },
      { text: "20 team members", included: true },
      { text: "Scheduled scans", included: true, limit: "Hourly" },
      { text: "Custom rules", included: true, limit: "Unlimited" },
      { text: "JIRA integration", included: true },
      { text: "Slack/Teams notifications", included: true },
      { text: "API access", included: true, limit: "5,000 req/hr" },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced security and compliance needs",
    cta: "Contact Sales",
    ctaVariant: "secondary" as const,
    popular: false,
    features: [
      { text: "Everything in Team", included: true },
      { text: "SSO / SAML authentication", included: true },
      { text: "Self-hosted deployment", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Custom API limits", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Security review", included: true },
      { text: "Custom integrations", included: true },
      { text: "On-site training", included: true },
      { text: "Audit logs", included: true },
      { text: "VPAT documentation", included: true },
    ],
  },
];

const competitorComparison = [
  { feature: "Starting Price", allylab: "Free", audioeye: "$49/mo", accessibe: "$59/mo", deque: "Contact Sales" },
  { feature: "AI Code Fix Generation", allylab: true, audioeye: false, accessibe: false, deque: false },
  { feature: "Framework-Specific Fixes (React, Vue)", allylab: true, audioeye: false, accessibe: false, deque: false },
  { feature: "One-Click GitHub PRs", allylab: true, audioeye: false, accessibe: false, deque: false },
  { feature: "Batch Fix Multiple Issues", allylab: true, audioeye: false, accessibe: false, deque: false },
  { feature: "Fix Verification After Merge", allylab: true, audioeye: false, accessibe: false, deque: false },
  { feature: "WCAG 2.2 Support", allylab: true, audioeye: true, accessibe: "Partial", deque: true },
  { feature: "Custom Rules Engine", allylab: true, audioeye: "Limited", accessibe: false, deque: true },
  { feature: "CI/CD Integration", allylab: true, audioeye: false, accessibe: false, deque: true },
  { feature: "Self-Hosted Option", allylab: true, audioeye: false, accessibe: false, deque: false },
  { feature: "Open Source", allylab: true, audioeye: false, accessibe: false, deque: "Partial" },
  { feature: "JIRA Integration", allylab: true, audioeye: false, accessibe: false, deque: true },
  { feature: "API Access", allylab: "All plans", audioeye: "Enterprise", accessibe: "Enterprise", deque: "Paid" },
];

const faqs = [
  {
    q: "Can I try AllyLab before purchasing?",
    a: "Yes! Our Free plan is available forever with no credit card required. Pro and Team plans include a 14-day free trial."
  },
  {
    q: "What happens if I exceed my scan limits?",
    a: "On the Free plan, you'll need to wait until the next month or upgrade. Paid plans have unlimited scans."
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No long-term contracts. Cancel anytime and you'll retain access until the end of your billing period."
  },
  {
    q: "Do you offer discounts for nonprofits or education?",
    a: "Yes! We offer 50% off for registered nonprofits, educational institutions, and open-source projects. Contact us to apply."
  },
  {
    q: "What's included in the self-hosted option?",
    a: "Enterprise customers can deploy AllyLab on their own infrastructure for complete data control. Includes setup support and updates."
  },
  {
    q: "How does AllyLab compare to overlay solutions?",
    a: "Unlike overlays that mask issues, AllyLab helps you actually fix your code. Our AI generates real code changes that permanently resolve accessibility issues."
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">Simple Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Start Free, Scale as You Grow
          </h1>
          <p className="text-xl text-text-secondary mb-4 max-w-2xl mx-auto">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
          <p className="text-primary font-semibold">
            Save up to 70% compared to AudioEye, accessiBe, and other tools.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <Section>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-surface border rounded-2xl p-6 flex flex-col ${
                plan.popular 
                  ? "border-primary shadow-lg shadow-primary/10" 
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="green">Most Popular</Badge>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-muted">{plan.period}</span>
                </div>
                <p className="text-sm text-text-secondary">{plan.description}</p>
              </div>

              <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"} className="mb-6">
                <Button variant={plan.ctaVariant} className="w-full">
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    {feature.included ? (
                      <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-text-dim mt-0.5 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "text-text-secondary" : "text-text-dim"}>
                      {feature.text}
                      {feature.limit && feature.included && (
                        <span className="text-text-muted"> ({feature.limit})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Competitor Comparison */}
      <Section className="bg-surface-secondary">
        <SectionHeader
          label="Compare"
          title="How AllyLab Stacks Up"
          description="See why teams choose AllyLab over traditional accessibility tools"
        />
        
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 px-4 font-semibold">Feature</th>
                <th className="py-4 px-4 text-center">
                  <span className="text-primary font-bold">AllyLab</span>
                </th>
                <th className="py-4 px-4 text-center text-text-muted">AudioEye</th>
                <th className="py-4 px-4 text-center text-text-muted">accessiBe</th>
                <th className="py-4 px-4 text-center text-text-muted">Deque</th>
              </tr>
            </thead>
            <tbody>
              {competitorComparison.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 px-4 font-medium">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.allylab === "boolean" ? (
                      row.allylab ? (
                        <Check size={18} className="text-primary mx-auto" />
                      ) : (
                        <X size={18} className="text-text-dim mx-auto" />
                      )
                    ) : (
                      <span className="text-primary font-medium">{row.allylab}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.audioeye === "boolean" ? (
                      row.audioeye ? (
                        <Check size={18} className="text-text-muted mx-auto" />
                      ) : (
                        <X size={18} className="text-text-dim mx-auto" />
                      )
                    ) : (
                      <span className="text-text-muted">{row.audioeye}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.accessibe === "boolean" ? (
                      row.accessibe ? (
                        <Check size={18} className="text-text-muted mx-auto" />
                      ) : (
                        <X size={18} className="text-text-dim mx-auto" />
                      )
                    ) : (
                      <span className="text-text-muted">{row.accessibe}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.deque === "boolean" ? (
                      row.deque ? (
                        <Check size={18} className="text-text-muted mx-auto" />
                      ) : (
                        <X size={18} className="text-text-dim mx-auto" />
                      )
                    ) : (
                      <span className="text-text-muted">{row.deque}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="max-w-3xl mx-auto mt-12 text-center">
          <p className="text-text-secondary mb-6">
            Traditional tools identify problems. Overlay solutions mask them.
            <br />
            <strong className="text-text-primary">AllyLab actually fixes them.</strong>
          </p>
          <Link href="/compare">
            <Button variant="secondary">
              See Full Comparison
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </Section>

      {/* Annual Savings Calculator */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center" hover={false}>
            <h3 className="text-2xl font-bold mb-4">💰 Calculate Your Savings</h3>
            <p className="text-text-secondary mb-6">
              Companies using AllyLab save an average of <span className="text-primary font-bold">$8,400/year</span> compared to AudioEye and similar tools.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface-secondary rounded-xl p-4">
                <p className="text-3xl font-bold text-accent-red">$1,188</p>
                <p className="text-sm text-text-muted">AudioEye Pro/year</p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-4">
                <p className="text-3xl font-bold text-accent-red">$708</p>
                <p className="text-sm text-text-muted">accessiBe/year</p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-4">
                <p className="text-3xl font-bold text-primary">$588</p>
                <p className="text-sm text-text-muted">AllyLab Pro/year</p>
              </div>
            </div>
            <p className="text-sm text-text-muted">
              Plus, AllyLab includes AI code fixes and GitHub PRs that others charge extra for or don&apos;t offer at all.
            </p>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-surface-secondary">
        <SectionHeader
          title="Frequently Asked Questions"
          description="Everything you need to know about AllyLab pricing"
        />
        <div className="max-w-3xl mx-auto grid gap-4">
          {faqs.map((faq, i) => (
            <Card key={i} hover={false}>
              <div className="flex items-start gap-3">
                <HelpCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">{faq.q}</h4>
                  <p className="text-text-secondary text-sm">{faq.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="py-24 px-6 gradient-mesh">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Fix Accessibility Issues?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Start free today. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}