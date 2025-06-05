import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Heart,
  HeartOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CSRFForm } from "@/components/ui/csrf-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StoryManagementMenuProps {
  storyId: number;
  isFavorited?: boolean;
  canDownloadPDF?: boolean;
  onEdit?: () => void;
}

export function StoryManagementMenu({
  storyId,
  isFavorited,
  canDownloadPDF = true,
  onEdit,
}: StoryManagementMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (csrfToken: string) => {
      return apiRequest("DELETE", `/api/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast({
        title: "Story deleted",
        description: "The story has been successfully deleted.",
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (csrfToken: string) => {
      const method = isFavorited ? "DELETE" : "POST";
      return apiRequest(method, `/api/favorites/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
        description: isFavorited
          ? "Story removed from your favorites."
          : "Story added to your favorites.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}/pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${storyId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Story
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => favoriteMutation.mutate("")}
            disabled={favoriteMutation.isPending}
          >
            {isFavorited ? (
              <>
                <HeartOff className="h-4 w-4 mr-2" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Add to Favorites
              </>
            )}
          </DropdownMenuItem>

          {canDownloadPDF && (
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Story
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <CSRFForm
              onSubmit={(event, csrfToken) => {
                event.preventDefault();
                deleteMutation.mutate(csrfToken);
              }}
              className="inline"
            >
              <AlertDialogAction
                type="submit"
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </CSRFForm>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
