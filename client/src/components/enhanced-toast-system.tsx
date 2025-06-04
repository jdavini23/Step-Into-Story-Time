import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Heart, Trash2, Download, Share } from "lucide-react";

export function useEnhancedToast() {
  const { toast } = useToast();

  const showSuccessToast = (action: string, details?: string) => {
    toast({
      title: `${action} Successful!`,
      description: details,
      variant: "default",
    });
  };

  const showActionToast = {
    storyCreated: (storyTitle: string) =>
      showSuccessToast(
        "Story Created",
        `"${storyTitle}" has been added to your library`,
      ),

    storyFavorited: (storyTitle: string) =>
      showSuccessToast(
        "Added to Favorites",
        `"${storyTitle}" is now in your favorites`,
      ),

    storyUnfavorited: (storyTitle: string) =>
      showSuccessToast(
        "Removed from Favorites",
        `"${storyTitle}" has been removed from favorites`,
      ),

    storyDeleted: (storyTitle: string) =>
      showSuccessToast(
        "Story Deleted",
        `"${storyTitle}" has been removed from your library`,
      ),

    storyShared: () =>
      showSuccessToast(
        "Link Copied",
        "Story link has been copied to clipboard",
      ),

    pdfDownloaded: (storyTitle: string) =>
      showSuccessToast(
        "PDF Downloaded",
        `"${storyTitle}" has been saved to your device`,
      ),

    dataRefreshed: () =>
      showSuccessToast("Data Refreshed", "Your story library has been updated"),

    settingsUpdated: () =>
      showSuccessToast("Settings Updated", "Your preferences have been saved"),
  };

  return { showActionToast, toast };
}
