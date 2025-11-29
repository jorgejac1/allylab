import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing - AllyLab",
  description: "Simple, transparent pricing for AllyLab accessibility scanner.",
};

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/ month",
    description: "Perfect for individuals and small projects getting started with accessibility",
    features: [
      "100 page scans per month",
      "Single-page scanning only",
      "WCAG 2.1 Level AA",
      "Basic AI fix suggestions",
      "CSV & JSON export",
      "Community support",
      "7-day scan history",
    ],
    cta: "Get Started Free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/ month",
    description: "For growing teams serious about building accessible products",
    features: [
      "Unlimited page scans",
      "Multi-page site crawling",
      "WCAG 2.2 Level AAA",
      "Full AI-powered fixes",
      "GitHub PR integration",
      "Scheduled scans (daily)",
      "Slack & Teams notifications",
      "PDF & Excel reports",
      "90-day scan history",
      "Priority email support",
      "5 team members",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced security and compliance needs",
    features: [
      "Everything in Professional",
      "SSO / SAML authentication",
      "Custom rule creation",
      "JIRA integration",
      "Multi-tenancy & teams",
      "Role-based access control",
      "Audit logs & compliance",
      "Unlimited scan history",
      "Dedicated success manager",
      "SLA guarantee (99.9%)",
      "On-premise deployment option",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple, Transparent
            <br />
            <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-xl text-text-secondary">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "bg-surface border rounded-2xl p-8 relative",
                plan.featured ? "border-primary glow-strong" : "border-border"
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <p className="text-sm text-text-muted uppercase tracking-wider font-semibold mb-2">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-muted">{plan.period}</span>
                </div>
                <p className="text-text-secondary text-sm mt-2">{plan.description}</p>
              </div>

              <hr className="border-border mb-6" />

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                    <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant={plan.featured ? "primary" : "secondary"} className="w-full">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}