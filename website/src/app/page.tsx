import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { Features } from "@/components/home/Features";
import { AISection } from "@/components/home/AISection";
import { Pricing } from "@/components/home/Pricing";
import { CTA } from "@/components/home/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <AISection />
      <Pricing />
      <CTA />
    </>
  );
}