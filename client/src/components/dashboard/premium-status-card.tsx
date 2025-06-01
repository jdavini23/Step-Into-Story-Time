
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
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <CardTitle className="text-orange-800 flex items-center space-x-2 text-lg sm:text-xl">
              <Sparkles className="h-5 w-5 flex-shrink-0" />
              <span>Upgrade to Premium</span>
            </CardTitle>
            <CardDescription className="text-orange-600 text-sm sm:text-base mt-1 sm:mt-2 pr-0 sm:pr-4">
              Unlock unlimited AI-generated bedtime stories for just $9.99/month
            </CardDescription>
          </div>
          <div className="flex-shrink-0">
            <Link href="/pricing">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full sm:w-auto text-sm sm:text-base py-2 px-4">
                <Crown className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
