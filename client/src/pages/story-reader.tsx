
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Download, 
  Heart, 
  Share2, 
  Plus, 
  ArrowLeft, 
  BookOpen, 
  Volume2, 
  VolumeX,
  Sun,
  Moon,
  Type,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import type { Story } from "@shared/schema";
import jsPDF from "jspdf";

export default function StoryReader() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const storyId = params.id;

  // Reading experience state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const { data: story, isLoading: storyLoading, error } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!user && !!storyId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Speech synthesis for read-aloud feature
  const toggleReadAloud = useCallback(() => {
    if (!story) return;

    if (isReading) {
      speechSynthesis.cancel();
      setIsReading(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(story.content);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => {
        setIsReading(false);
        toast({
          title: "Error",
          description: "Could not read the story aloud.",
          variant: "destructive",
        });
      };
      speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  }, [story, isReading, toast]);

  // Font size controls
  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(24, prev + 2));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(14, prev - 2));
  }, []);

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

  const downloadPDF = useCallback(() => {
    if (!story) return;

    try {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [story, toast]);

  const shareStory = useCallback(() => {
    if (navigator.share && story) {
      navigator.share({
        title: story.title,
        text: `Check out this magical bedtime story: ${story.title}`,
        url: window.location.href,
      }).catch(() => {
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  }, [story]);

  const copyToClipboard = useCallback(() => {
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
  }, [toast]);

  const formatStoryContent = useMemo(() => {
    if (!story) return [];
    return story.content.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim()) {
        return (
          <p 
            key={index} 
            className="leading-8 mb-6"
            style={{ fontSize: `${fontSize}px` }}
          >
            {paragraph.trim()}
          </p>
        );
      }
      return null;
    });
  }, [story, fontSize]);

  if (isLoading || storyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your magical story...</p>
        </div>
      </div>
    );
  }

  if (error && !isUnauthorizedError(error as Error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">We couldn't load this story. Please try again.</p>
              <div className="space-x-4">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")}>
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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

  const themeClasses = isDarkMode 
    ? "bg-gray-900 text-gray-100" 
    : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900";

  const cardClasses = isDarkMode 
    ? "bg-gray-800 border-gray-700 text-gray-100" 
    : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen transition-all duration-300 ${themeClasses}`}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Reading Controls - Fixed Sidebar */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 space-y-2">
        <Card className={`p-2 ${cardClasses} shadow-lg`}>
          <div className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Light mode" : "Dark mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              title="Increase font size"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              title="Decrease font size"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleReadAloud}
              title={isReading ? "Stop reading" : "Read aloud"}
              className={isReading ? "text-green-600" : ""}
            >
              {isReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Stories
          </Button>
        </div>

        {/* Story header */}
        <Card className={`shadow-2xl p-8 mb-8 text-center ${cardClasses}`}>
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {story.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">A magical bedtime adventure</p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <span>📅 {new Date(story.createdAt || '').toLocaleDateString()}</span>
            <span>⏱️ {story.length === 'short' ? '2-3' : '4-5'} min read</span>
            <span>🎯 Age {story.childAge}</span>
          </div>
        </Card>

        {/* Story content */}
        <Card className={`shadow-2xl p-8 mb-8 ${cardClasses}`}>
          <article className="prose prose-lg max-w-none leading-relaxed">
            {/* Story illustration placeholder */}
            <div className="w-full h-64 bg-gradient-to-br from-purple-100 via-blue-100 to-yellow-100 dark:from-purple-900 dark:via-blue-900 dark:to-yellow-900 rounded-xl mb-8 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-2 block">✨</span>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Magical Story Illustration</p>
              </div>
            </div>
            
            <div className={isDarkMode ? "text-gray-100" : "text-gray-700"}>
              {formatStoryContent}
              
              {story.bedtimeMessage && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-xl mt-8 border-l-4 border-yellow-400">
                  <p className="text-lg italic text-purple-700 dark:text-purple-300" style={{ fontSize: `${fontSize}px` }}>
                    {story.bedtimeMessage}
                  </p>
                </div>
              )}
            </div>
          </article>
        </Card>

        {/* Story actions */}
        <Card className={`shadow-2xl p-6 ${cardClasses}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </Button>
            
            <Button
              onClick={shareStory}
              variant="outline"
              className="flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
