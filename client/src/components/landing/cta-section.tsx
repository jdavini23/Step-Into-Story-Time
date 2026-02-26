import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <div className="bg-gradient-to-r from-story-gold via-story-sunset to-story-forest py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
          Turn Tonight Into a Story They'll Remember
        </h3>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join parents using Step Into Storytime to end each day with connection
          and creativity.
        </p>
        <Button
          onClick={() => (window.location.href = "/api/login?signup=true")}
          className="bg-white text-story-bark hover:bg-story-cream px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Start Your Free Story
        </Button>
        <p className="text-white/80 text-sm mt-4">
          No signup stress — just smiles and stories in minutes.
        </p>
      </div>
    </div>
  );
}
