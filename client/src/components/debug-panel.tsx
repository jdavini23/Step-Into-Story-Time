import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTierInfo } from "@/hooks/useTierInfo";
import { useQueryClient } from "@tanstack/react-query";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  const { data: tierInfo } = useTierInfo();
  const queryClient = useQueryClient();

  const fetchDebugInfo = async () => {
    try {
      const response = await apiRequest("GET", "/api/debug/user-info");
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Failed to fetch debug info:", error);
    }
  };

  const setTier = async (tier: string, status = "active") => {
    try {
      console.log(`Debug Panel: Attempting to set tier to ${tier} with status ${status}`);
      
      const response = await apiRequest("POST", "/api/debug/set-tier", {
        tier,
        status,
      });

      console.log(`Debug Panel: Response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error("Debug Panel: Error response data:", errorData);
        } catch (parseError) {
          console.error("Debug Panel: Failed to parse error response:", parseError);
          const responseText = await response.text();
          console.error("Debug Panel: Raw response text:", responseText);
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Debug Panel: Success response:", data);

      toast({
        title: "Tier Updated Successfully",
        description: `Updated to ${tier} tier with ${status} status`,
      });

      // Refresh all relevant queries with a small delay to ensure backend is updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user/tier-info"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription-status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      }, 100);

      await fetchDebugInfo();
    } catch (error: any) {
      console.error("Debug Panel: Error setting tier:", error);
      toast({
        title: "Failed to Update Tier",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const resetUsage = async () => {
    try {
      const response = await apiRequest("POST", "/api/debug/reset-usage");
      const data = await response.json();

      toast({
        title: "Usage Reset",
        description: data.message,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user/tier-info"] });
      await fetchDebugInfo();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset usage",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            setIsOpen(true);
            fetchDebugInfo();
          }}
          variant="outline"
          className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
        >
          🔧 Debug Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-yellow-50 border-yellow-400">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-yellow-800">
              Debug Panel (Dev Only)
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Current Status */}
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">
              Current Status
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Tier:</span>
                <Badge variant="outline" className="text-xs">
                  {tierInfo?.tier || "loading..."}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Weekly Usage:</span>
                <span>{tierInfo?.weeklyUsage || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Can Generate:</span>
                <span>{tierInfo?.canGenerate ? "✅" : "❌"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">
              Quick Test Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTier("free")}
                className="text-xs"
              >
                Set Free
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTier("premium")}
                className="text-xs"
              >
                Set Premium
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTier("family")}
                className="text-xs"
              >
                Set Family
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTier("premium", "canceled")}
                className="text-xs"
              >
                Set Canceled
              </Button>
            </div>
          </div>

          <Separator />

          {/* Usage Controls */}
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">
              Usage Controls
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={resetUsage}
              className="w-full text-xs"
            >
              Reset Weekly Usage
            </Button>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Debug Info
                </h4>
                <div className="text-xs bg-white p-2 rounded border max-h-40 overflow-auto">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </div>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={fetchDebugInfo}
            className="w-full text-xs"
          >
            Refresh Debug Info
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
