import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTierInfo } from "@/hooks/useTierInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getQueryFn } from "@/lib/queryClient";
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
  ZoomOut,
} from "lucide-react";
import type { Story } from "@shared/schema";
import { StoryReadingControls } from "@/components/story-reading-controls";
import { StoryActions } from "@/components/story-actions";

export default function StoryReader() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { data: tierInfo } = useTierInfo();
  const { toast } = useToast();
  const storyId = params.id;

  // Validate story ID
  useEffect(() => {
    if (!storyId || isNaN(parseInt(storyId))) {
      console.error("Invalid story ID:", storyId);
      toast({
        title: "Invalid Story",
        description: "The story ID is invalid.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 1000);
    }
  }, [storyId, toast, setLocation]);

  // Reading experience state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const {
    data: story,
    isLoading: storyLoading,
    error,
  } = useQuery<Story>({
    queryKey: [`/api/stories/${storyId}`],
    queryFn: getQueryFn<Story>({ on401: "throw" }),
    enabled: !!user && !!storyId,
    retry: (failureCount, error: any) => {
      // Don't retry for 404 (not found) or 403 (forbidden) errors
      if (error?.status === 404 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    setFontSize((prev) => Math.min(24, prev + 2));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(14, prev - 2));
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Story reader: User not authenticated, redirecting to login");
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
    if (error) {
      console.error("Story reader error:", {
        error,
        storyId,
        userId: user?.id,
        status: (error as any)?.status,
        message: (error as any)?.message,
      });

      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    }
  }, [error, toast, storyId, user?.id]);

  const downloadPDF = useCallback(async () => {
    if (!story) return;

    try {
      // Check if user has PDF download access
      if (!tierInfo?.limits.canDownloadPdf) {
        toast({
          title: "Premium Feature",
          description:
            "PDF downloads are available for Premium and Family subscribers only.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/stories/${story.id}/pdf`, {
        method: "GET",
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          toast({
            title: "Access Restricted",
            description:
              errorData.message ||
              "PDF downloads are available for Premium subscribers only.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded",
        description: "Your story has been saved as a PDF!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [story, toast, tierInfo]);

  const shareStory = useCallback(() => {
    if (navigator.share && story) {
      navigator
        .share({
          title: story.title,
          text: `Check out this magical bedtime story: ${story.title}`,
          url: window.location.href,
        })
        .catch(() => {
          copyToClipboard();
        });
    } else {
      copyToClipboard();
    }
  }, [story]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Story link copied to clipboard!",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      });
  }, [toast]);

  const formatStoryContent = useMemo(() => {
    if (!story) return [];
    return story.content.split("\n\n").map((paragraph, index) => {
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
    const errorStatus = (error as any)?.status;
    const errorMessage = (error as any)?.message || "Unknown error occurred";

    let displayTitle = "Something went wrong";
    let displayMessage = "We couldn't load this story. Please try again.";

    if (errorStatus === 404) {
      displayTitle = "Story Not Found";
      displayMessage =
        "This story doesn't exist or you don't have permission to view it.";
    } else if (errorStatus === 403) {
      displayTitle = "Access Denied";
      displayMessage = "You don't have permission to view this story.";
    } else if (errorStatus >= 500) {
      displayTitle = "Server Error";
      displayMessage =
        "There's a problem with our servers. Please try again in a few moments.";
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                {displayTitle}
              </h2>
              <p className="text-gray-600 mb-2">{displayMessage}</p>
              {import.meta.env.DEV && (
                <p className="text-xs text-gray-400 mb-4">
                  Debug: {errorStatus ? `${errorStatus} - ` : ""}
                  {errorMessage}
                </p>
              )}
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
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Story Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                This story doesn't exist or you don't have permission to view
                it.
              </p>
              <Button onClick={() => setLocation("/")}>Go Home</Button>
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
        <StoryReadingControls
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          fontSize={fontSize}
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
          isReading={isReading}
          onToggleReadAloud={toggleReadAloud}
          cardClasses={cardClasses}
        />
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
          <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            A magical bedtime adventure
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <span>
              📅 {new Date(story.createdAt || "").toLocaleDateString()}
            </span>
            <span>
              ⏱️{" "}
              {story.length === "short"
                ? "2-3"
                : story.length === "medium"
                  ? "5-7"
                  : "10-15"}{" "}
              min read
            </span>
            <span>🎯 Age {story.childAge}</span>
          </div>
        </Card>

        {/* Story content */}
        <Card className={`shadow-2xl p-8 mb-8 ${cardClasses}`}>
          <article className="max-w-none leading-relaxed">
            {/* Story illustration placeholder */}
            <div className="w-full h-64 bg-gradient-to-br from-purple-100 via-blue-100 to-yellow-100 dark:from-purple-900 dark:via-blue-900 dark:to-yellow-900 rounded-xl mb-8 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-2 block">✨</span>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Magical Story Illustration
                </p>
              </div>
            </div>

            <div className={isDarkMode ? "text-gray-100" : "text-gray-700"}>
              {formatStoryContent}

              {story.bedtimeMessage && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-xl mt-8 border-l-4 border-yellow-400">
                  <p
                    className="text-lg italic text-purple-700 dark:text-purple-300"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {story.bedtimeMessage}
                  </p>
                </div>
              )}
            </div>
          </article>
        </Card>

        {/* Story actions */}
        <StoryActions
          story={story}
          onDownloadPDF={downloadPDF}
          onShare={shareStory}
          onCreateAnother={() => setLocation("/story-wizard")}
          tierInfo={tierInfo}
          cardClasses={cardClasses}
        />
      </div>
    </div>
  );
}
