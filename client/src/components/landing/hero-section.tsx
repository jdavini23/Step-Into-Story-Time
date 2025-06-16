import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-700 leading-tight mb-6">
            Create Magical Bedtime Stories in Minutes
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 ml-3">
              That Star Your Child
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Create personalized bedtime stories in minutes — starring your
            child.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
            <Button
              onClick={() => (window.location.href = "/api/login?signup=true")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              ✨ Tell Tonight's Story
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/pricing")}
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
            >
              💰 View Pricing
            </Button>
          </div>

          <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span>Under 2 minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span>Personalized for your child</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span>Save & reread anytime</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Story Preview Card */}
          <div
            className={`bg-white rounded-2xl shadow-2xl p-8 border border-purple-100 transform transition-all duration-1000 ${storyVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} hover:scale-105 hover:shadow-3xl cursor-pointer group`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center group-hover:animate-spin">
                  <span className="text-white text-lg">📖</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                    Emma's Magical Garden Adventure
                  </h4>
                  <p className="text-sm text-gray-500">
                    Created just now • 3 min read
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium group-hover:bg-purple-600 group-hover:text-white transition-all">
                Adventurous
              </div>
            </div>

            <div className="prose prose-sm text-gray-600 leading-relaxed">
              <p className="mb-4 group-hover:text-gray-700 transition-colors">
                Once upon a time, in a cozy little house on Maple Street, lived
                a brave and curious girl named{" "}
                <span className="font-semibold text-purple-600 group-hover:text-purple-700 transition-colors">
                  Emma
                </span>
                . Emma had always wondered what lay beyond the old wooden gate
                at the end of her grandmother's garden.
              </p>
              <p className="mb-4 group-hover:text-gray-700 transition-colors">
                One sunny morning, Emma discovered something extraordinary - the
                gate was glowing with a soft, golden light! As she pushed it
                open, she gasped in wonder. Before her stretched the most
                beautiful garden she had ever seen, filled with flowers that
                sparkled like jewels and trees that hummed gentle melodies.
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-400 group-hover:border-purple-500 group-hover:shadow-lg transition-all">
                <p className="text-purple-700 italic group-hover:text-purple-800 transition-colors">
                  "What an amazing adventure awaits you, Emma! Remember, the
                  bravest hearts discover the most magical places. Sweet dreams,
                  little explorer." 🌙✨
                </p>
              </div>
              {/* Reading Progress Bar */}
              <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full transform transition-all duration-3000 group-hover:w-full w-2/3"></div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500" role="list" aria-label="Story characteristics">
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
                className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white"
                aria-label="Read full sample story"
              >
                Read Full Story
              </Button>
            </div>
          </div>

          {/* Interactive Floating Elements */}
          <div className="absolute -top-4 -left-4 bg-white p-3 rounded-xl shadow-lg animate-bounce hover:scale-125 hover:rotate-12 transition-transform cursor-pointer hover:shadow-xl" aria-label="Storybook icon" role="img">
            <span className="text-2xl" aria-hidden="true">📚</span>
          </div>
          <div
            className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg animate-bounce hover:scale-125 hover:rotate-12 transition-transform cursor-pointer hover:shadow-xl"
            style={{ animationDelay: "1s" }}
            aria-label="Magic sparkles icon"
            role="img"
          >
            <span className="text-2xl" aria-hidden="true">✨</span>
          </div>
          <div
            className="absolute top-1/2 -right-6 bg-white p-3 rounded-xl shadow-lg animate-bounce hover:scale-125 hover:rotate-12 transition-transform cursor-pointer hover:shadow-xl"
            style={{ animationDelay: "1.5s" }}
            aria-label="Bedtime moon icon"
            role="img"
          >
            <span className="text-2xl" aria-hidden="true">🌙</span>
          </div>

          {/* Sparkle Animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-3/4 left-3/4 w-1 h-1 bg-purple-400 rounded-full animate-ping"
              style={{ animationDelay: "3s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>

          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
