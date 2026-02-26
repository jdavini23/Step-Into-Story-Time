import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import type { InsertStory } from "@shared/schema";

interface ChildInfoStepProps {
  formData: Partial<InsertStory>;
  updateFormData: (field: keyof InsertStory, value: any) => void;
}

export function ChildInfoStep({ formData, updateFormData }: ChildInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case "childName":
        if (!value || value.trim() === "") {
          newErrors.childName = "Child name is required";
        } else if (value.length > 50) {
          newErrors.childName = "Child name must be 50 characters or less";
        } else if (!/^[a-zA-Z\s\-']+$/.test(value)) {
          newErrors.childName = "Child name can only contain letters, spaces, hyphens, and apostrophes";
        } else {
          delete newErrors.childName;
        }
        break;
      case "childGender":
        if (!value) {
          newErrors.childGender = "Please select a gender";
        } else {
          delete newErrors.childGender;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof InsertStory, value: any) => {
    updateFormData(field, value);
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleInputBlur = (field: keyof InsertStory) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="childName" className="text-base font-medium">
          Child's Name *
        </Label>
        <Input
          id="childName"
          type="text"
          placeholder="Enter your child's name"
          value={formData.childName || ""}
          onChange={(e) => handleInputChange("childName", e.target.value)}
          onBlur={() => handleInputBlur("childName")}
          className={errors.childName && touched.childName ? "border-red-500" : ""}
        />
        {errors.childName && touched.childName && (
          <p className="text-sm text-red-600">{errors.childName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium">Age *</Label>
        <Select
          value={formData.childAge?.toString() || ""}
          onValueChange={(value) => handleInputChange("childAge", parseInt(value))}
        >
          <SelectTrigger className="w-full">
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
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Gender *</Label>
        <RadioGroup
          value={formData.childGender || ""}
          onValueChange={(value) => {
            handleInputChange("childGender", value);
            setTouched(prev => ({ ...prev, childGender: true }));
          }}
          className="grid grid-cols-2 gap-6"
        >
          <div className="flex items-center space-x-3 p-4 border-2 border-story-mist rounded-xl hover:border-story-gold has-[:checked]:border-story-gold has-[:checked]:bg-story-cream transition-colors">
            <RadioGroupItem value="boy" id="boy" className="text-story-gold" />
            <Label htmlFor="boy" className="flex items-center space-x-2 cursor-pointer flex-1">
              <span className="text-2xl">👦</span>
              <span className="font-medium">Boy</span>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border-2 border-story-mist rounded-xl hover:border-story-gold has-[:checked]:border-story-gold has-[:checked]:bg-story-cream transition-colors">
            <RadioGroupItem value="girl" id="girl" className="text-story-gold" />
            <Label htmlFor="girl" className="flex items-center space-x-2 cursor-pointer flex-1">
              <span className="text-2xl">👧</span>
              <span className="font-medium">Girl</span>
            </Label>
          </div>
        </RadioGroup>
        {errors.childGender && touched.childGender && (
          <p className="text-sm text-red-600">{errors.childGender}</p>
        )}
      </div>
    </div>
  );
}