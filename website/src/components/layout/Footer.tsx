import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

const footerLinks = {
  product: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/changelog", label: "Changelog" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/docs#api", label: "API Reference" },
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

export function Footer() {
  return (
    <footer className="bg-surface-secondary border-t border-border-subtle py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center font-bold text-black">
                A
              </div>
              <span className="font-bold text-xl tracking-tight">AllyLab</span>
            </Link>
            <p className="text-text-muted text-sm max-w-xs mb-6">
              Enterprise-grade accessibility scanning with AI-powered fix suggestions.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://github.com/allylab"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Github size={20} />
              </Link>
              <Link
                href="https://twitter.com/allylab"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Twitter size={20} />
              </Link>
              <Link
                href="https://linkedin.com/company/allylab"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Linkedin size={20} />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm">© 2025 AllyLab. All rights reserved.</p>
          <div className="flex gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-surface-tertiary border border-border rounded">
              SOC 2
            </span>
            <span className="text-xs font-semibold px-2 py-1 bg-surface-tertiary border border-border rounded">
              GDPR
            </span>
            <span className="text-xs font-semibold px-2 py-1 bg-surface-tertiary border border-border rounded">
              VPAT
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}