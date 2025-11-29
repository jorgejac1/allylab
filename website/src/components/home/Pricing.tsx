"use client";

import { Section, SectionHeader } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/ month",
    description: "Perfect for individuals",
    features: [
      "100 page scans / month",
      "WCAG 2.1 Level AA",
      "Basic AI suggestions",
      "CSV export",
    ],
    cta: "Get Started Free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/ month",
    description: "For growing teams",
    features: [
      "Unlimited page scans",
      "WCAG 2.2 Level AAA",
      "Full AI-powered fixes",
      "GitHub PR integration",
      "Scheduled scans",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Custom rules",
      "JIRA integration",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
  },
];

export function Pricing() {
  return (
    <Section>
      <SectionHeader
        label="Pricing"
        title="Simple, Transparent Pricing"
        description="Start free, upgrade when you need more."
      />

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-surface border rounded-2xl p-8 relative transition-all duration-300 hover:-translate-y-1",
              plan.featured
                ? "border-primary glow-strong"
                : "border-border hover:border-border-light hover:glow"
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

            <Link href={plan.href}>
              <Button
                variant={plan.featured ? "primary" : "secondary"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
          View full pricing details →
        </Link>
      </div>
    </Section>
  );
}