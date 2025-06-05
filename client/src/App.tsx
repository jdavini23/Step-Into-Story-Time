import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import StoryWizard from "@/pages/story-wizard";
import StoryReader from "@/pages/story-reader";
import Dashboard from "@/pages/dashboard";
import Subscribe from "@/pages/subscribe";
import Pricing from "@/pages/pricing";
import Header from "@/components/header";
import React from "react";
import { EnhancedErrorBoundary } from "./components/enhanced-error-boundary";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-600">Loading your magical world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <Header />
      <Switch>
        <Route path="/pricing" component={Pricing} />
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/story-wizard" component={StoryWizard} />
            <Route path="/story/:id" component={StoryReader} />
            <Route path="/subscribe" component={Subscribe} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EnhancedErrorBoundary
        showReportButton={process.env.NODE_ENV === "development"}
        onError={(error, errorInfo) => {
          // Send error to monitoring service in production
          if (process.env.NODE_ENV === "production") {
            console.error("App Error:", error, errorInfo);
          }
        }}
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </EnhancedErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
