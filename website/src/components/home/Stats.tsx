"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "50+", label: "Features Shipped" },
  { value: "100K+", label: "Issues Fixed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<2s", label: "Avg Scan Time" },
  { value: "24/7", label: "Monitoring" },
];

export function Stats() {
  return (
    <section className="py-16 px-6 bg-surface-secondary border-y border-border-subtle">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-12 md:gap-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}