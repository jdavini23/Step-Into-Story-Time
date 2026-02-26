import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function HeroSection() {
  const [storyVisible, setStoryVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStoryVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-story-bark leading-tight mb-6">
            Create Magical Bedtime Stories in Minutes
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-story-sunset via-story-gold to-story-forest ml-3">
              That Star Your Child
            </span>
          </h1>
          <p className="text-xl text-story-bark/80 mb-8 leading-relaxed">
            Create personalized bedtime stories in minutes — starring your
            child.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
            <Button
              onClick={() => (window.location.href = "/story-wizard")}
              className="bg-story-gold hover:bg-story-sunset text-story-night px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Tell Tonight's Story
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/pricing")}
              className="border-2 border-story-forest text-story-forest hover:bg-story-forest hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
            >
              View Pricing
            </Button>
          </div>

          <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-story-bark/60">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-story-forest" />
              <span>Under 2 minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-story-forest" />
              <span>Personalized for your child</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-story-forest" />
              <span>Save & reread anytime</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Story Preview Card */}
          <div
            className={`bg-white rounded-2xl shadow-2xl p-8 border border-story-mist transform transition-all duration-1000 ${storyVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-story-gold rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📖</span>
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-story-bark">
                    Emma's Magical Garden Adventure
                  </h4>
                  <p className="text-sm text-story-bark/60">
                    Created just now · 3 min read
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-story-mist text-story-forest rounded-full text-xs font-medium">
                Adventurous
              </div>
            </div>

            <div className="prose prose-sm text-story-bark/80 leading-relaxed">
              <p className="mb-4">
                Once upon a time, in a cozy little house on Maple Street, lived
                a brave and curious girl named{" "}
                <span className="font-semibold text-story-gold">
                  Emma
                </span>
                . Emma had always wondered what lay beyond the old wooden gate
                at the end of her grandmother's garden.
              </p>
              <p className="mb-4">
                One sunny morning, Emma discovered something extraordinary - the
                gate was glowing with a soft, golden light! As she pushed it
                open, she gasped in wonder. Before her stretched the most
                beautiful garden she had ever seen, filled with flowers that
                sparkled like jewels and trees that hummed gentle melodies.
              </p>
              <div className="bg-story-cream p-4 rounded-lg border-l-4 border-story-gold">
                <p className="text-story-bark italic">
                  "What an amazing adventure awaits you, Emma! Remember, the
                  bravest hearts discover the most magical places. Sweet dreams,
                  little explorer." 🌙
                </p>
              </div>
              {/* Reading Progress Bar */}
              <div className="mt-4 h-1 bg-story-mist rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-story-gold to-story-sunset rounded-full w-2/3"></div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-story-bark/60" role="list" aria-label="Story characteristics">
                <span className="flex items-center space-x-1" role="listitem">
                  <span aria-hidden="true">👶</span>
                  <span>Age 6</span>
                </span>
                <span className="flex items-center space-x-1" role="listitem">
                  <span aria-hidden="true">🎭</span>
                  <span>Adventure</span>
                </span>
                <span className="flex items-center space-x-1" role="listitem">
                  <span aria-hidden="true">⏱️</span>
                  <span>3 min</span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-story-forest border-story-forest hover:bg-story-forest hover:text-white"
                aria-label="Read full sample story"
              >
                Read Full Story
              </Button>
            </div>
          </div>

          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-story-cream via-story-mist to-story-moonlight rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
