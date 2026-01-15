import { HeroSection } from "@/features/marketing/components/hero-section";
import { FeaturesSection } from "@/features/marketing/components/features-section";
import { TestimonialsSection } from "@/features/marketing/components/testimonials-section";
import { CTASection } from "@/features/marketing/components/cta-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Tracker - Master Your Wealth",
  description: "The modern way to track your net worth. Connect all your accounts, analyze performance, and make better financial decisions.",
};

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
