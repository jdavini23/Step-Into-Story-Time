interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = "Creating your magical story..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-yellow-50/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-4xl">✨</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">{message}</h3>
        <p className="text-gray-600 mb-6">Our storytelling wizard is crafting something special</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
}
