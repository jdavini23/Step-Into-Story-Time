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
  const { user, isLoading, isAuthenticated } = useAuth();
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

  // Reading progress tracking with passive listener and rAF throttle
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const progress = (scrollTop / docHeight) * 100;
          setReadingProgress(Math.min(100, Math.max(0, progress)));
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Font size controls
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(24, prev + 2));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(14, prev - 2));
  }, []);

  

  useEffect(() => {
    if (error) {
      console.error("Story reader error:", {
        error,
        storyId,
        userId: (user as any)?.id,
        status: (error as any)?.status,
        message: (error as any)?.message,
      });

      if (isUnauthorizedError(error as Error)) {
        // Store the current URL to redirect back after login
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/api/login?signup=true&returnTo=${encodeURIComponent(currentUrl)}`;
      }
    }
  }, [error, storyId, user]);

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
        credentials: "include",
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

  

  // Handle authentication redirect
  if (!isLoading && !isAuthenticated) {
    // Store the current URL to redirect back after login
    const currentUrl = window.location.pathname + window.location.search;
    window.location.href = `/api/login?returnTo=${encodeURIComponent(currentUrl)}`;
    return null;
  }

  if (isLoading || storyLoading) {
    return (
      <div className="min-h-screen bg-story-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-story-gold via-story-sunset to-story-forest rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-story-bark/70">Loading your magical story...</p>
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
      <div className="min-h-screen bg-story-cream flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-story-bark mb-2">
                {displayTitle}
              </h2>
              <p className="text-story-bark/70 mb-2">{displayMessage}</p>
              {import.meta.env.DEV && (
                <p className="text-xs text-story-bark/60 mb-4">
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
      <div className="min-h-screen bg-story-cream flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-story-bark mb-2">
                Story Not Found
              </h2>
              <p className="text-story-bark/70 mb-6">
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
    : "bg-gradient-to-br from-story-cream via-story-moonlight to-story-mist text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-white border-story-mist";

  return (
    <div className={`min-h-screen transition-all duration-300 ${themeClasses}`}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div
          className="h-full bg-gradient-to-r from-story-gold via-story-sunset to-story-forest transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Reading Controls - Fixed Sidebar for desktop, bottom bar for mobile */}
      <div className="fixed bottom-4 left-4 right-4 md:right-4 md:top-1/2 md:bottom-auto md:left-auto md:transform md:-translate-y-1/2 z-40">
        <div className="flex md:flex-col justify-center gap-2">
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
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Back Navigation */}
        <div className="mb-4 md:mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-2 md:mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Story header */}
        <Card className={`shadow-xl md:shadow-2xl p-6 md:p-8 mb-6 md:mb-8 text-center ${cardClasses}`}>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-story-gold via-story-sunset to-story-forest rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2 px-2">{story.title}</h1>
          <p className="text-story-bark/70 dark:text-gray-400 mb-4 text-sm md:text-base">
            A magical bedtime adventure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-story-bark/60 dark:text-gray-400">
            <span className="whitespace-nowrap">
              📅 {new Date(story.createdAt || "").toLocaleDateString()}
            </span>
            <span className="whitespace-nowrap">
              ⏱️{" "}
              {story.length === "short"
                ? "2-3"
                : story.length === "medium"
                  ? "5-7"
                  : "10-15"}{" "}
              min read
            </span>
            <span className="whitespace-nowrap">🎯 Age {story.childAge}</span>
          </div>
        </Card>

        {/* Story content */}
        <Card className={`shadow-xl md:shadow-2xl p-6 md:p-8 mb-20 md:mb-8 ${cardClasses}`}>
          <article className="max-w-none leading-relaxed font-serif">
            {/* Story illustration placeholder */}
            <div className="w-full h-48 md:h-64 bg-gradient-to-br from-story-cream via-story-mist to-story-moonlight dark:from-purple-900 dark:via-blue-900 dark:to-yellow-900 rounded-xl mb-6 md:mb-8 flex items-center justify-center">
              <div className="text-center p-4">
                <span className="text-4xl md:text-6xl mb-2 block">✨</span>
                <p className="text-sm md:text-base text-story-bark/70 dark:text-gray-300 font-medium">
                  Magical Story Illustration
                </p>
              </div>
            </div>

            <div className={isDarkMode ? "text-gray-100" : "text-story-bark/70"}>
              {formatStoryContent}

              {story.bedtimeMessage && (
                <div className="bg-story-cream dark:bg-yellow-900/30 p-4 md:p-6 rounded-xl mt-6 md:mt-8 border-l-4 border-story-gold">
                  <p
                    className="text-base md:text-lg italic text-story-gold dark:text-purple-300"
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
        <div className="mb-24 md:mb-0">
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
    </div>
  );
}
