import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/forms/ContactForm";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { Github, Twitter, Linkedin, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Contact - AllyLab",
  description: "Get in touch with the AllyLab team. We're here to help with sales, support, and partnership inquiries.",
};

const faqs = [
  { question: "What is AllyLab?", answer: "AllyLab is an AI-powered accessibility scanner that helps you find and fix WCAG issues automatically." },
  { question: "Is there a free plan?", answer: "Yes! Our free plan includes 100 scans per month with no credit card required." },
  { question: "How does the AI fix generation work?", answer: "We use Claude AI to analyze your code and generate framework-specific fixes for accessibility issues." },
];

export default function ContactPage() {
  return (
    <>
      <FAQJsonLd questions={faqs} />

      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-text-secondary">
            Have questions? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
            <ContactForm />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>

            <Card hover={false}>
              <h3 className="font-semibold mb-3">Email</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-text-muted">General:</span>
                  <a href="mailto:hello@allylab.io" className="text-primary hover:underline">
                    hello@allylab.io
                  </a>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-text-muted">Support:</span>
                  <a href="mailto:support@allylab.io" className="text-primary hover:underline">
                    support@allylab.io
                  </a>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-text-muted">Sales:</span>
                  <a href="mailto:sales@allylab.io" className="text-primary hover:underline">
                    sales@allylab.io
                  </a>
                </p>
              </div>
            </Card>

            <Card hover={false}>
              <h3 className="font-semibold mb-3">Support Hours</h3>
              <p className="text-text-secondary text-sm">
                Monday - Friday
                <br />
                9:00 AM - 6:00 PM EST
              </p>
              <p className="text-xs text-text-muted mt-2">
                We typically respond within 24 hours.
              </p>
            </Card>

            <Card hover={false}>
              <h3 className="font-semibold mb-3">Connect With Us</h3>
              <div className="flex gap-4">
                <a
                  href="https://github.com/jorgejac1/allylab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
                <a
                  href="https://twitter.com/allylab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="https://linkedin.com/company/allylab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="https://github.com/jorgejac1/allylab/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-surface-tertiary rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  aria-label="Community Forum"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </Card>

            <Card hover={false} className="border-primary bg-primary/5">
              <h3 className="font-semibold mb-2">Enterprise Sales</h3>
              <p className="text-text-secondary text-sm mb-4">
                Need SSO, self-hosting, custom integrations, or dedicated support?
                Let&apos;s discuss how AllyLab can work for your organization.
              </p>
              <Link href="mailto:sales@allylab.io">
                <Button>Schedule a Demo</Button>
              </Link>
            </Card>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section className="bg-surface-secondary">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} hover={false}>
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-text-secondary text-sm">{faq.answer}</p>
              </Card>
            ))}
          </div>
          <p className="text-center text-text-muted text-sm mt-6">
            Have more questions?{" "}
            <Link href="/docs" className="text-primary hover:underline">
              Check our documentation
            </Link>{" "}
            or{" "}
            <a href="mailto:support@allylab.io" className="text-primary hover:underline">
              email us
            </a>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
