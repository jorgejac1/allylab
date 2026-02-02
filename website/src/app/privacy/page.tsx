import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Privacy Policy - AllyLab",
  description: "Learn how AllyLab collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Privacy Policy
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
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-text-secondary">
                AllyLab (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our accessibility scanning platform, website, and related services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>

              <h3 className="text-lg font-semibold mb-2 mt-6">Account Information</h3>
              <p className="text-text-secondary mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Email address</li>
                <li>Name (optional)</li>
                <li>Company name (optional)</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-6">Scan Data</h3>
              <p className="text-text-secondary mb-4">
                When you use our scanning service, we collect:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>URLs you scan</li>
                <li>Accessibility findings and scores</li>
                <li>Generated fix suggestions</li>
                <li>Scan configuration and preferences</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-6">Integration Data</h3>
              <p className="text-text-secondary mb-4">
                When you connect third-party services:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>GitHub: Repository names and access tokens (stored encrypted)</li>
                <li>JIRA: Project information and API tokens (stored encrypted)</li>
                <li>Slack/Teams: Webhook URLs for notifications</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-6">Usage Data</h3>
              <p className="text-text-secondary">
                We automatically collect certain information about how you use our services, including:
                IP address, browser type, device information, pages visited, and actions taken within
                the application. This data is collected through cookies and similar technologies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <p className="text-text-secondary mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process accessibility scans and generate fix suggestions</li>
                <li>Create pull requests and integrate with your development tools</li>
                <li>Send you notifications about scan results and system updates</li>
                <li>Respond to your support requests and inquiries</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect and prevent fraud, abuse, and security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">AI and Data Processing</h2>
              <p className="text-text-secondary mb-4">
                AllyLab uses artificial intelligence to generate accessibility fix suggestions. When
                you request AI-generated fixes:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>The relevant HTML/code snippet and accessibility violation context is sent to our AI provider (Anthropic Claude)</li>
                <li>We do not send your full page content or personal data</li>
                <li>AI providers process data according to their privacy policies</li>
                <li>Generated suggestions are stored in your AllyLab account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Sharing and Disclosure</h2>
              <p className="text-text-secondary mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li><strong>Service Providers:</strong> Third parties who help us operate our services (hosting, analytics, AI processing)</li>
                <li><strong>Integrations:</strong> Services you explicitly connect (GitHub, JIRA, Slack) to enable functionality you requested</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-text-secondary mb-4">We retain your data for as long as your account is active or as needed to provide services:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li><strong>Free accounts:</strong> Scan data retained for 30 days</li>
                <li><strong>Pro accounts:</strong> Scan data retained for 1 year</li>
                <li><strong>Enterprise accounts:</strong> Custom retention policies available</li>
                <li><strong>Account deletion:</strong> Data is deleted within 30 days of account closure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-text-secondary mb-4">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure development practices</li>
                <li>Employee security training</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p className="text-text-secondary mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p className="text-text-secondary mt-4">
                To exercise these rights, contact us at privacy@allylab.io.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Cookies</h2>
              <p className="text-text-secondary mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li><strong>Essential cookies:</strong> Required for the service to function (authentication, security)</li>
                <li><strong>Analytics cookies:</strong> Help us understand how you use our service (can be disabled)</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-text-secondary mt-4">
                You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Children&apos;s Privacy</h2>
              <p className="text-text-secondary">
                AllyLab is not intended for children under 16. We do not knowingly collect personal
                information from children. If you believe we have collected information from a child,
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">International Transfers</h2>
              <p className="text-text-secondary">
                Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses
                where required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-text-secondary">
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-text-secondary mb-4">
                If you have questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="bg-surface-secondary border border-border rounded-xl p-6">
                <p className="text-text-secondary">
                  <strong>Email:</strong> privacy@allylab.io<br />
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
