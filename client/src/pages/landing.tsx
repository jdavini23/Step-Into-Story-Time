
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
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Parent reading bedtime story to child" 
              className="rounded-2xl shadow-2xl w-full h-auto animate-pulse" 
            />
            
            <div className="absolute -top-4 -left-4 bg-white p-3 rounded-xl shadow-lg animate-bounce">
              <span className="text-2xl">📚</span>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg animate-bounce" style={{animationDelay: '1s'}}>
              <span className="text-2xl">✨</span>
            </div>
            <div className="absolute top-1/2 -right-6 bg-white p-3 rounded-xl shadow-lg animate-bounce" style={{animationDelay: '1.5s'}}>
              <span className="text-2xl">🌙</span>
            </div>
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
