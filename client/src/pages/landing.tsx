import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import { SchemaMarkup, organizationSchema, softwareApplicationSchema } from "@/components/schema-markup";
import { useSEO } from "@/hooks/useSEO";
import HowItWorksSection from "@/components/landing/how-it-works-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import CTASection from "@/components/landing/cta-section";

export default function Landing() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useSEO({
    title: "Step Into Storytime - Magical AI-Powered Bedtime Stories for Children",
    description: "Create magical, personalized bedtime stories for your children in minutes. AI-powered storytelling that makes every night a new adventure.",
    keywords: "bedtime stories, children's stories, AI storytelling, personalized stories, kids bedtime, magical stories, family entertainment",
    url: window.location.href,
    type: "website"
  });
  const [storyVisible, setStoryVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setStoryVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(stepTimer);
  }, []);

  const steps = [
    {
      icon: "👶",
      title: "Tell us about your child",
      description: "Name, age, favorite themes",
    },
    {
      icon: "🎭",
      title: "Choose story style",
      description: "Adventure, calming, silly, or educational",
    },
    {
      icon: "✨",
      title: "Get your story",
      description: "Ready in under 2 minutes",
    },
  ];

  return (
    <>
      <SchemaMarkup schema={organizationSchema} />
      <SchemaMarkup schema={softwareApplicationSchema} />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 overflow-hidden">
      {/* Hero Section */}
      <section aria-label="Hero section">
        <HeroSection />
      </section>

      {/* Features Section */}
      <section aria-label="Features and benefits">
        <FeaturesSection />
      </section>

      {/* How It Works Section */}
      <section aria-label="How it works">
        <HowItWorksSection />
      </section>

      {/* Testimonials Section */}
      <section aria-label="Customer testimonials">
        <TestimonialsSection />
      </section>

      {/* CTA Section */}
      <section aria-label="Call to action">
        <CTASection />
      </section>
    </main>
    </>
  );
}
