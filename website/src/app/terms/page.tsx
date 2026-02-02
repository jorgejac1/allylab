import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Terms of Service - AllyLab",
  description: "Terms and conditions for using AllyLab accessibility scanning platform.",
};

export default function TermsPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-text-secondary">
            Last updated: January 15, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <Section>
        <div className="max-w-3xl mx-auto prose prose-invert">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-text-secondary">
                By accessing or using AllyLab&apos;s services, website, CLI tools, API, or any related
                products (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service
                (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
              </p>
              <p className="text-text-secondary mt-4">
                These Terms constitute a legally binding agreement between you (either an individual
                or entity) and AllyLab, Inc. (&quot;AllyLab,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-text-secondary">
                AllyLab provides a web accessibility scanning and remediation platform that includes:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2 mt-4">
                <li>Automated accessibility scanning based on WCAG guidelines</li>
                <li>AI-powered code fix suggestions</li>
                <li>Integration with development tools (GitHub, JIRA, Slack)</li>
                <li>Reporting and compliance documentation</li>
                <li>API and CLI access for automated workflows</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
              <p className="text-text-secondary mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as needed</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
              <p className="text-text-secondary mt-4">
                You must be at least 16 years old to create an account. If you are using the Service
                on behalf of an organization, you represent that you have authority to bind that
                organization to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Subscription Plans and Billing</h2>

              <h3 className="text-lg font-semibold mb-2 mt-6">4.1 Free Plan</h3>
              <p className="text-text-secondary">
                The Free plan provides limited access to the Service at no cost. Features and usage
                limits are specified on our pricing page and may change with notice.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">4.2 Paid Plans</h3>
              <p className="text-text-secondary">
                Paid plans (Pro, Team, Enterprise) are billed according to the pricing and terms
                displayed at the time of purchase. Subscription fees are billed in advance on a
                monthly or annual basis.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">4.3 Payment</h3>
              <p className="text-text-secondary">
                You authorize us to charge your payment method for all applicable fees. If payment
                fails, we may suspend your access until payment is received.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">4.4 Refunds</h3>
              <p className="text-text-secondary">
                We offer a 14-day refund policy for new paid subscriptions. Refund requests after
                14 days will be considered on a case-by-case basis. Enterprise contracts may have
                different terms.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">4.5 Cancellation</h3>
              <p className="text-text-secondary">
                You may cancel your subscription at any time. Access continues until the end of
                your current billing period. No prorated refunds are provided for partial periods.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
              <p className="text-text-secondary mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Scan websites you do not own or have permission to test</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Transmit malware, viruses, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or other users</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Use the Service for competitive analysis or benchmarking without consent</li>
                <li>Circumvent usage limits or security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>

              <h3 className="text-lg font-semibold mb-2 mt-6">6.1 AllyLab Property</h3>
              <p className="text-text-secondary">
                The Service, including its software, designs, documentation, and content, is owned
                by AllyLab and protected by intellectual property laws. You receive a limited,
                non-exclusive, non-transferable license to use the Service according to these Terms.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">6.2 Your Content</h3>
              <p className="text-text-secondary">
                You retain ownership of content you provide to the Service (scan data, configurations, etc.).
                You grant AllyLab a license to use this content to provide and improve the Service.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">6.3 AI-Generated Content</h3>
              <p className="text-text-secondary">
                Fix suggestions and other AI-generated content are provided for your use. You are
                responsible for reviewing, modifying, and testing any code before implementing it
                in your projects.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">6.4 Open Source</h3>
              <p className="text-text-secondary">
                Portions of the Service may incorporate open-source software. Such software is
                subject to its respective licenses, which are available in our documentation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Third-Party Integrations</h2>
              <p className="text-text-secondary">
                The Service integrates with third-party services (GitHub, JIRA, Slack, etc.). Your
                use of these integrations is subject to the respective third party&apos;s terms of service.
                AllyLab is not responsible for third-party services or their availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-text-secondary">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-text-secondary mt-4">
                AllyLab does not warrant that:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2 mt-4">
                <li>The Service will be uninterrupted or error-free</li>
                <li>Scan results will be complete or accurate</li>
                <li>AI-generated fixes will work in all cases</li>
                <li>The Service will detect all accessibility issues</li>
                <li>Using the Service will ensure legal compliance</li>
              </ul>
              <p className="text-text-secondary mt-4">
                <strong>Automated accessibility testing is not a substitute for manual testing and
                expert review.</strong> AllyLab is a tool to assist with accessibility, not a
                guarantee of compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <p className="text-text-secondary">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALLYLAB SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
                REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
                GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-text-secondary mt-4">
                IN NO EVENT SHALL ALLYLAB&apos;S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO ALLYLAB
                IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $100 IF YOU HAVE NOT MADE ANY PAYMENTS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
              <p className="text-text-secondary">
                You agree to indemnify and hold AllyLab harmless from any claims, damages, losses,
                and expenses (including reasonable attorneys&apos; fees) arising from:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2 mt-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Content you provide through the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
              <p className="text-text-secondary">
                We may terminate or suspend your access to the Service at any time, with or without
                cause, with or without notice. Upon termination:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2 mt-4">
                <li>Your right to use the Service immediately ceases</li>
                <li>We may delete your account and data according to our data retention policy</li>
                <li>Provisions that should survive termination will remain in effect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
              <p className="text-text-secondary">
                We may modify these Terms at any time. We will notify you of material changes by
                posting the updated Terms on our website and updating the &quot;Last updated&quot; date.
                Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Governing Law and Disputes</h2>
              <p className="text-text-secondary">
                These Terms are governed by the laws of the State of California, without regard to
                conflict of law principles. Any disputes shall be resolved in the state or federal
                courts located in San Francisco County, California.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. General Provisions</h2>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and AllyLab regarding the Service.</li>
                <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                <li><strong>Waiver:</strong> Failure to enforce any right does not waive that right.</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign our rights freely.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
              <p className="text-text-secondary mb-4">
                For questions about these Terms, contact us at:
              </p>
              <div className="bg-surface-secondary border border-border rounded-xl p-6">
                <p className="text-text-secondary">
                  <strong>Email:</strong> legal@allylab.io<br />
                  <strong>Address:</strong> AllyLab, Inc.<br />
                  123 Accessibility Way<br />
                  San Francisco, CA 94105
                </p>
              </div>
            </section>
          </div>
        </div>
      </Section>
    </>
  );
}
