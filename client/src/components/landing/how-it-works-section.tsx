
import { useState, useEffect } from "react";

export default function HowItWorksSection() {
  const [currentStep, setCurrentStep] = useState(0);

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
  );
}
