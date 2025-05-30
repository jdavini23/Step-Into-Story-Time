import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { Download, Heart, Share2, Plus } from "lucide-react";
import type { Story } from "@shared/schema";
import jsPDF from "jspdf";

export default function StoryReader() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const storyId = params.id;

  const { data: story, isLoading: storyLoading, error } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!user && !!storyId,
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

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const downloadPDF = () => {
    if (!story) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    const titleLines = pdf.splitTextToSize(story.title, maxWidth);
    pdf.text(titleLines, margin, 30);
    
    // Subtitle
    let yPosition = 30 + (titleLines.length * 7) + 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("A magical bedtime story", margin, yPosition);
    
    // Story metadata
    yPosition += 20;
    pdf.setFontSize(10);
    pdf.text(`Created: ${new Date(story.createdAt || '').toLocaleDateString()}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Reading time: ${story.length === 'short' ? '2-3' : '4-5'} minutes`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Age: ${story.childAge} years old`, margin, yPosition);
    
    // Story content
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    
    // Split content into paragraphs and fit to page
    const paragraphs = story.content.split('\n\n');
    
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        const lines = pdf.splitTextToSize(paragraph.trim(), maxWidth);
        
        // Check if we need a new page
        if (yPosition + (lines.length * 7) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += (lines.length * 7) + 10;
      }
    });
    
    pdf.save(`${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    
    toast({
      title: "Success",
      description: "Story downloaded as PDF!",
    });
  };

  const shareStory = () => {
    if (navigator.share && story) {
      navigator.share({
        title: story.title,
        text: `Check out this magical bedtime story: ${story.title}`,
        url: window.location.href,
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link Copied",
        description: "Story link copied to clipboard!",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  if (isLoading || storyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📖</span>
          </div>
          <p className="text-gray-600">Loading your magical story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Story Not Found</h2>
              <p className="text-gray-600 mb-6">This story doesn't exist or you don't have permission to view it.</p>
              <Button onClick={() => setLocation("/")}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatStoryContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim()) {
        return (
          <p key={index} className="text-xl leading-8 mb-6">
            {paragraph.trim()}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Story header */}
        <Card className="shadow-2xl p-8 mb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📖</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-700 mb-2">
            {story.title}
          </h2>
          <p className="text-gray-600">A magical bedtime adventure</p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
            <span>📅 {new Date(story.createdAt || '').toLocaleDateString()}</span>
            <span>⏱️ {story.length === 'short' ? '2-3' : '4-5'} min read</span>
            <span>🎯 Age {story.childAge}</span>
          </div>
        </Card>

        {/* Story content */}
        <Card className="shadow-2xl p-8 mb-8">
          <div className="prose prose-lg max-w-none leading-relaxed">
            {/* Story illustration placeholder */}
            <div className="w-full h-64 bg-gradient-to-br from-purple-100 via-blue-100 to-yellow-100 rounded-xl mb-8 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-2 block">✨</span>
                <p className="text-gray-600 font-medium">Magical Story Illustration</p>
              </div>
            </div>
            
            <div className="text-gray-700">
              {formatStoryContent(story.content)}
              
              {story.bedtimeMessage && (
                <div className="bg-yellow-50 p-6 rounded-xl mt-8 border-l-4 border-yellow-400">
                  <p className="text-lg italic text-purple-700">
                    {story.bedtimeMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Story actions */}
        <Card className="shadow-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={downloadPDF}
              className="flex-1 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </Button>
            
            <Button
              onClick={shareStory}
              className="flex-1 border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setLocation("/story-wizard")}
              className="w-full bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Another Story
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
