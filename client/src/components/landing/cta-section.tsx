
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Turn Tonight Into a Story They'll Remember
        </h3>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join parents using Step Into Storytime to end each day with connection and creativity.
        </p>
        <Button 
          onClick={() => window.location.href = "/api/login?signup=true"}
          className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center group-hover:opacity-0 transition-opacity duration-300">
            <span className="group-hover:animate-spin mr-2">🌙</span>
            Start Your Free Story
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
          <span className="absolute inset-0 flex items-center justify-center text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <span className="animate-spin mr-2">🌙</span>
            Let's Create Magic!
          </span>
        </Button>
        <p className="text-white/80 text-sm mt-4">
          No signup stress — just smiles and stories in minutes.
        </p>
      </div>
    </div>
  );
}
