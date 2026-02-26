import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InsertStory } from "@shared/schema";
import type { TierInfo } from "@/hooks/useTierInfo";

interface PersonalTouchStepProps {
  formData: Partial<InsertStory>;
  updateFormData: (field: keyof InsertStory, value: any) => void;
  tierInfo?: TierInfo;
}

export function PersonalTouchStep({
  formData,
  updateFormData,
  tierInfo,
}: PersonalTouchStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <Label
          htmlFor="bedtime-message"
          className="text-sm font-medium text-story-bark"
        >
          Bedtime Message (Optional)
        </Label>
        <p className="text-sm text-story-bark/60 mb-4">
          Add a special message or lesson you'd like woven into the story
        </p>
        <Textarea
          id="bedtime-message"
          placeholder="Remember to always be kind to others, or brush your teeth before bed..."
          value={formData.bedtimeMessage || ""}
          onChange={(e) => updateFormData("bedtimeMessage", e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={200}
        />
        <p className="text-xs text-story-bark/40 mt-2">
          {formData.bedtimeMessage?.length || 0}/200 characters
        </p>
      </div>

      <div className="bg-story-cream border border-story-mist rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-story-mist rounded-full p-2 flex-shrink-0">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h3 className="font-serif font-semibold text-story-night mb-2">
              Ready to Create Magic?
            </h3>
            <p className="text-story-bark/70 text-sm">
              Your personalized bedtime story will be ready in just a few
              moments. Each story is unique and crafted just for{" "}
              {formData.childName || "your little one"}!
            </p>
            {tierInfo?.tier === "free" &&
              tierInfo.storiesRemaining !== undefined && (
                <p className="text-story-gold text-sm mt-2 font-medium">
                  {tierInfo.storiesRemaining} stories remaining this week
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
