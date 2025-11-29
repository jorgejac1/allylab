"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Play, Search, BarChart3, Settings, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="green" className="mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2" />
              Now with WCAG 2.2 Support
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Accessibility Testing That{" "}
              <span className="gradient-text">Actually Fixes</span> Issues
            </h1>

            <p className="text-lg text-text-secondary mb-8 max-w-lg">
              Stop just finding problems. AllyLab generates production-ready code fixes 
              and creates GitHub pull requests automatically. Fix accessibility issues 
              in minutes, not days.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/signup">
                <Button size="lg">
                  Start Free Trial
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="secondary" size="lg">
                  <Play size={18} />
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Value props instead of logos */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Free forever plan
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Setup in 2 minutes
              </span>
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
                <div className="flex-1 bg-surface rounded-lg px-3 py-1">
                  <span className="text-xs text-text-muted font-mono">app.allylab.io/dashboard</span>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 bg-surface-secondary border-r border-border p-4 hidden xl:block">
                  <div className="space-y-1">
                    {[
                      { icon: Search, label: "Scanner", active: true },
                      { icon: BarChart3, label: "Dashboard", active: false },
                      { icon: Settings, label: "Settings", active: false },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          item.active
                            ? "bg-primary/15 text-primary"
                            : "text-text-muted hover:bg-surface-tertiary"
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                  {/* Score Card */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-surface-tertiary"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${82 * 2.51} 251`}
                          className="text-primary"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">82</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted mb-1">Accessibility Score</p>
                      <p className="text-2xl font-bold">Good</p>
                      <p className="text-xs text-primary">+5 from last scan</p>
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="space-y-2">
                    {[
                      { severity: "Critical", count: 0, color: "bg-accent-red" },
                      { severity: "Serious", count: 2, color: "bg-accent-orange" },
                      { severity: "Moderate", count: 6, color: "bg-accent-yellow" },
                      { severity: "Minor", count: 4, color: "bg-accent-blue" },
                    ].map((issue) => (
                      <div
                        key={issue.severity}
                        className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${issue.color}`} />
                          <span className="text-sm">{issue.severity}</span>
                        </div>
                        <span className="font-mono font-semibold">{issue.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}