import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { InsertStory } from "@shared/schema";
import type { TierInfo } from "@/hooks/useTierInfo";

interface StoryStyleStepProps {
  formData: Partial<InsertStory>;
  updateFormData: (field: keyof InsertStory, value: any) => void;
  tierInfo?: TierInfo;
}

export function StoryStyleStep({
  formData,
  updateFormData,
  tierInfo,
}: StoryStyleStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="block text-sm font-medium text-story-bark mb-4">
          Story Tone *
        </Label>
        <RadioGroup
          value={formData.tone}
          onValueChange={(value) => updateFormData("tone", value)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 p-4 border border-story-mist rounded-xl hover:border-story-gold transition-colors">
              <RadioGroupItem value="adventurous" id="adventurous" />
              <div>
                <Label
                  htmlFor="adventurous"
                  className="font-medium cursor-pointer"
                >
                  🗺️ Adventurous
                </Label>
                <p className="text-sm text-story-bark/60">
                  Exciting quests and discoveries
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-4 border border-story-mist rounded-xl hover:border-story-gold transition-colors">
              <RadioGroupItem value="silly" id="silly" />
              <div>
                <Label htmlFor="silly" className="font-medium cursor-pointer">
                  😄 Silly
                </Label>
                <p className="text-sm text-story-bark/60">
                  Fun and giggly adventures
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 sm:p-5 border border-story-mist rounded-xl hover:border-story-gold transition-colors touch-manipulation">
              <RadioGroupItem
                value="calming"
                id="calming"
                className="h-5 w-5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="calming"
                  className="font-medium cursor-pointer text-sm sm:text-base"
                >
                  🌙 Calming
                </Label>
                <p className="text-xs sm:text-sm text-story-bark/60 mt-1">
                  Peaceful and soothing tales
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 sm:p-5 border border-story-mist rounded-xl hover:border-story-gold transition-colors touch-manipulation">
              <RadioGroupItem
                value="educational"
                id="educational"
                className="h-5 w-5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="educational"
                  className="font-medium cursor-pointer text-sm sm:text-base"
                >
                  📚 Educational
                </Label>
                <p className="text-xs sm:text-sm text-story-bark/60 mt-1">
                  Learning through storytelling
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium text-story-bark">
            Story Length *
          </Label>
          {tierInfo?.tier === "free" && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Free: Short only
            </Badge>
          )}
        </div>
        <RadioGroup
          value={formData.length}
          onValueChange={(value) => updateFormData("length", value)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-4 border border-story-mist rounded-xl hover:border-story-gold transition-colors">
              <RadioGroupItem value="short" id="short" />
              <div>
                <Label htmlFor="short" className="font-medium cursor-pointer">
                  ⏱️ Short
                </Label>
                <p className="text-sm text-story-bark/60">
                  2-3 minutes reading time
                </p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-2 p-4 border rounded-xl transition-colors ${
                tierInfo?.tier === "free"
                  ? "border-story-mist bg-story-cream opacity-50 cursor-not-allowed"
                  : "border-story-mist hover:border-story-gold"
              }`}
            >
              <RadioGroupItem
                value="medium"
                id="medium"
                disabled={tierInfo?.tier === "free"}
              />
              <div>
                <Label
                  htmlFor="medium"
                  className={`font-medium ${
                    tierInfo?.tier === "free"
                      ? "text-story-bark/40 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  📖 Medium
                </Label>
                <p className="text-sm text-story-bark/60">
                  5-7 minutes reading time
                </p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-2 p-4 border rounded-xl transition-colors ${
                tierInfo?.tier === "free"
                  ? "border-story-mist bg-story-cream opacity-50 cursor-not-allowed"
                  : "border-story-mist hover:border-story-gold"
              }`}
            >
              <RadioGroupItem
                value="long"
                id="long"
                disabled={tierInfo?.tier === "free"}
              />
              <div>
                <Label
                  htmlFor="long"
                  className={`font-medium ${
                    tierInfo?.tier === "free"
                      ? "text-story-bark/40 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  📚 Long
                </Label>
                <p className="text-sm text-story-bark/60">
                  10-15 minutes reading time
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        {tierInfo?.tier === "free" && (
          <div className="mt-4 p-4 bg-story-cream border border-story-mist rounded-xl">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-story-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-story-night">
                  Medium and Long Stories
                </p>
                <p className="text-sm text-story-bark/70 mt-1">
                  Upgrade to Premium to unlock medium (5-7 min) and long (10-15
                  min) story lengths.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
