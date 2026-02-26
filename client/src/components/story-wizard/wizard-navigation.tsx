import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between pt-8 border-t border-story-mist">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Previous</span>
      </Button>

      {currentStep < totalSteps ? (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center space-x-2 bg-gradient-to-r from-story-gold to-story-sunset hover:bg-story-sunset"
        >
          <span>Next</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={!canProceed}
          className="flex items-center space-x-2 bg-gradient-to-r from-story-gold to-story-sunset hover:bg-story-sunset"
        >
          <Sparkles className="h-4 w-4" />
          <span>Create Story</span>
        </Button>
      )}
    </div>
  );
}
