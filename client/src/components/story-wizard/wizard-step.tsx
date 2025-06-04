
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface WizardStepProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  icon: string;
  children: ReactNode;
}

export function WizardStep({ currentStep, totalSteps, title, subtitle, icon, children }: WizardStepProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-purple-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">Almost there! ✨</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Card className="shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">{title}</h3>
              <p className="text-gray-600">{subtitle}</p>
            </div>

            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
