
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Heart, 
  HeartOff, 
  Download, 
  Share2, 
  Trash2,
  Edit,
  Crown
} from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTierInfo } from "@/hooks/useTierInfo";
import type { Story } from "@shared/schema";

interface StoryActionsMenuProps {
  story: Story;
  isFavorited: boolean;
}

export function StoryActionsMenu({ story, isFavorited }: StoryActionsMenuProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tierInfo } = useTierInfo();

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favorites/${story.id}`, { method });
      if (!response.ok) throw new Error('Failed to update favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
        description: `"${story.title}" has been ${isFavorited ? 'removed from' : 'added to'} your favorites.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete story');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Story deleted",
        description: `"${story.title}" has been deleted successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = async () => {
    if (!tierInfo?.limits.canDownloadPdf) {
      toast({
        title: "Premium Feature",
        description: "PDF downloads are available for Premium subscribers only.",
        action: (
          <Button onClick={() => setLocation("/pricing")} size="sm">
            Upgrade <Crown className="w-3 h-3 ml-1" />
          </Button>
        ),
      });
      return;
    }

    try {
      const response = await fetch(`/api/stories/${story.id}/pdf`);
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded",
        description: `"${story.title}" has been saved to your downloads.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: `Check out this bedtime story: ${story.title}`,
          url: window.location.origin + `/story/${story.id}`,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin + `/story/${story.id}`);
        toast({
          title: "Link Copied",
          description: "Story link has been copied to your clipboard.",
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Unable to share story. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocation(`/story/${story.id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Read Story
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => favoriteMutation.mutate()}>
          {isFavorited ? (
            <>
              <HeartOff className="mr-2 h-4 w-4" />
              Remove from Favorites
            </>
          ) : (
            <>
              <Heart className="mr-2 h-4 w-4" />
              Add to Favorites
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
          {!tierInfo?.limits.canDownloadPdf && (
            <Crown className="ml-auto h-3 w-3 text-purple-600" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Story
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => deleteMutation.mutate()}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Story
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
