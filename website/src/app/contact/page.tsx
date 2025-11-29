import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Contact - AllyLab",
  description: "Get in touch with AllyLab.",
};

export default function ContactPage() {
  return (
    <>
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
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <select className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                  <option value="">Select a topic</option>
                  <option value="sales">Sales inquiry</option>
                  <option value="support">Technical support</option>
                  <option value="enterprise">Enterprise pricing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px]"
                  placeholder="How can we help?"
                />
              </div>
              <Button className="w-full" size="lg">
                Send Message
              </Button>
            </form>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>

            <Card hover={false}>
              <h3 className="font-semibold mb-2">📧 Email</h3>
              <p className="text-text-secondary text-sm">
                <strong>General:</strong> hello@allylab.io
                <br />
                <strong>Support:</strong> support@allylab.io
                <br />
                <strong>Sales:</strong> sales@allylab.io
              </p>
            </Card>

            <Card hover={false}>
              <h3 className="font-semibold mb-2">🎧 Support Hours</h3>
              <p className="text-text-secondary text-sm">
                Monday - Friday
                <br />
                9:00 AM - 6:00 PM EST
              </p>
            </Card>

            <Card hover={false} className="border-primary bg-primary/5">
              <h3 className="font-semibold mb-2">🚀 Enterprise Sales</h3>
              <p className="text-text-secondary text-sm mb-4">
                Need custom pricing, SSO, or dedicated support? Let&apos;s talk.
              </p>
              <Button>Schedule a Demo</Button>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}