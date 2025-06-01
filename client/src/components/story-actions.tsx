
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Share2, Plus } from "lucide-react";
import type { Story } from "@shared/schema";

interface StoryActionsProps {
  story: Story;
  onDownloadPDF: () => void;
  onShare: () => void;
  onCreateAnother: () => void;
  cardClasses?: string;
}

export function StoryActions({
  story,
  onDownloadPDF,
  onShare,
  onCreateAnother,
  cardClasses = "",
}: StoryActionsProps) {
  return (
    <Card className={`shadow-2xl p-6 ${cardClasses}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onDownloadPDF}
          variant="outline"
          className="flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
        >
          <Download className="w-5 h-5" />
          <span>Download PDF</span>
        </Button>
        
        <Button
          onClick={onShare}
          variant="outline"
          className="flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </Button>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onCreateAnother}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Another Story
        </Button>
      </div>
    </Card>
  );
}
