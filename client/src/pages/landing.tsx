
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50">
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
                onClick={() => window.location.href = "/api/login"}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                ✨ Start Your Story
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
              >
                View Sample Stories
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
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-purple-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">📖</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Emma's Magical Garden Adventure</h4>
                    <p className="text-sm text-gray-500">Created just now • 3 min read</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Adventurous
                </div>
              </div>
              
              <div className="prose prose-sm text-gray-600 leading-relaxed">
                <p className="mb-4">
                  Once upon a time, in a cozy little house on Maple Street, lived a brave and curious girl named <span className="font-semibold text-purple-600">Emma</span>. Emma had always wondered what lay beyond the old wooden gate at the end of her grandmother's garden.
                </p>
                <p className="mb-4">
                  One sunny morning, Emma discovered something extraordinary - the gate was glowing with a soft, golden light! As she pushed it open, she gasped in wonder. Before her stretched the most beautiful garden she had ever seen, filled with flowers that sparkled like jewels and trees that hummed gentle melodies.
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <p className="text-purple-700 italic">
                    "What an amazing adventure awaits you, Emma! Remember, the bravest hearts discover the most magical places. Sweet dreams, little explorer." 🌙✨
                  </p>
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
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 bg-white p-3 rounded-xl shadow-lg animate-bounce">
              <span className="text-2xl">📚</span>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg animate-bounce" style={{animationDelay: '1s'}}>
              <span className="text-2xl">✨</span>
            </div>
            <div className="absolute top-1/2 -right-6 bg-white p-3 rounded-xl shadow-lg animate-bounce" style={{animationDelay: '1.5s'}}>
              <span className="text-2xl">🌙</span>
            </div>
            
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4">
              Why Parents Love Step Into Storytime
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create unique, personalized bedtime stories that spark imagination and create lasting memories.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎨</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Fully Personalized</h4>
                <p className="text-gray-600">
                  Every story features your child as the main character, with their name, age, and favorite themes woven throughout.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Lightning Fast</h4>
                <p className="text-gray-600">
                  Generate a complete, engaging bedtime story in under 2 minutes. Perfect for busy parents and eager kids.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📖</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Save & Share</h4>
                <p className="text-gray-600">
                  Build a personal library of stories. Download as PDF, share with family, and reread favorites anytime.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🌙</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Multiple Tones</h4>
                <p className="text-gray-600">
                  Choose from adventurous, calming, silly, or educational tones to match your child's mood and bedtime needs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🧠</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">AI-Powered</h4>
                <p className="text-gray-600">
                  Advanced AI creates unique, high-quality stories that are age-appropriate and engaging for your child.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">❤️</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Bonding Time</h4>
                <p className="text-gray-600">
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
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4">Tell Us About Your Child</h4>
              <p className="text-gray-600">
                Share your child's name, age, and favorite themes. The more we know, the more personalized the story becomes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4">Choose Your Story Style</h4>
              <p className="text-gray-600">
                Pick the perfect tone - adventurous for excitement, calming for bedtime, silly for giggles, or educational for learning.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-4">Enjoy Your Story</h4>
              <p className="text-gray-600">
                In under 2 minutes, receive a unique, personalized story ready to read, save, and share with your little one.
              </p>
            </div>
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
            onClick={() => window.location.href = "/api/login"}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            ✨ Start Creating Stories Now
          </Button>
          <p className="text-white/80 text-sm mt-4">
            Free to start • No credit card required • Create your first story in under 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
