
import React from 'react';

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
  showProgress = false 
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
        {/* Animated icon with rotating sparkles */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
          <div className="w-full h-full bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-2xl sm:text-3xl">✨</span>
          </div>
          {/* Rotating sparkles around the main icon */}
          <div className="absolute inset-0 animate-spin">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
              <span className="text-yellow-400 text-xs">⭐</span>
            </div>
            <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
              <span className="text-purple-400 text-xs">✨</span>
            </div>
            <div className="absolute bottom-0 left-0 transform -translate-x-1 translate-y-1">
              <span className="text-blue-400 text-xs">💫</span>
            </div>
          </div>
        </div>

        {/* Loading message */}
        <p className="text-gray-700 text-sm sm:text-base font-medium mb-4">{message}</p>

        {/* Progress bar (optional) */}
        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Animated dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
