import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, Star, Crown, Sparkles, Heart, Users, Info } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEnhancedToast } from "@/components/enhanced-toast-system";

interface ComparisonFeature {
  name: string;
  free: string;
  premium: string;
  family: string;
  description: string;
  benefits: string[];
}

// Feature Modal Component
function FeatureModal({ feature }: { feature: ComparisonFeature }) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold font-serif text-story-bark flex items-center gap-2">
          <Info className="h-6 w-6 text-story-gold" />
          {feature.name}
        </DialogTitle>
        <DialogDescription className="text-lg text-story-bark/70 mt-2">
          {feature.description}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 space-y-6">
        {/* Plan Comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-story-moonlight/20 rounded-xl">
            <h4 className="font-semibold text-story-bark mb-2">Starter Magic</h4>
            <p className="text-2xl font-bold text-story-moonlight">{feature.free}</p>
          </div>
          <div className="text-center p-4 bg-story-cream rounded-xl">
            <h4 className="font-semibold text-story-bark mb-2">Storytime Plus</h4>
            <p className="text-2xl font-bold text-story-gold">{feature.premium}</p>
          </div>
          <div className="text-center p-4 bg-story-forest/10 rounded-xl">
            <h4 className="font-semibold text-story-bark mb-2">Storytime Pro</h4>
            <p className="text-2xl font-bold text-story-forest">{feature.family}</p>
          </div>
        </div>

        {/* Benefits */}
        {feature.benefits && (
          <div>
            <h4 className="font-semibold text-story-bark mb-3">Key Benefits:</h4>
            <ul className="space-y-2">
              {feature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-story-bark/70">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Stories per week",
    free: "3",
    premium: "Unlimited",
    family: "Unlimited",
    description: "How many new personalized stories you can generate each week. Free users get 3 magical stories weekly, while premium users can create as many as their imagination desires.",
    benefits: [
      "Perfect for establishing bedtime routines",
      "Fresh content to keep children engaged",
      "No limits on creativity with premium plans"
    ],
  },
  {
    name: "Child profiles",
    free: "1",
    premium: "1",
    family: "Up to 5",
    description: "Create individual profiles for each child with their unique preferences, interests, and characteristics for truly personalized storytelling.",
    benefits: [
      "Tailored stories for each child's age and interests",
      "Track individual reading progress",
      "Family plan perfect for multi-child households"
    ],
  },
  {
    name: "Story personalization",
    free: "Basic",
    premium: "Full",
    family: "Advanced",
    description: "The level of customization available for your stories. From simple name insertion to complex personality traits and family dynamics.",
    benefits: [
      "Basic: Child's name and one trait",
      "Full: Multiple traits, interests, family members",
      "Advanced: Complex relationships and custom scenarios"
    ],
  },
  {
    name: "Story themes",
    free: "3 popular",
    premium: "All genres",
    family: "All genres + Custom",
    description: "Access to different story categories and themes. From classic bedtime stories to educational adventures and fantasy quests.",
    benefits: [
      "Popular themes include bedtime, adventure, and friendship",
      "Premium unlocks fantasy, educational, holiday themes and more",
      "Family plan includes custom theme creation"
    ],
  },
  {
    name: "Story lengths",
    free: "Short only",
    premium: "Short, Medium, Long",
    family: "All + Custom",
    description: "Choose the perfect story length for your bedtime routine. Short for quick reads, long for extended storytelling sessions.",
    benefits: [
      "Short: 2-3 minutes (perfect for toddlers)",
      "Medium: 5-7 minutes (ideal for most children)",
      "Long: 10-15 minutes (for extended bedtime routines)"
    ],
  },
  {
    name: "AI illustrations",
    free: "None",
    premium: "1 per story",
    family: "3 per story",
    description: "Beautiful, AI-generated illustrations that bring your stories to life. Each image is created specifically for your child's unique story.",
    benefits: [
      "Enhances visual storytelling experience",
      "Helps children engage with the narrative",
      "Professional-quality artwork for every story"
    ],
  },
  {
    name: "Audio narration",
    free: "None",
    premium: "None",
    family: "AI voice",
    description: "Professional-quality AI voice narration that reads stories aloud with perfect pronunciation and engaging storytelling voice.",
    benefits: [
      "Perfect for car rides or when parents need a break",
      "Helps children with reading comprehension",
      "Consistent, soothing bedtime voice"
    ],
  },
  {
    name: "Story library",
    free: "Last 3",
    premium: "Unlimited",
    family: "Unlimited + Sharing",
    description: "Save and organize all your favorite stories. Build a personal library of memories that grows with your child.",
    benefits: [
      "Never lose a beloved story",
      "Track your child's favorites",
      "Family sharing for siblings and relatives"
    ],
  },
  {
    name: "PDF downloads",
    free: "None",
    premium: "Yes",
    family: "Yes + Enhanced",
    description: "Download beautifully formatted PDF versions of stories for printing, sharing, or offline reading.",
    benefits: [
      "Create physical story books",
      "Share with grandparents and family",
      "Offline reading anywhere"
    ],
  },
  {
    name: "Magic Letters",
    free: "None",
    premium: "None",
    family: "Yes",
    description: "Interactive letters from story characters that appear in your child's inbox, creating magical moments beyond the story itself.",
    benefits: [
      "Extends the story experience",
      "Encourages reading and writing",
      "Creates lasting magical memories"
    ],
  },
  {
    name: "Custom characters",
    free: "None",
    premium: "None",
    family: "Yes",
    description: "Design and create unique characters that can appear across multiple stories, building a rich fictional world for your child.",
    benefits: [
      "Consistent character development",
      "Build ongoing story arcs",
      "Create family-specific characters"
    ],
  },
  {
    name: "Support",
    free: "Community",
    premium: "Premium",
    family: "Priority",
    description: "Different levels of customer support to help you get the most out of Step Into Storytime.",
    benefits: [
      "Community: Access to user forums and FAQs",
      "Premium: Direct email support within 24 hours",
      "Priority: Phone and chat support with immediate response"
    ],
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useEnhancedToast();

  useSEO({
    title: "Pricing Plans - Affordable Bedtime Story Magic | Step Into Storytime",
    description: "Choose the perfect plan for your family. From free bedtime stories to unlimited magical adventures. Start creating personalized stories today.",
    keywords: "bedtime story pricing, AI story plans, children's story subscription, family entertainment pricing",
    url: window.location.href,
    canonical: "https://stepintostorytime.com/pricing",
    type: "website"
  });

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [selectedFeature, setSelectedFeature] = useState<ComparisonFeature | null>(null);

  // Mutation to create checkout session
  const createCheckout = useMutation({
    mutationFn: async ({ tier, billing }: { tier: string; billing: string }) => {
      const res = await apiRequest("/api/create-checkout-session", "POST", { tier, billing });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout");
      }
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlanClick = (tier: string) => {
    // Don't allow clicking on coming soon tiers
    if (tier === "family") {
      return;
    }

    // Handle free tier
    if (tier === "free") {
      if (!isAuthenticated || !user) {
        window.location.href = "/api/login?signup=true";
      } else {
        window.location.href = "/dashboard";
      }
      return;
    }

    // For paid tiers, check if user is authenticated
    if (!isAuthenticated || !user) {
      // Redirect to login
      window.location.href = "/api/login?signup=true";
      return;
    }

    // User is authenticated, start checkout
    createCheckout.mutate({ tier, billing: billingPeriod });
  };

  const tiers = [
    {
      id: "free",
      name: "Starter Magic",
      subtitle: "Perfect for new families",
      price: "Free",
      period: "forever",
      description: "Get started with magical bedtime stories",
      icon: <Sparkles className="h-6 w-6" />,
      color: "from-story-moonlight to-story-mist",
      popular: false,
      comingSoon: false,
      features: [
        "3 stories per week",
        "Basic personalization (child's name, 1 trait)",
        "3 popular themes (bedtime, fantasy, adventure)",
        "Save last 3 stories",
        "Read online (text-only)",
        "Community support",
      ],
      limitations: [
        "Limited story generation",
        "No illustrations or voice",
        "Basic personalization only",
      ],
      cta: "Start for Free",
      ctaVariant: "outline" as const,
    },
    {
      id: "premium",
      name: "Storytime Plus",
      subtitle: "For regular storytellers",
      price: "$6.99",
      period: "per month",
      yearlyPrice: "$59",
      yearlyPeriod: "per year",
      description: "Unlock the full magic of personalized storytelling",
      icon: <Heart className="h-6 w-6" />,
      color: "from-story-gold to-story-sunset",
      popular: true,
      comingSoon: false,
      features: [
        "Unlimited stories",
        "Full personalization (name, traits, family members, interests)",
        "Access to all story genres",
        "Multiple story lengths (short, medium, long)",
        "AI-generated illustrations (1 per story)",
        "Save and organize full story library",
        "Printable PDFs",
        "Scheduled story delivery (email or app push)",
        "Premium support",
      ],
      limitations: [],
      cta: "Upgrade to Plus",
      ctaVariant: "default" as const,
    },
    {
      id: "family",
      name: "Storytime Pro",
      subtitle: "Ultimate family experience",
      price: "$12.99",
      period: "per month",
      yearlyPrice: "$119",
      yearlyPeriod: "per year",
      description: "Perfect for families with multiple children",
      icon: <Users className="h-6 w-6" />,
      color: "from-story-forest to-story-moonlight",
      popular: false,
      comingSoon: true,
      features: [
        "Everything in Storytime Plus",
        "Up to 5 child profiles",
        "Advanced AI-generated illustrations (3 per story)",
        "Audio narration (AI voice)",
        "Magic Letters (from characters or parents)",
        "Custom character creation and design",
        "Family story sharing",
        "Priority feature voting",
        "Early access to new features",
        "White-glove onboarding",
        "Priority support",
      ],
      limitations: [],
      cta: "Coming Soon",
      ctaVariant: "outline" as const,
    },
  ];

  const comparisonFeatures = COMPARISON_FEATURES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-story-cream via-story-mist to-story-moonlight">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-story-bark mb-4">
            Choose Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-story-gold via-story-sunset to-story-forest ml-3">
              Storytelling
            </span>
            <br />
            Adventure
          </h1>
          <p className="text-xl text-story-bark/70 max-w-3xl mx-auto mb-8">
            From first bedtime stories to family traditions, we have the perfect
            plan to create magical moments for your family.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-story-mist p-1 rounded-lg flex">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-white text-story-bark shadow-sm"
                    : "text-story-bark/60 hover:text-story-bark"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                  billingPeriod === "yearly"
                    ? "bg-white text-story-bark shadow-sm"
                    : "text-story-bark/60 hover:text-story-bark"
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5">
                  Save 30%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                tier.comingSoon
                  ? "opacity-75 cursor-not-allowed"
                  : ""
              } ${
                tier.popular ? "ring-2 ring-story-gold shadow-2xl" : "shadow-xl"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-gradient-to-r from-story-gold to-story-sunset text-white text-center py-2 text-sm font-semibold">
                    <Star className="inline h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              {tier.comingSoon && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-gradient-to-r from-story-bark/60 to-story-bark/70 text-white text-center py-2 text-sm font-semibold">
                    <Sparkles className="inline h-4 w-4 mr-1" />
                    Coming Soon
                  </div>
                </div>
              )}

              <CardHeader className={`pb-6 ${tier.popular ? "pt-12" : "pt-6"}`}>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tier.color} flex items-center justify-center text-white mb-4`}
                >
                  {tier.icon}
                </div>

                <CardTitle className="text-2xl font-bold font-serif text-story-bark">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-story-bark/70">
                  {tier.subtitle}
                </CardDescription>

                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-story-bark">
                      {tier.id === "free"
                        ? tier.price
                        : billingPeriod === "yearly" && tier.yearlyPrice
                          ? tier.yearlyPrice
                          : tier.price}
                    </span>
                    {tier.period && tier.id !== "free" && (
                      <span className="text-story-bark/70 ml-2">
                        /{billingPeriod === "yearly" ? "year" : "month"}
                      </span>
                    )}
                    {tier.id === "free" && tier.period && (
                      <span className="text-story-bark/70 ml-2">/{tier.period}</span>
                    )}
                  </div>
                  {billingPeriod === "yearly" && tier.yearlyPrice && (
                    <div className="mt-1">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Save 30% vs monthly
                      </Badge>
                    </div>
                  )}
                  {billingPeriod === "monthly" && tier.yearlyPrice && (
                    <div className="mt-1 text-sm text-story-bark/60">
                      {tier.yearlyPrice}/year available
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-8">
                <p className="text-story-bark/70 mb-6">{tier.description}</p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start space-x-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-story-bark/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.ctaVariant}
                  onClick={() => handlePlanClick(tier.id)}
                  disabled={tier.comingSoon}
                  className={`w-full py-3 ${
                    tier.popular
                      ? "bg-gradient-to-r from-story-gold to-story-sunset hover:from-story-gold hover:to-story-gold text-white"
                      : ""
                  } ${tier.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {tier.id === "family" && !tier.comingSoon && (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  {tier.comingSoon && <Sparkles className="h-4 w-4 mr-2" />}
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="px-8 py-6 bg-gradient-to-r from-story-gold to-story-forest text-white">
            <h3 className="text-2xl font-bold font-serif text-center">
              Compare All Features
            </h3>
            <p className="text-center text-white/80 mt-2">
              See what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-story-cream">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-story-bark">
                    Features
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-story-bark">
                    Starter Magic
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-story-bark">
                    Storytime Plus
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-story-bark">
                    Storytime Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-story-mist">
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-story-cream">
                    <td className="px-6 py-4 text-sm font-medium text-story-bark">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="flex items-center gap-2 text-left hover:text-story-gold transition-colors group"
                            onClick={() => setSelectedFeature(feature)}
                          >
                            <span className="group-hover:underline">{feature.name}</span>
                            <Info className="h-4 w-4 text-story-bark/40 group-hover:text-story-gold transition-colors" />
                          </button>
                        </DialogTrigger>
                        <FeatureModal feature={feature} />
                      </Dialog>
                    </td>
                    <td className="px-6 py-4 text-sm text-story-bark/70 text-center">
                      {feature.free}
                    </td>
                    <td className="px-6 py-4 text-sm text-story-bark/70 text-center">
                      {feature.premium}
                    </td>
                    <td className="px-6 py-4 text-sm text-story-bark/70 text-center">
                      {feature.family}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold font-serif text-story-bark mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-story-bark mb-3">
                Can I change plans anytime?
              </h4>
              <p className="text-story-bark/70">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-story-bark mb-3">
                What happens to my stories if I downgrade?
              </h4>
              <p className="text-story-bark/70">
                Your stories are always saved. You just won't be able to create
                new ones beyond your plan limits.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-story-bark mb-3">
                Is there a family discount?
              </h4>
              <p className="text-story-bark/70">
                The Storytime Pro plan is designed for families with multiple
                children and offers the best value per child.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-story-bark mb-3">
                Do you offer yearly pricing?
              </h4>
              <p className="text-story-bark/70">
                Yes! Save 30% when you pay annually. The yearly option is
                available for both paid plans.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-story-gold via-story-sunset to-story-forest rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold font-serif mb-4">Ready to Create Magic?</h3>
          <p className="text-lg mb-6 text-white/90">
            Join thousands of families creating unforgettable bedtime memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => handlePlanClick("free")}
              className="bg-white text-story-gold hover:bg-story-cream font-semibold"
            >
              Start Free Today
            </Button>
            <Button
              onClick={() => handlePlanClick("premium")}
              className="bg-white text-story-gold hover:bg-story-cream border-2 border-white font-semibold shadow-lg"
            >
              Upgrade to Plus
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}