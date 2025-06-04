
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 mb-4">
            Why Parents Love Step Into Storytime
          </h3>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Create unique, personalized bedtime stories that spark imagination and create lasting memories.
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
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-purple-600 transition-colors">Fully Personalized</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Every story features your child as the main character, with their name, age, and favorite themes woven throughout.
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
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-blue-600 transition-colors">Lightning Fast</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Generate a complete, engaging bedtime story in under 2 minutes. Perfect for busy parents and eager kids.
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
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-yellow-600 transition-colors">Save & Share</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Build a personal library of stories. Download as PDF, share with family, and reread favorites anytime.
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
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-purple-600 transition-colors">Multiple Tones</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Choose from adventurous, calming, silly, or educational tones to match your child's mood and bedtime needs.
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
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-blue-600 transition-colors">AI-Powered</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Advanced AI creates unique, high-quality stories that are age-appropriate and engaging for your child.
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
              <h4 className="text-xl font-semibold text-gray-700 mb-4 group-hover:text-yellow-600 transition-colors">Bonding Time</h4>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                Create special moments and strengthen your bond through personalized storytelling experiences.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
