import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validateChildName, sanitizeInput } from "@/lib/inputValidation";
import type { InsertStory } from "@shared/schema";

interface ChildInfoStepProps {
  formData: Partial<InsertStory>;
  updateFormData: (field: keyof InsertStory, value: any) => void;
}

export function ChildInfoStep({ formData, updateFormData }: ChildInfoStepProps) {
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    const validation = validateChildName(sanitized);

    if (!validation.isValid) {
      setNameError(validation.error || "Invalid name");
    } else {
      setNameError(null);
    }

    updateFormData("childName", sanitized);
  };

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
          type="text"
          value={formData.childName || ""}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter your child's name"
          maxLength={50}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            nameError ? "border-red-500" : "border-gray-300"
          }`}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "name-error" : undefined}
        />
        {nameError && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {nameError}
          </p>
        )}
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
    </div>
  );
}