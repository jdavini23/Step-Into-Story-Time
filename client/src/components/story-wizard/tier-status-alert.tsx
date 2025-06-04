import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Star, Crown } from "lucide-react";
import type { TierInfo } from "@/hooks/useTierInfo";

interface TierStatusAlertProps {
  tierInfo: TierInfo;
  onUpgradeClick: () => void;
}

export function TierStatusAlert({
  tierInfo,
  onUpgradeClick,
}: TierStatusAlertProps) {
  if (tierInfo.tier === "free") {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Star className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <span>
              Free Plan: {tierInfo.storiesRemaining || 0} stories remaining this
              week
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onUpgradeClick}
              className="ml-4"
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (tierInfo.tier === "premium") {
    return (
      <Alert className="border-purple-200 bg-purple-50">
        <Crown className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          Premium Plan: Unlimited story generation
        </AlertDescription>
      </Alert>
    );
  }

  if (tierInfo.tier === "family") {
    return (
      <Alert className="border-emerald-200 bg-emerald-50">
        <Crown className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          Family Plan: Ultimate storytelling experience
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
