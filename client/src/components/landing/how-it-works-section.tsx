import { useState, useEffect } from "react";

export default function HowItWorksSection() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(stepTimer);
  }, []);

  const steps = [
    {
      title: "Tell us about your child",
      description: "Name, age, and what they love — we'll take it from there.",
      color: "bg-story-gold",
    },
    {
      title: "Choose a story style",
      description: "Pick a tone: adventurous, calming, silly, or educational.",
      color: "bg-story-sunset",
    },
    {
      title: "Get your story",
      description:
        "In under 2 minutes, your personalized story is ready to read, save, or share.",
      color: "bg-story-forest",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-story-cream via-story-mist to-story-moonlight py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-serif text-3xl md:text-4xl font-bold text-story-bark mb-4">
            How It Works
          </h3>
          <p className="text-xl text-story-bark/70 max-w-3xl mx-auto">
            Bedtime magic in 3 easy steps — no stress, just smiles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group cursor-pointer">
              <div
                className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                  currentStep === index ? "shadow-xl ring-4 ring-white" : ""
                }`}
              >
                <span className="text-3xl font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <h4
                className={`font-serif text-xl font-semibold text-story-bark mb-4 transition-colors ${
                  currentStep === index ? "text-story-gold" : ""
                }`}
              >
                {step.title}
              </h4>
              <p
                className={`text-story-bark/70 transition-colors ${
                  currentStep === index ? "text-story-bark" : ""
                }`}
              >
                {step.description}
              </p>

              {/* Progress indicator */}
              <div className="mt-4 h-1 bg-story-mist rounded-full overflow-hidden mx-auto max-w-32">
                <div
                  className={`h-full bg-gradient-to-r from-story-gold to-story-sunset rounded-full transition-all duration-1000 ${
                    currentStep === index ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
