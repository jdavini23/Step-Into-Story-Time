
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface EnhancedErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  description?: string;
  showNetworkStatus?: boolean;
}

export function EnhancedErrorState({ 
  error, 
  onRetry, 
  title = "Something went wrong", 
  description,
  showNetworkStatus = true 
}: EnhancedErrorStateProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorDetails = () => {
    if (!isOnline) {
      return {
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
        icon: <WifiOff className="h-12 w-12 text-red-500" />
      };
    }

    if (error?.message?.includes('fetch')) {
      return {
        title: "Connection Error",
        description: "Unable to connect to our servers. Please try again in a moment.",
        icon: <Wifi className="h-12 w-12 text-amber-500" />
      };
    }

    return {
      title,
      description: description || error?.message || "An unexpected error occurred. Please try again.",
      icon: <AlertTriangle className="h-12 w-12 text-red-500" />
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          {errorDetails.icon}
        </div>
        <CardTitle className="text-xl text-red-800 dark:text-red-200">
          {errorDetails.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-red-700 dark:text-red-300">
          {errorDetails.description}
        </p>
        
        {showNetworkStatus && (
          <div className="flex items-center justify-center space-x-2 text-xs">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>
        )}

        <div className="flex space-x-2 justify-center">
          <Button 
            onClick={handleRetry}
            disabled={isRetrying || !isOnline}
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
