import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChildInfoStepProps {
  formData: {
    childName: string;
    childAge: number;
    childGender: "boy" | "girl";
  };
  updateFormData: (field: string, value: any) => void;
}

export function ChildInfoStep({ formData, updateFormData }: ChildInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate form data only for touched fields
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (touched.childName) {
      if (!formData.childName.trim()) {
        newErrors.childName = "Child name is required";
      } else if (formData.childName.length > 50) {
        newErrors.childName = "Child name must be 50 characters or less";
      } else if (!/^[a-zA-Z\s\-']+$/.test(formData.childName)) {
        newErrors.childName = "Child name can only contain letters, spaces, hyphens, and apostrophes";
      }
    }

    if (touched.childAge && (!formData.childAge || formData.childAge < 2 || formData.childAge > 8)) {
      newErrors.childAge = "Please select a valid age between 2 and 8";
    }

    if (touched.childGender && !formData.childGender) {
      newErrors.childGender = "Please select a gender";
    }

    setErrors(newErrors);
  }, [formData, touched]);

  const handleFieldTouch = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
          Child's Name *
        </Label>
        <Input
          id="childName"
          type="text"
          placeholder="Enter your child's name"
          value={formData.childName}
          onChange={(e) => updateFormData("childName", e.target.value)}
          onBlur={() => handleFieldTouch("childName")}
          className={`w-full ${errors.childName ? "border-red-500" : ""}`}
          maxLength={50}
        />
        {errors.childName && (
          <p className="text-sm text-red-500 mt-1">{errors.childName}</p>
        )}
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Age *
        </Label>
        <Select
          value={formData.childAge?.toString() || ""}
          onValueChange={(value) => {
            updateFormData("childAge", parseInt(value));
            handleFieldTouch("childAge");
          }}
        >
          <SelectTrigger className={`w-full ${errors.childAge ? "border-red-500" : ""}`}>
            <SelectValue placeholder="Select age" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 7 }, (_, i) => i + 2).map((age) => (
              <SelectItem key={age} value={age.toString()}>
                {age} years old
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.childAge && (
          <p className="text-sm text-red-500 mt-1">{errors.childAge}</p>
        )}
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-4">
          Gender *
        </Label>
        <RadioGroup
          value={formData.childGender}
          onValueChange={(value) => {
            updateFormData("childGender", value);
            handleFieldTouch("childGender");
          }}
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
        {errors.childGender && (
          <p className="text-sm text-red-500 mt-1">{errors.childGender}</p>
        )}
      </div>
    </div>
  );
}