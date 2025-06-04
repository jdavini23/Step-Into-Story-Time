import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InsertStory } from "@shared/schema";

interface ChildInfoStepProps {
  formData: Partial<InsertStory>;
  updateFormData: (field: keyof InsertStory, value: any) => void;
}

export function ChildInfoStep({
  formData,
  updateFormData,
}: ChildInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label
          htmlFor="childName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
        <Label
          htmlFor="childAge"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Age *
        </Label>
        <Select
          value={formData.childAge?.toString()}
          onValueChange={(value) => updateFormData("childAge", parseInt(value))}
        >
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
        <Label className="block text-sm font-medium text-gray-700 mb-4">
          Gender *
        </Label>
        <RadioGroup
          value={formData.childGender}
          onValueChange={(value) => updateFormData("childGender", value)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Label
              htmlFor="boy"
              className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors cursor-pointer"
            >
              <RadioGroupItem value="boy" id="boy" />
              <div>
                <span className="font-medium">👦 Boy</span>
              </div>
            </Label>
            <Label
              htmlFor="girl"
              className="flex items-center space-x-2 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors cursor-pointer"
            >
              <RadioGroupItem value="girl" id="girl" />
              <div>
                <span className="font-medium">👧 Girl</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label
          htmlFor="favoriteThemes"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
    </div>
  );
}
