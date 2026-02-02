"use client";

import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const features = [
  "Framework-specific code (HTML, React, Vue)",
  "Confidence scores and effort estimates",
  "One-click PR/MR creation (GitHub & GitLab)",
  "Automatic fix verification after merge",
  "Batch multiple fixes in single PR/MR",
];

const tabs = ["before", "after", "diff"] as const;

export function AISection() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("before");

  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_60%)]" />

      <div className="relative grid lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">
            AI-Powered
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Stop Reading Reports.
            <br />
            Start Shipping Fixes.
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Traditional scanners tell you what&apos;s wrong. AllyLab tells you exactly how to fix it
            — with production-ready code tailored to your framework.
          </p>

          <ul className="space-y-3 mb-8">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check size={12} className="text-primary" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <Button size="lg">See AI Fixes in Action</Button>
        </motion.div>

        {/* Code Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-surface border border-border rounded-2xl overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex gap-1 p-2 bg-surface-tertiary border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded transition-colors capitalize",
                  activeTab === tab
                    ? "bg-surface text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-surface-secondary border-b border-border">
            <span className="text-xs text-text-muted font-mono">hero-image.tsx</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-accent-blue/20 text-accent-blue rounded">
              React
            </span>
          </div>

          {/* Code */}
          <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
            {activeTab === "before" && (
              <div className="space-y-1">
                <CodeLine num={1} content={<><Kw>export const</Kw> <Fn>HeroImage</Fn> = () =&gt; {"{"}</>} />
                <CodeLine num={2} content={<>  <Kw>return</Kw> (</>} />
                <CodeLine num={3} error content={<>    &lt;<Kw>img</Kw> <Prop>src</Prop>=<Str>&quot;/hero.jpg&quot;</Str> /&gt;</>} />
                <CodeLine num={4} content="  );" />
                <CodeLine num={5} content="};" />
              </div>
            )}
            {activeTab === "after" && (
              <div className="space-y-1">
                <CodeLine num={1} content={<><Kw>export const</Kw> <Fn>HeroImage</Fn> = () =&gt; {"{"}</>} />
                <CodeLine num={2} content={<>  <Kw>return</Kw> (</>} />
                <CodeLine num={3} success content={<>    &lt;<Kw>img</Kw></>} />
                <CodeLine num={4} success content={<>      <Prop>src</Prop>=<Str>&quot;/hero.jpg&quot;</Str></>} />
                <CodeLine num={5} success content={<>      <Prop>alt</Prop>=<Str>&quot;Team collaborating in modern office&quot;</Str></>} />
                <CodeLine num={6} success content={<>      <Prop>loading</Prop>=<Str>&quot;lazy&quot;</Str></>} />
                <CodeLine num={7} success content="    />" />
                <CodeLine num={8} content="  );" />
                <CodeLine num={9} content="};" />
              </div>
            )}
            {activeTab === "diff" && (
              <div className="space-y-1">
                <CodeLine num="-" diff="remove" content={<>    &lt;<Kw>img</Kw> <Prop>src</Prop>=<Str>&quot;/hero.jpg&quot;</Str> /&gt;</>} />
                <CodeLine num="+" diff="add" content={<>    &lt;<Kw>img</Kw></>} />
                <CodeLine num="+" diff="add" content={<>      <Prop>src</Prop>=<Str>&quot;/hero.jpg&quot;</Str></>} />
                <CodeLine num="+" diff="add" content={<>      <Prop>alt</Prop>=<Str>&quot;Team collaborating in modern office&quot;</Str></>} />
                <CodeLine num="+" diff="add" content={<>      <Prop>loading</Prop>=<Str>&quot;lazy&quot;</Str></>} />
                <CodeLine num="+" diff="add" content="    />" />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-tertiary border-t border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">AI Confidence:</span>
              <div className="w-20 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div className="w-[94%] h-full bg-primary rounded-full" />
              </div>
              <span className="text-sm font-semibold text-primary">94%</span>
            </div>
            <Button size="sm">Create PR</Button>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// Helper components for syntax highlighting
function CodeLine({
  num,
  content,
  error,
  success,
  diff,
}: {
  num: number | string;
  content: React.ReactNode;
  error?: boolean;
  success?: boolean;
  diff?: "add" | "remove";
}) {
  return (
    <div
      className={cn(
        "flex",
        error && "bg-accent-red/10 border-l-2 border-accent-red -mx-4 px-4",
        success && "bg-primary/10 border-l-2 border-primary -mx-4 px-4",
        diff === "add" && "bg-primary/15",
        diff === "remove" && "bg-accent-red/15"
      )}
    >
      <span
        className={cn(
          "w-6 text-text-dim select-none",
          diff === "add" && "text-primary",
          diff === "remove" && "text-accent-red"
        )}
      >
        {num}
      </span>
      <span className="text-text-secondary">{content}</span>
    </div>
  );
}

const Kw = ({ children }: { children: React.ReactNode }) => (
  <span className="text-accent-purple">{children}</span>
);
const Fn = ({ children }: { children: React.ReactNode }) => (
  <span className="text-accent-blue">{children}</span>
);
const Prop = ({ children }: { children: React.ReactNode }) => (
  <span className="text-accent-orange">{children}</span>
);
const Str = ({ children }: { children: React.ReactNode }) => (
  <span className="text-primary-light">{children}</span>
);