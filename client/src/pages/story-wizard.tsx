import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTierInfo } from "@/hooks/useTierInfo";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { InsertStory } from "@shared/schema";
import LoadingOverlay from "@/components/loading-overlay";
import { WizardStep } from "@/components/story-wizard/wizard-step";
import { ChildInfoStep } from "@/components/story-wizard/child-info-step";
import { StoryStyleStep } from "@/components/story-wizard/story-style-step";
import { PersonalTouchStep } from "@/components/story-wizard/personal-touch-step";
import { TierStatusAlert } from "@/components/story-wizard/tier-status-alert";
import { WizardNavigation } from "@/components/story-wizard/wizard-navigation";

const STEPS = [
  { id: 1, title: "Tell us about your little one", subtitle: "We'll create a story just for them", icon: "👶" },
  { id: 2, title: "Choose the story style", subtitle: "What kind of adventure should it be?", icon: "🎭" },
  { id: 3, title: "Add a personal touch", subtitle: "Make it extra special with a personal message", icon: "💝" },
];

export default function StoryWizard() {
  const { user, isLoading } = useAuth();
  const { data: tierInfo, isLoading: tierLoading } = useTierInfo();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InsertStory>>({
    childName: "",
    childAge: 4,
    childGender: "",
    favoriteThemes: "",
    tone: "",
    length: "",
    bedtimeMessage: "",
  });

  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Creating your magical story...");

  const generateStoryMutation = useMutation({
    mutationFn: async (data: InsertStory) => {
      // Start loading sequence
      setLoadingStage(1);
      setLoadingMessage("Crafting your story idea...");

      // Simulate stages for better UX
      setTimeout(() => {
        setLoadingStage(2);
        setLoadingMessage("Writing your magical adventure...");
      }, 2000);

      setTimeout(() => {
        setLoadingStage(3);
        setLoadingMessage("Adding finishing touches...");
      }, 6000);

      const response = await apiRequest("POST", "/api/stories/generate", data);
      return await response.json();
    },
    onSuccess: (story) => {
      setLoadingStage(4);
      setLoadingMessage("Story complete! Taking you there...");
      setTimeout(() => {
        setLocation(`/story/${story.id}`);
      }, 1000);
    },
    onError: async (error: any) => {
      setLoadingStage(0);
      setLoadingMessage("Creating your magical story...");

      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      // Handle tier restriction errors
      if (error.status === 403) {
        try {
          const errorData = await error.json();
          if (errorData.upgradeRequired) {
            toast({
              title: "Upgrade Required",
              description: errorData.message,
              variant: "destructive",
            });
            // Show upgrade prompt
            setTimeout(() => setLocation("/pricing"), 2000);
            return;
          }
        } catch {
          // Failed to parse error response, fall through to generic error
        }
      }

      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const updateFormData = (field: keyof InsertStory, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.childName && formData.childAge && formData.childGender;
      case 2:
        return formData.tone && formData.length;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleGenerate = () => {
    if (!formData.childName || !formData.childAge || !formData.childGender || !formData.tone || !formData.length) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateStoryMutation.mutate(formData as InsertStory);
  };

  if (isLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (generateStoryMutation.isPending) {
    return <LoadingOverlay isLoading={true} message={loadingMessage} progress={loadingStage * 25} showProgress={true} />;
  }

  const currentStepData = STEPS[currentStep - 1];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ChildInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StoryStyleStep formData={formData} updateFormData={updateFormData} tierInfo={tierInfo} />;
      case 3:
        return <PersonalTouchStep formData={formData} updateFormData={updateFormData} tierInfo={tierInfo} />;
      default:
        return null;
    }
  };

  return (
    <WizardStep
      currentStep={currentStep}
      totalSteps={STEPS.length}
      title={currentStepData.title}
      subtitle={currentStepData.subtitle}
      icon={currentStepData.icon}
    >
      {/* Tier Status Indicator */}
      {tierInfo && (
        <div className="mb-6">
          <TierStatusAlert
            tierInfo={tierInfo}
            onUpgradeClick={() => setLocation("/pricing")}
          />
        </div>
      )}

      <div className="space-y-6">
        {renderStepContent()}

        {/* Navigation */}
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          canProceed={canProceed()}
          onPrevious={prevStep}
          onNext={nextStep}
          onSubmit={handleGenerate}
        />
      </div>
    </WizardStep>
  );
}