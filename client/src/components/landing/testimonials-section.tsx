import { Card, CardContent } from "@/components/ui/card";

export default function TestimonialsSection() {
  const testimonials = [
    {
      rating: 5,
      text: "My daughter Emma loves seeing herself as the hero in these stories! It's made bedtime so much more special and she actually looks forward to it now.",
      author: "Sarah M.",
      role: "Mom of 2",
      emoji: "👩",
    },
    {
      rating: 5,
      text: "As a busy dad, this is a lifesaver! I can create a personalized story for Jake in minutes, and the quality is amazing. He thinks I'm the best storyteller ever!",
      author: "Michael R.",
      role: "Father of 1",
      emoji: "👨",
    },
    {
      rating: 5,
      text: "The educational stories are fantastic! Lily learns while being entertained. We've built up quite a library and she loves rereading her favorites.",
      author: "Jennifer L.",
      role: "Teacher & Mom",
      emoji: "👩",
    },
  ];

  return (
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
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} className="text-xl">
                        {star}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 ${
                      index === 0
                        ? "bg-purple-100"
                        : index === 1
                          ? "bg-blue-100"
                          : "bg-yellow-100"
                    } rounded-full flex items-center justify-center mr-4`}
                  >
                    <span className="text-lg">{testimonial.emoji}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
