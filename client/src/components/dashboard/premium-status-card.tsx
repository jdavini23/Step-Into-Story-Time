
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles } from "lucide-react";

interface PremiumStatusCardProps {
  subscriptionStatus: { hasActiveSubscription: boolean; status?: string } | undefined;
}

export function PremiumStatusCard({ subscriptionStatus }: PremiumStatusCardProps) {
  if (!subscriptionStatus) return null;

  if (subscriptionStatus.hasActiveSubscription) {
    return (
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 mb-6 sm:mb-8">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-purple-800">Premium Active</CardTitle>
          </div>
          <CardDescription className="text-purple-600">
            You have unlimited access to personalized bedtime stories
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mb-6 sm:mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-orange-800 flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Upgrade to Premium</span>
            </CardTitle>
            <CardDescription className="text-orange-600">
              Unlock unlimited AI-generated bedtime stories for just $9.99/month
            </CardDescription>
          </div>
          <Link href="/subscribe">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </CardHeader>
    </Card>
  );
}
