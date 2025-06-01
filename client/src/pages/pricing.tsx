
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Crown, Sparkles, Heart, Users } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const tiers = [
    {
      id: "free",
      name: "Starter Magic",
      subtitle: "Perfect for new families",
      price: "Free",
      period: "forever",
      description: "Get started with magical bedtime stories",
      icon: <Sparkles className="h-6 w-6" />,
      color: "from-blue-500 to-purple-500",
      popular: false,
      features: [
        "3 stories per week",
        "Basic personalization (child's name, 1 trait)",
        "3 popular themes (bedtime, fantasy, adventure)",
        "Save last 3 stories",
        "Read online (text-only)",
        "Community support"
      ],
      limitations: [
        "Limited story generation",
        "No illustrations or voice",
        "Basic personalization only"
      ],
      cta: "Start for Free",
      ctaVariant: "outline" as const,
      href: "/api/login?signup=true"
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
      color: "from-purple-500 to-pink-500",
      popular: true,
      features: [
        "Unlimited stories",
        "Full personalization (name, traits, family members, interests)",
        "Access to all story genres",
        "Multiple story lengths (short, medium, long)",
        "AI-generated illustrations (1 per story)",
        "Save and organize full story library",
        "Printable PDFs",
        "Scheduled story delivery (email or app push)",
        "Premium support"
      ],
      limitations: [],
      cta: "Upgrade to Plus",
      ctaVariant: "default" as const,
      href: "/subscribe?tier=premium"
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
      color: "from-emerald-500 to-blue-500",
      popular: false,
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
        "Priority support"
      ],
      limitations: [],
      cta: "Go Pro",
      ctaVariant: "default" as const,
      href: "/subscribe?tier=family"
    }
  ];

  const comparisonFeatures = [
    { name: "Stories per week", free: "3", premium: "Unlimited", family: "Unlimited" },
    { name: "Child profiles", free: "1", premium: "1", family: "Up to 5" },
    { name: "Story personalization", free: "Basic", premium: "Full", family: "Advanced" },
    { name: "Story themes", free: "3 popular", premium: "All genres", family: "All genres + Custom" },
    { name: "Story lengths", free: "Short only", premium: "Short, Medium, Long", family: "All + Custom" },
    { name: "AI illustrations", free: "None", premium: "1 per story", family: "3 per story" },
    { name: "Audio narration", free: "None", premium: "None", family: "AI voice" },
    { name: "Story library", free: "Last 3", premium: "Unlimited", family: "Unlimited + Sharing" },
    { name: "PDF downloads", free: "None", premium: "Yes", family: "Yes + Enhanced" },
    { name: "Magic Letters", free: "None", premium: "None", family: "Yes" },
    { name: "Custom characters", free: "None", premium: "None", family: "Yes" },
    { name: "Support", free: "Community", premium: "Premium", family: "Priority" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 ml-3">
              Storytelling
            </span>
            <br />Adventure
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From first bedtime stories to family traditions, we have the perfect plan to create magical moments for your family.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => (
            <Card 
              key={tier.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                tier.popular ? 'ring-2 ring-purple-500 shadow-2xl' : 'shadow-xl'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                    <Star className="inline h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className={`pb-6 ${tier.popular ? 'pt-12' : 'pt-6'}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tier.color} flex items-center justify-center text-white mb-4`}>
                  {tier.icon}
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {tier.subtitle}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    {tier.period && (
                      <span className="text-gray-600 ml-2">/{tier.period}</span>
                    )}
                  </div>
                  {tier.yearlyPrice && (
                    <div className="mt-1">
                      <span className="text-lg text-green-600 font-semibold">{tier.yearlyPrice}/{tier.yearlyPeriod}</span>
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        Save 30%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-8">
                <p className="text-gray-600 mb-6">{tier.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href={tier.href}>
                  <Button 
                    variant={tier.ctaVariant}
                    className={`w-full py-3 ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                        : ''
                    }`}
                  >
                    {tier.id === 'family' && <Crown className="h-4 w-4 mr-2" />}
                    {tier.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <h3 className="text-2xl font-bold text-center">Compare All Features</h3>
            <p className="text-center text-purple-100 mt-2">See what's included in each plan</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Starter Magic</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Storytime Plus</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Storytime Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{feature.free}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{feature.premium}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{feature.family}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Can I change plans anytime?</h4>
              <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">What happens to my stories if I downgrade?</h4>
              <p className="text-gray-600">Your stories are always saved. You just won't be able to create new ones beyond your plan limits.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Is there a family discount?</h4>
              <p className="text-gray-600">The Storytime Pro plan is designed for families with multiple children and offers the best value per child.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Do you offer yearly pricing?</h4>
              <p className="text-gray-600">Yes! Save 30% when you pay annually. The yearly option is available for both paid plans.</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Create Magic?</h3>
          <p className="text-lg mb-6 text-purple-100">Join thousands of families creating unforgettable bedtime memories</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/login?signup=true">
              <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                Start Free Today
              </Button>
            </Link>
            <Link href="/subscribe?tier=premium">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
