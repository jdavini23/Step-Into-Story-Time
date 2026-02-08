import { useState } from "react";
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
import { TemplateSelectionStep } from "@/components/story-wizard/template-selection-step";
import { PersonalTouchStep } from "@/components/story-wizard/personal-touch-step";
import { TierStatusAlert } from "@/components/story-wizard/tier-status-alert";
import { WizardNavigation } from "@/components/story-wizard/wizard-navigation";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TierInfo } from "@/hooks/useTierInfo";

const STEPS = [
  {
    id: 1,
    title: "Tell us about your little one",
    subtitle: "We'll create a story just for them",
    icon: "👶",
  },
  {
    id: 2,
    title: "Choose the story style",
    subtitle: "What kind of adventure should it be?",
    icon: "🎭",
  },
  {
    id: 3,
    title: "Pick a story template",
    subtitle: "Choose a structure for your tale",
    icon: "📋",
  },
  {
    id: 4,
    title: "Add custom characters",
    subtitle: "Include your unique characters in the story",
    icon: "👥",
  },
  {
    id: 5,
    title: "Add a personal touch",
    subtitle: "Make it extra special with a personal message",
    icon: "💝",
  },
];

const ANON_FREE_TIER_INFO: TierInfo = {
  tier: "free",
  status: "active",
  canGenerate: true,
  storiesRemaining: 1,
  weeklyUsage: 0,
  weekStart: new Date().toISOString(),
  limits: {
    storiesPerWeek: 3,
    maxStoriesInLibrary: 3,
    canDownloadPdf: false,
    canAccessAllThemes: false,
    canAccessAllLengths: false,
    maxChildProfiles: 1,
    hasAiIllustrations: false,
    hasAudioNarration: false,
    hasMagicLetters: false,
    hasCustomCharacters: false,
  },
};

export default function StoryWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const [previewStory, setPreviewStory] = useState<any>(null);

  useSEO({
    title: "Create Your Personalized Bedtime Story | Step Into Storytime",
    description: "Follow our simple 5-step wizard to create a magical, personalized bedtime story for your child in under 2 minutes.",
    keywords: "create bedtime story, story wizard, personalized children's story, AI story creator",
    url: window.location.href,
    canonical: "https://stepintostorytime.com/story-wizard",
    type: "website"
  });
  const { user, isLoading, isAuthenticated } = useAuth();
  const { data: tierInfo, isLoading: tierLoading } = useTierInfo();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<InsertStory>>({
    childName: "",
    childAge: 4,
    childGender: "",
    favoriteThemes: "",
    tone: "",
    length: "",
    storyTemplate: "",
    bedtimeMessage: "",
  });

  const [loadingMessage, setLoadingMessage] = useState(
    "Creating your magical story...",
  );

  const generateStoryMutation = useMutation({
    mutationFn: async (data: InsertStory) => {
      setLoadingMessage("Crafting your story idea...");

      setTimeout(() => {
        setLoadingMessage("Writing your magical adventure...");
      }, 2000);

      setTimeout(() => {
        setLoadingMessage("Adding finishing touches...");
      }, 6000);

      if (!isAuthenticated) {
        const response = await fetch("/api/stories/generate-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const err: any = new Error(errorData.message || "Failed to generate preview");
          err.status = response.status;
          err.json = () => Promise.resolve(errorData);
          throw err;
        }
        return await response.json();
      }

      const response = await apiRequest("POST", "/api/stories/generate", data);
      return await response.json();
    },
    onSuccess: (story) => {
      if (!isAuthenticated || story.preview) {
        setPreviewStory(story);
        return;
      }
      setLoadingMessage("Story complete! Taking you there...");
      setTimeout(() => {
        setLocation(`/story/${story.id}`);
      }, 1000);
    },
    onError: async (error: any) => {
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

      if (error.status === 403) {
        try {
          const errorData = typeof error.json === 'function' ? await error.json() : {};
          if (errorData.upgradeRequired) {
            toast({
              title: "Upgrade Required",
              description: errorData.message,
              variant: "destructive",
            });
            setTimeout(() => setLocation("/pricing"), 2000);
            return;
          }
        } catch {
        }
      }

      toast({
        title: "Error",
        description: error.message || "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (field: keyof InsertStory, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      if (currentStep === 3 && !isAuthenticated) {
        setCurrentStep(5);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      if (currentStep === 5 && !isAuthenticated) {
        setCurrentStep(3);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.childName && formData.childAge && formData.childGender);
      case 2:
        return !!(formData.tone && formData.length);
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleGenerate = () => {
    if (
      !formData.childName ||
      !formData.childAge ||
      !formData.childGender ||
      !formData.tone ||
      !formData.length
    ) {
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
    return (
      <LoadingOverlay
        isLoading={true}
        message={loadingMessage}
        showProgress={false}
      />
    );
  }

  if (previewStory) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-2xl mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📖</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{previewStory.title}</h1>
                <p className="text-sm text-gray-500">
                  A {previewStory.tone} story for {previewStory.childName}
                </p>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                {previewStory.content}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-purple-900 mb-3">Love this story?</h2>
              <p className="text-purple-700 mb-6">
                Sign up to save it to your library, create more stories, and build your collection.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                  onClick={() => { window.location.href = "/api/login?signup=true"; }}
                >
                  Sign Up to Save
                </Button>
                <Button
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-800"
                  onClick={() => {
                    setPreviewStory(null);
                    setFormData({
                      childName: "",
                      childAge: 4,
                      childGender: "",
                      favoriteThemes: "",
                      tone: "",
                      length: "",
                      storyTemplate: "",
                      bedtimeMessage: "",
                    });
                    setCurrentStep(1);
                  }}
                >
                  Create Another Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayStep = !isAuthenticated && currentStep >= 5 ? currentStep - 1 : currentStep;
  const totalSteps = isAuthenticated ? STEPS.length : STEPS.length - 1;
  const currentStepData = STEPS[currentStep - 1];

  const effectiveTierInfo = isAuthenticated ? tierInfo : ANON_FREE_TIER_INFO;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ChildInfoStep formData={formData} updateFormData={updateFormData} />
        );
      case 2:
        return (
          <StoryStyleStep
            formData={formData}
            updateFormData={updateFormData}
            tierInfo={effectiveTierInfo}
          />
        );
      case 3:
        return (
          <TemplateSelectionStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
      case 5:
        return (
          <PersonalTouchStep
            formData={formData}
            updateFormData={updateFormData}
            tierInfo={effectiveTierInfo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WizardStep
      currentStep={displayStep}
      totalSteps={totalSteps}
      title={currentStepData.title}
      subtitle={currentStepData.subtitle}
      icon={currentStepData.icon}
    >
      {isAuthenticated && tierInfo && (
        <div className="mb-6">
          <TierStatusAlert
            tierInfo={tierInfo}
            onUpgradeClick={() => setLocation("/pricing")}
          />
        </div>
      )}

      <div className="space-y-6">
        {renderStepContent()}

        <WizardNavigation
          currentStep={displayStep}
          totalSteps={totalSteps}
          canProceed={canProceed()}
          onPrevious={prevStep}
          onNext={nextStep}
          onSubmit={handleGenerate}
        />
      </div>
    </WizardStep>
  );
}
