import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STORY_TEMPLATES, getRecommendedTemplates } from "@shared/storyTemplates";
import type { InsertStory } from "@shared/schema";

interface TemplateSelectionStepProps {
  formData: Partial<InsertStory>;
  updateFormData: (field: keyof InsertStory, value: any) => void;
}

export function TemplateSelectionStep({
  formData,
  updateFormData,
}: TemplateSelectionStepProps) {
  // Get recommended templates based on selected tone
  const recommendedTemplates = formData.tone 
    ? getRecommendedTemplates(formData.tone)
    : [];
  
  // Show all templates if no tone selected, or if no recommendations
  const templatesToShow = recommendedTemplates.length > 0 
    ? recommendedTemplates 
    : STORY_TEMPLATES;

  return (
    <div className="space-y-6">
      <div>
        <Label className="block text-sm font-medium text-story-bark mb-4">
          Choose a Story Template
        </Label>
        <p className="text-sm text-story-bark/60 mb-6">
          Select a story structure that will guide the creation of your tale. You can always customize the details later.
        </p>
        
        {formData.tone && recommendedTemplates.length > 0 && (
          <div className="mb-4">
            <Badge variant="secondary" className="text-xs">
              Recommended for {formData.tone} stories
            </Badge>
          </div>
        )}

        <RadioGroup
          value={formData.storyTemplate || ""}
          onValueChange={(value) => updateFormData("storyTemplate", value)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option for no template */}
            <Card className={`cursor-pointer transition-all duration-200 ${
              formData.storyTemplate === "" || !formData.storyTemplate
                ? "ring-2 ring-story-gold bg-story-cream"
                : "hover:shadow-md"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="" id="no-template" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="no-template" className="font-medium cursor-pointer flex items-center">
                      🎲 Surprise Me
                    </Label>
                    <p className="text-sm text-story-bark/60 mt-1">
                      Let our AI create a completely original story structure
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {templatesToShow.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all duration-200 ${
                  formData.storyTemplate === template.id
                    ? "ring-2 ring-story-gold bg-story-cream"
                    : "hover:shadow-md"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={template.id}
                      id={template.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={template.id}
                        className="font-medium cursor-pointer flex items-center"
                      >
                        <span className="mr-2">{template.icon}</span>
                        {template.name}
                      </Label>
                      <p className="text-sm text-story-bark/60 mt-1">
                        {template.description}
                      </p>
                      {formData.childName && (
                        <p className="text-xs text-story-gold mt-2 font-medium">
                          Example: "{template.example_title.replace('{childName}', formData.childName)}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </RadioGroup>

        {/* Show preview of selected template structure */}
        {formData.storyTemplate && formData.storyTemplate !== "" && (
          <div className="mt-6 p-4 bg-story-cream rounded-xl">
            <h4 className="font-medium text-story-bark mb-2">Story Structure Preview:</h4>
            <p className="text-sm text-story-bark/70">
              {STORY_TEMPLATES.find(t => t.id === formData.storyTemplate)?.structure
                .replace('{childName}', formData.childName || '[Child\'s Name]')}
            </p>
          </div>
        )}

        {(!formData.storyTemplate || formData.storyTemplate === "") && (
          <div className="mt-6 p-4 bg-story-cream rounded-xl">
            <h4 className="font-medium text-story-bark mb-2">Surprise Me Selected</h4>
            <p className="text-sm text-story-bark/70">
              Our AI will create a unique story structure tailored specifically to your preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}