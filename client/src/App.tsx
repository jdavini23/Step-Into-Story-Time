import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import StoryWizard from "@/pages/story-wizard";
import StoryReader from "@/pages/story-reader";
import Dashboard from "@/pages/dashboard";
import Subscribe from "@/pages/subscribe";
import Pricing from "@/pages/pricing";
import Header from "@/components/header";
import Login from "@/pages/login";

const Characters = lazy(() => import("@/pages/characters"));

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
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <Header />
          <Switch>
            <Route path="/pricing" component={Pricing} />
            <Route path="/characters" component={Characters} />
            <Route path="/story-wizard" component={StoryWizard} />
            <Route path="/story/:id" component={StoryReader} />
            <Route path="/subscribe" component={Subscribe} />
            {!isAuthenticated ? (
              <Route path="/" component={Landing} />
            ) : (
              <Route path="/" component={Dashboard} />
            )}
            <Route component={NotFound} />
          </Switch>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
