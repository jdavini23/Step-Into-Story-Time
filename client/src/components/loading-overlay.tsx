import { BookOpen } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function LoadingOverlay({
  isLoading,
  message = "Loading...",
  progress = 0,
  showProgress = false,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
          <div className="w-full h-full bg-story-gold rounded-full flex items-center justify-center animate-pulse">
            <BookOpen className="w-7 h-7 sm:w-9 sm:h-9 text-story-night" />
          </div>
        </div>

        <p className="text-story-bark text-sm sm:text-base font-medium mb-4">
          {message}
        </p>

        {showProgress && (
          <div className="w-full bg-story-mist rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-story-gold via-story-sunset to-story-forest h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
