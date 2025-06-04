import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon, ZoomIn, ZoomOut, Volume2, VolumeX } from "lucide-react";

interface StoryReadingControlsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  isReading: boolean;
  onToggleReadAloud: () => void;
  cardClasses?: string;
}

export function StoryReadingControls({
  isDarkMode,
  onToggleDarkMode,
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  isReading,
  onToggleReadAloud,
  cardClasses = "",
}: StoryReadingControlsProps) {
  return (
    <Card className={`p-2 ${cardClasses} shadow-lg`}>
      <div className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onIncreaseFontSize}
          title="Increase font size"
          disabled={fontSize >= 24}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDecreaseFontSize}
          title="Decrease font size"
          disabled={fontSize <= 14}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleReadAloud}
          title={isReading ? "Stop reading" : "Read aloud"}
          className={isReading ? "text-green-600" : ""}
        >
          {isReading ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
