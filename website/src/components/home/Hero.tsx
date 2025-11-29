"use client";

import { Button } from "@/components/ui/Button";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="min-h-screen pt-32 pb-20 px-6 gradient-mesh">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-sm text-text-secondary mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Now with WCAG 2.2 Support
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Accessibility Testing
            <br />
            That <span className="gradient-text">Actually Fixes</span> Issues
          </h1>

          {/* Description */}
          <p className="text-xl text-text-secondary mb-8 max-w-lg">
            Enterprise-grade web accessibility scanning with AI-powered fix suggestions. Stop just
            finding problems — start solving them automatically.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg">
              Start Free Trial
              <ArrowRight size={18} />
            </Button>
            <Button variant="secondary" size="lg">
              <Play size={18} />
              Watch Demo
            </Button>
          </div>

          {/* Trust */}
          <div>
            <p className="text-sm text-text-muted mb-3">Trusted by teams at</p>
            <div className="flex gap-8">
              {["Disney", "ESPN", "ABC", "Discovery"].map((brand) => (
                <span key={brand} className="text-text-dim font-semibold">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="bg-surface border border-border rounded-2xl overflow-hidden glow">
            {/* Browser Chrome */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-tertiary border-b border-border">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-red" />
                <span className="w-3 h-3 rounded-full bg-accent-yellow" />
                <span className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <span className="text-xs text-text-muted font-mono">app.allylab.io/dashboard</span>
            </div>

            {/* Content */}
            <div className="grid grid-cols-[140px_1fr] min-h-[320px]">
              {/* Sidebar */}
              <div className="bg-surface-secondary border-r border-border p-3 space-y-1">
                {[
                  { icon: "🔍", label: "Scanner", active: true },
                  { icon: "📊", label: "Dashboard" },
                  { icon: "📈", label: "Trends" },
                  { icon: "⚙️", label: "Settings" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                      item.active
                        ? "bg-primary/10 text-text-primary border-l-2 border-primary"
                        : "text-text-muted"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="p-6 flex gap-6">
                {/* Score */}
                <div className="text-center">
                  <div className="relative w-24 h-24 mb-2">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#1f1f22"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset="50"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
                      82
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">Accessibility Score</p>
                </div>

                {/* Issues */}
                <div className="flex-1 space-y-2">
                  {[
                    { severity: "Critical", label: "Missing alt text on 3 images", color: "red" },
                    { severity: "Serious", label: "Low contrast ratio on buttons", color: "orange" },
                    { severity: "Moderate", label: "Missing form labels", color: "yellow" },
                  ].map((issue) => (
                    <div
                      key={issue.label}
                      className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded text-sm"
                    >
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-${issue.color}/20 text-accent-${issue.color}`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-text-secondary text-xs">{issue.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}