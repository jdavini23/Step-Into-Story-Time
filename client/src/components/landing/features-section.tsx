
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 mb-4">
            Why Parents Keep Coming Back to Step Into Storytime
          </h3>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Create bedtime magic that's fast, personal, and unforgettable.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
            onMouseEnter={() => setHoveredFeature(0)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CardContent className="p-6 sm:p-8 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${hoveredFeature === 0 ? 'animate-pulse scale-110' : ''}`}>
                <span className="text-2xl">🎨</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-purple-600 transition-colors">Stories Starring Your Child</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Every tale is built around your child's name, age, and favorite themes — making them the hero of every adventure.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
            onMouseEnter={() => setHoveredFeature(1)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${hoveredFeature === 1 ? 'animate-pulse scale-110' : ''}`}>
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-blue-600 transition-colors">Ready in Under 2 Minutes</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Create a complete bedtime story in less time than it takes to brush teeth. Perfect for busy nights.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
            onMouseEnter={() => setHoveredFeature(2)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${hoveredFeature === 2 ? 'animate-pulse scale-110' : ''}`}>
                <span className="text-2xl">📖</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-yellow-600 transition-colors">Build a Story Library</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Download as PDF, share with loved ones, and save your favorites to relive anytime.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
            onMouseEnter={() => setHoveredFeature(3)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${hoveredFeature === 3 ? 'animate-pulse scale-110' : ''}`}>
                <span className="text-2xl">🌙</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-purple-600 transition-colors">Match Their Mood</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Choose from adventurous, calming, silly, or educational tones to fit any bedtime vibe.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
            onMouseEnter={() => setHoveredFeature(4)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${hoveredFeature === 4 ? 'animate-pulse scale-110' : ''}`}>
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-blue-600 transition-colors">Smart Stories, Made Simple</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Our AI crafts high-quality, age-appropriate stories that spark wonder and hold attention.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
            onMouseEnter={() => setHoveredFeature(5)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${hoveredFeature === 5 ? 'animate-pulse scale-110' : ''}`}>
                <span className="text-2xl">❤️</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-yellow-600 transition-colors">End the Day Connected</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Make bedtime a special moment — shared stories that build closeness and calm.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
