"use client";

import { Button } from "@/components/ui/Button";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24 px-6 gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Ready to Make Your Site Accessible?
        </h2>
        <p className="text-lg text-text-secondary mb-8">
          Start scanning in under 2 minutes. No credit card required.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link href="/contact">
            <Button size="lg">Get Early Access</Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary" size="lg">
              Schedule Demo
            </Button>
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-text-muted">
          <Shield size={16} className="text-primary" />
          Open Source • Self-Hostable • Enterprise Ready
        </div>
      </motion.div>
    </section>
  );
}