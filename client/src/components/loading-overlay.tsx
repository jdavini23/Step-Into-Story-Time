
import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({ isLoading, message = "Loading..." }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-xl sm:text-2xl">✨</span>
        </div>
        <p className="text-gray-600 text-sm sm:text-base font-medium">{message}</p>
      </div>
    </div>
  );
}
