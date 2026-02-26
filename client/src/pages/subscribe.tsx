import {
  useStripe,
  Elements,
  PaymentElement,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({
  selectedTier,
  currentPricing,
}: {
  selectedTier: string;
  currentPricing: { price: string; period: string; savings?: string };
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    // Submit the payment element to collect payment method
    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast({
        title: "Payment Failed",
        description: submitError.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Confirm the payment/setup intent
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    if (error) {
      console.error("Payment error details:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      // Handle different error types with more specific messages
      if (error.type === "card_error") {
        switch (error.code) {
          case "card_declined":
            errorMessage =
              "Your card was declined. Please try a different payment method.";
            break;
          case "insufficient_funds":
            errorMessage =
              "Insufficient funds. Please check your account balance.";
            break;
          case "incorrect_cvc":
            errorMessage =
              "The CVC code is incorrect. Please check and try again.";
            break;
          case "expired_card":
            errorMessage =
              "Your card has expired. Please use a different card.";
            break;
          default:
            errorMessage = error.message || "Card error occurred.";
        }
      } else if (error.type === "validation_error") {
        errorMessage =
          error.message || "Please check your payment information.";
      } else if ((error as any).type === "authentication_required") {
        errorMessage =
          "Additional authentication required. Please complete the verification.";
      }

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      // Payment succeeded
      toast({
        title: "Payment Successful",
        description:
          "Welcome to Premium! You now have unlimited story generation.",
      });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
        }}
      />
      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading
          ? "Processing..."
          : `Subscribe for ${currentPricing.price}/${currentPricing.period}`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Get tier and billing period from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const selectedTier = urlParams.get("tier") || "premium";
  const billingPeriod = urlParams.get("billing") || "monthly";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Store the current URL to redirect back after login
      const currentUrl = window.location.pathname + window.location.search;
      console.log("Subscribe page: User not authenticated, redirecting to login with returnTo:", currentUrl);
      window.location.href = `/api/login?signup=true&returnTo=${encodeURIComponent(currentUrl)}`;
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Only create subscription if user is authenticated
    if (user) {
      apiRequest("/api/get-or-create-subscription", "POST", {
        tier: selectedTier,
        billing: billingPeriod,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Subscription response:", data);
          console.log("Client secret:", data.clientSecret);
          
          if (data.error) {
            throw new Error(data.error.message || "Subscription creation failed");
          }
          
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            console.error("No client secret in response", data);
            throw new Error("No payment details received. Please try again.");
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error creating subscription:", error);
          
          let errorMessage = "Unable to set up your subscription. Please try again.";
          let shouldRetry = false;
          
          // Parse error details if available
          if (error.message) {
            try {
              // Check if the error message contains JSON
              const match = error.message.match(/\{.*\}/);
              if (match) {
                const errorData = JSON.parse(match[0]);
                if (errorData.error && errorData.error.message) {
                  errorMessage = errorData.error.message;
                  
                  // Determine if we should retry based on error type
                  const errorType = errorData.error.type;
                  shouldRetry = [
                    "StripeAPIError", 
                    "StripeConnectionError", 
                    "network_error", 
                    "rate_limit_error"
                  ].includes(errorType);
                  
                  // Don't retry on validation errors or invalid requests
                  if (errorType === "StripeInvalidRequestError" || 
                      errorType === "validation_error" ||
                      errorType === "user_error") {
                    shouldRetry = false;
                  }
                }
              } else {
                errorMessage = error.message;
                shouldRetry = error.message.includes("temporarily unavailable") || 
                            error.message.includes("network") ||
                            error.message.includes("timeout") ||
                            error.message.includes("connection") ||
                            error.message.includes("service unavailable");
              }
            } catch (parseError) {
              console.error("Error parsing error message:", parseError);
              errorMessage = error.message || "An unexpected error occurred";
              shouldRetry = false;
            }
          }
          
          setLastError(errorMessage);
          setIsLoading(false);
          
          // Auto-retry logic for temporary failures
          if (retryCount < 2 && shouldRetry) {
            console.log(`Retrying subscription setup (attempt ${retryCount + 1})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setIsLoading(true);
              setLastError(null);
            }, Math.pow(2, retryCount) * 1000); // Exponential backoff: 1s, 2s, 4s
          } else {
            toast({
              title: "Setup Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        });
    }
  }, [user, selectedTier, billingPeriod, toast, retryCount]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-story-cream to-story-mist flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  // Calculate pricing based on tier and billing period
  const getPricing = () => {
    const isYearly = billingPeriod === "yearly";

    if (selectedTier === "family") {
      return {
        monthly: { price: "$12.99", period: "month" },
        yearly: { price: "$109", period: "year", savings: "Save $47/year" },
      };
    } else {
      return {
        monthly: { price: "$6.99", period: "month" },
        yearly: { price: "$59", period: "year", savings: "Save $25/year" },
      };
    }
  };

  const pricing = getPricing();
  const currentPricing =
    billingPeriod === "yearly" ? pricing.yearly : pricing.monthly;

  const features = [
    "Unlimited AI-generated bedtime stories",
    "Personalized characters and themes",
    "Multiple story lengths and tones",
    "Save and favorite stories",
    "Priority customer support",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-story-cream to-story-mist py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-serif text-story-bark mb-4">
            {selectedTier === "family"
              ? "Upgrade to Storytime Pro"
              : "Upgrade to Storytime Plus"}
          </h1>
          <p className="text-xl text-story-bark/70">
            {selectedTier === "family"
              ? "The ultimate storytelling experience for families with multiple children"
              : "Unlock unlimited personalized bedtime stories for your little one"}
          </p>
          {billingPeriod === "yearly" && (
            <div className="mt-4">
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                {pricing.yearly.savings} with yearly billing
              </Badge>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-story-bark">Premium Features</CardTitle>
              <CardDescription>
                Everything you need for magical bedtime stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-story-bark/70">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-story-cream rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-story-gold">
                    {currentPricing.price}
                  </div>
                  <div className="text-sm text-story-bark/70">
                    per {currentPricing.period}
                  </div>
                  {billingPeriod === "yearly" && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      {pricing.yearly.savings}
                    </div>
                  )}
                  <div className="text-xs text-story-bark/60 mt-1">
                    Cancel anytime
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-story-bark">Complete Your Subscription</CardTitle>
              <CardDescription>
                Enter your payment details to start your premium subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-story-bark/70">
                    Setting up your subscription...
                  </p>
                </div>
              ) : clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#c4914d",
                      },
                    },
                  }}
                >
                  <SubscribeForm
                    selectedTier={selectedTier}
                    currentPricing={currentPricing}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">⚠</span>
                    </div>
                    <h3 className="text-lg font-semibold text-story-bark mb-2">
                      Payment Setup Failed
                    </h3>
                    <p className="text-story-bark/70 mb-4">
                      We encountered an issue setting up your subscription payment. This might be temporary.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setIsLoading(true);
                        setClientSecret("");
                        // Trigger useEffect to retry
                        window.location.reload();
                      }}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => window.location.href = "/pricing"}
                        variant="outline"
                        className="flex-1"
                      >
                        Back to Pricing
                      </Button>
                      <Button
                        onClick={() => window.location.href = "/dashboard"}
                        variant="ghost"
                        className="flex-1"
                      >
                        Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
