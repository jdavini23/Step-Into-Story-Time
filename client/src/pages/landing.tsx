import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function Landing() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [storyVisible, setStoryVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setStoryVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(stepTimer);
  }, []);

  const steps = [
    { icon: "👶", title: "Tell us about your child", description: "Name, age, favorite themes" },
    { icon: "🎭", title: "Choose story style", description: "Adventure, calming, silly, or educational" },
    { icon: "✨", title: "Get your story", description: "Ready in under 2 minutes" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-700 leading-tight mb-6">
              Create 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 ml-3">magical</span>
              <br />bedtime stories in minutes
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform bedtime into an adventure with AI-powered personalized stories that feature your child as the hero.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button 
                onClick={() => window.location.href = "/api/login?signup=true"}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                ✨ Start Your Story
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/pricing"}
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
              >
                💰 View Pricing
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                <span>Under 2 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                <span>Personalized for your child</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                <span>Save & reread anytime</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Story Preview Card */}
            <div className={`bg-white rounded-2xl shadow-2xl p-8 border border-purple-100 transform transition-all duration-1000 ${storyVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} hover:scale-105 hover:shadow-3xl cursor-pointer group`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center group-hover:animate-spin">
                    <span className="text-white text-lg">📖</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">Emma's Magical Garden Adventure</h4>
                    <p className="text-sm text-gray-500">Created just now • 3 min read</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium group-hover:bg-purple-600 group-hover:text-white transition-all">
                  Adventurous
                </div>
              </div>

              <div className="prose prose-sm text-gray-600 leading-relaxed">
                <p className="mb-4 group-hover:text-gray-700 transition-colors">
                  Once upon a time, in a cozy little house on Maple Street, lived a brave and curious girl named <span className="font-semibold text-purple-600 group-hover:text-purple-700 transition-colors">Emma</span>. Emma had always wondered what lay beyond the old wooden gate at the end of her grandmother's garden.
                </p>
                <p className="mb-4 group-hover:text-gray-700 transition-colors">
                  One sunny morning, Emma discovered something extraordinary - the gate was glowing with a soft, golden light! As she pushed it open, she gasped in wonder. Before her stretched the most beautiful garden she had ever seen, filled with flowers that sparkled like jewels and trees that hummed gentle melodies.
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-400 group-hover:border-purple-500 group-hover:shadow-lg transition-all">
                  <p className="text-purple-700 italic group-hover:text-purple-800 transition-colors">
                    "What an amazing adventure awaits you, Emma! Remember, the bravest hearts discover the most magical places. Sweet dreams, little explorer." 🌙✨
                  </p>
                </div>
                {/* Reading Progress Bar */}
                <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full transform transition-all duration-3000 group-hover:w-full w-2/3"></div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span>👶</span>
                    <span>Age 6</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>🎭</span>
                    <span>Adventure</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>⏱️</span>
                    <span>3 min</span>
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white"
                >
                  Read Full Story
                </Button>
              </div>
            </div>

            {/* Interactive Floating Elements */}
            <div className="absolute -top-4 -left-4 bg-white p-3 rounded-xl shadow-lg animate-bounce hover:scale-125 hover:rotate-12 transition-transform cursor-pointer hover:shadow-xl">
              <span className="text-2xl">📚</span>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg animate-bounce hover:scale-125 hover:rotate-12 transition-transform cursor-pointer hover:shadow-xl" style={{animationDelay: '1s'}}>
              <span className="text-2xl">✨</span>
            </div>
            <div className="absolute top-1/2 -right-6 bg-white p-3 rounded-xl shadow-lg animate-bounce hover:scale-125 hover:rotate-12 transition-transform cursor-pointer hover:shadow-xl" style={{animationDelay: '1.5s'}}>
              <span className="text-2xl">🌙</span>
            </div>

            {/* Sparkle Animation */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
              <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
            </div>

            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
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

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4">
              How It Works
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Creating magical bedtime stories is as easy as 1-2-3!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className={`w-20 h-20 bg-gradient-to-r ${
                  index === 0 ? 'from-purple-600 to-blue-500' : 
                  index === 1 ? 'from-blue-500 to-yellow-500' : 
                  'from-yellow-500 to-purple-600'
                } rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl ${
                  currentStep === index ? 'animate-pulse scale-110 shadow-xl' : ''
                }`}>
                  <span className="text-3xl font-bold text-white">{index + 1}</span>
                </div>
                <h4 className={`text-xl font-semibold text-gray-700 mb-4 group-hover:text-purple-600 transition-colors ${
                  currentStep === index ? 'text-purple-600' : ''
                }`}>
                  {step.title}
                </h4>
                <p className={`text-gray-600 group-hover:text-gray-700 transition-colors ${
                  currentStep === index ? 'text-gray-700' : ''
                }`}>
                  {step.description}
                </p>

                {/* Progress indicator */}
                <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto max-w-32">
                  <div className={`h-full bg-gradient-to-r ${
                    index === 0 ? 'from-purple-600 to-blue-500' : 
                    index === 1 ? 'from-blue-500 to-yellow-500' : 
                    'from-yellow-500 to-purple-600'
                  } rounded-full transition-all duration-1000 ${
                    currentStep === index ? 'w-full' : 'w-0'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4">
              What Parents Are Saying
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of families creating magical bedtime memories.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} className="text-xl">{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  "My daughter Emma loves seeing herself as the hero in these stories! It's made bedtime so much more special and she actually looks forward to it now."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg">👩</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Sarah M.</p>
                    <p className="text-sm text-gray-500">Mom of 2</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} className="text-xl">{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  "As a busy dad, this is a lifesaver! I can create a personalized story for Jake in minutes, and the quality is amazing. He thinks I'm the best storyteller ever!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg">👨</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Michael R.</p>
                    <p className="text-sm text-gray-500">Father of 1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} className="text-xl">{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  "The educational stories are fantastic! Lily learns while being entertained. We've built up quite a library and she loves rereading her favorites."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg">👩</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Jennifer L.</p>
                    <p className="text-sm text-gray-500">Teacher & Mom</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Magical Bedtime Memories?
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of families who have transformed bedtime into the most anticipated part of the day.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login?signup=true"}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center group-hover:opacity-0 transition-opacity duration-300">
              <span className="group-hover:animate-spin mr-2">✨</span>
              Start Creating Stories Now
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
            <span className="absolute inset-0 flex items-center justify-center text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <span className="animate-spin mr-2">✨</span>
              Let's Create Magic!
            </span>
          </Button>
          <p className="text-white/80 text-sm mt-4">
            Free to start • No credit card required • Create your first story in under 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
}