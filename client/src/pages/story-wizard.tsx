import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { InsertStory } from "@shared/schema";
import LoadingOverlay from "@/components/loading-overlay";

const STEPS = [
  { id: 1, title: "Tell us about your little one", icon: "👶" },
  { id: 2, title: "Choose the story style", icon: "🎭" },
  { id: 3, title: "Add a personal touch", icon: "💝" },
];

export default function StoryWizard() {
  const { user, isLoading } = useAuth();
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

  const generateStoryMutation = useMutation({
    mutationFn: async (data: InsertStory) => {
      const response = await apiRequest("POST", "/api/stories/generate", data);
      return await response.json();
    },
    onSuccess: (story) => {
      setLocation(`/story/${story.id}`);
    },
    onError: (error) => {
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

  const progressPercentage = (currentStep / STEPS.length) * 100;

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (generateStoryMutation.isPending) {
    return <LoadingOverlay message="Creating your magical story..." />;
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-purple-600">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm text-gray-500">Almost there! ✨</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step content */}
        <Card className="shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{STEPS[currentStep - 1].icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">{STEPS[currentStep - 1].title}</h3>
              {currentStep === 1 && <p className="text-gray-600">We'll create a story just for them</p>}
              {currentStep === 2 && <p className="text-gray-600">What kind of adventure should it be?</p>}
              {currentStep === 3 && <p className="text-gray-600">Make it extra special with a personal message</p>}
            </div>

            <div className="space-y-6">
              {/* Step 1: Child Information */}
              {currentStep === 1 && (
                <>
                  <div>
                    <Label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
                      Child's Name *
                    </Label>
                    <Input
                      id="childName"
                      placeholder="e.g., Emma"
                      value={formData.childName || ""}
                      onChange={(e) => updateFormData("childName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="childAge" className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </Label>
                    <Select value={formData.childAge?.toString()} onValueChange={(value) => updateFormData("childAge", parseInt(value))}>
                      <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <SelectValue placeholder="Select age" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 years old</SelectItem>
                        <SelectItem value="3">3 years old</SelectItem>
                        <SelectItem value="4">4 years old</SelectItem>
                        <SelectItem value="5">5 years old</SelectItem>
                        <SelectItem value="6">6 years old</SelectItem>
                        <SelectItem value="7">7 years old</SelectItem>
                        <SelectItem value="8">8 years old</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-4">Gender *</Label>
                    <RadioGroup value={formData.childGender} onValueChange={(value) => updateFormData("childGender", value)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Label htmlFor="boy" className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors cursor-pointer">
                          <RadioGroupItem value="boy" id="boy" />
                          <div>
                            <span className="font-medium">👦 Boy</span>
                          </div>
                        </Label>
                        <Label htmlFor="girl" className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors cursor-pointer">
                          <RadioGroupItem value="girl" id="girl" />
                          <div>
                            <span className="font-medium">👧 Girl</span>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="favoriteThemes" className="block text-sm font-medium text-gray-700 mb-2">
                      Favorite Animals or Characters
                    </Label>
                    <Input
                      id="favoriteThemes"
                      placeholder="e.g., dragons, unicorns, puppies"
                      value={formData.favoriteThemes || ""}
                      onChange={(e) => updateFormData("favoriteThemes", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Step 2: Story Style */}
              {currentStep === 2 && (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-4">Story Tone *</Label>
                    <RadioGroup value={formData.tone} onValueChange={(value) => updateFormData("tone", value)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                          <RadioGroupItem value="adventurous" id="adventurous" />
                          <div>
                            <Label htmlFor="adventurous" className="font-medium cursor-pointer">🗺️ Adventurous</Label>
                            <p className="text-sm text-gray-500">Exciting quests and discoveries</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                          <RadioGroupItem value="silly" id="silly" />
                          <div>
                            <Label htmlFor="silly" className="font-medium cursor-pointer">😄 Silly</Label>
                            <p className="text-sm text-gray-500">Fun and giggly adventures</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 sm:p-5 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors touch-manipulation">
                          <RadioGroupItem value="calming" id="calming" className="h-5 w-5" />
                          <div className="flex-1">
                            <Label htmlFor="calming" className="font-medium cursor-pointer text-sm sm:text-base">🌙 Calming</Label>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Peaceful and soothing tales</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 sm:p-5 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors touch-manipulation">
                          <RadioGroupItem value="educational" id="educational" className="h-5 w-5" />
                          <div className="flex-1">
                            <Label htmlFor="educational" className="font-medium cursor-pointer text-sm sm:text-base">📚 Educational</Label>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Learning through storytelling</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-4">Story Length *</Label>
                    <RadioGroup value={formData.length} onValueChange={(value) => updateFormData("length", value)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                          <RadioGroupItem value="short" id="short" />
                          <div>
                            <Label htmlFor="short" className="font-medium cursor-pointer">⏱️ Short</Label>
                            <p className="text-sm text-gray-500">2-3 minutes reading time</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                          <RadioGroupItem value="medium" id="medium" />
                          <div>
                            <Label htmlFor="medium" className="font-medium cursor-pointer">📖 Medium</Label>
                            <p className="text-sm text-gray-500">4-5 minutes reading time</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {/* Step 3: Personal Touch */}
              {currentStep === 3 && (
                <div>
                  <Label htmlFor="bedtimeMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Bedtime Message (Optional)
                  </Label>
                  <Textarea
                    id="bedtimeMessage"
                    placeholder="e.g., Sweet dreams, Emma! Remember that you're braver than you believe. Goodnight from Dad ❤️"
                    value={formData.bedtimeMessage || ""}
                    onChange={(e) => updateFormData("bedtimeMessage", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Add a special message that will appear at the end of the story
                  </p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Previous
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Next Step →
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 hover:opacity-90 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  ✨ Generate Story
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
