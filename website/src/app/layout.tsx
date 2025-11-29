import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "AllyLab - AI-Powered Accessibility Scanner",
  description:
    "Enterprise-grade web accessibility scanning with AI-powered fix suggestions. WCAG 2.2 compliance made actionable.",
  keywords: ["accessibility", "WCAG", "a11y", "AI", "scanner", "web accessibility"],
  authors: [{ name: "AllyLab" }],
  openGraph: {
    title: "AllyLab - AI-Powered Accessibility Scanner",
    description: "Enterprise-grade web accessibility scanning with AI-powered fix suggestions.",
    url: "https://allylab.io",
    siteName: "AllyLab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AllyLab - AI-Powered Accessibility Scanner",
    description: "Enterprise-grade web accessibility scanning with AI-powered fix suggestions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}