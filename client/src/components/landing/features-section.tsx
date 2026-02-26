import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    emoji: "🎨",
    title: "Stories Starring Your Child",
    description: "Every tale is built around your child's name, age, and favorite themes — making them the hero of every adventure.",
    color: "bg-story-gold",
  },
  {
    emoji: "⚡",
    title: "Ready in Under 2 Minutes",
    description: "Create a complete bedtime story in less time than it takes to brush teeth. Perfect for busy nights.",
    color: "bg-story-moonlight",
  },
  {
    emoji: "📖",
    title: "Build a Story Library",
    description: "Download as PDF, share with loved ones, and save your favorites to relive anytime.",
    color: "bg-story-sunset",
  },
  {
    emoji: "🌙",
    title: "Match Their Mood",
    description: "Choose from adventurous, calming, silly, or educational tones to fit any bedtime vibe.",
    color: "bg-story-forest",
  },
  {
    emoji: "🧠",
    title: "Smart Stories, Made Simple",
    description: "Our AI crafts high-quality, age-appropriate stories that spark wonder and hold attention.",
    color: "bg-story-gold",
  },
  {
    emoji: "❤️",
    title: "End the Day Connected",
    description: "Make bedtime a special moment — shared stories that build closeness and calm.",
    color: "bg-story-sunset",
  },
];

export default function FeaturesSection() {
  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-story-bark mb-4">
            Why Parents Keep Coming Back to Step Into Storytime
          </h3>
          <p className="text-lg sm:text-xl text-story-bark/70 max-w-3xl mx-auto">
            Create bedtime magic that's fast, personal, and unforgettable.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <CardContent className="p-6 sm:p-8 text-center">
                <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <span className="text-2xl">{feature.emoji}</span>
                </div>
                <h4 className="font-serif text-xl font-semibold text-story-bark mb-4 group-hover:text-story-gold transition-colors">
                  {feature.title}
                </h4>
                <p className="text-story-bark/70">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
