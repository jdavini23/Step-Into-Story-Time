import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense, type ComponentType } from "react";
import { BookOpen } from "lucide-react";
import Header from "@/components/header";

const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const StoryWizard = lazy(() => import("@/pages/story-wizard"));
const StoryReader = lazy(() => import("@/pages/story-reader"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Login = lazy(() => import("@/pages/login"));
const Characters = lazy(() => import("@/pages/characters"));

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-story-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-story-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <p className="text-story-bark">Loading your magical world...</p>
        </div>
      </div>
    );
  }

  const suspenseFallback = (
    <div className="min-h-screen bg-story-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-story-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-story-bark">Loading your magical world...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={suspenseFallback}>
      <div className="min-h-screen bg-story-cream">
        <Switch>
          <Route path="/login" component={Login} />
          <Route>
            <Header />
            <Switch>
              <Route path="/pricing" component={Pricing} />
              <Route path="/characters">{() => <ProtectedRoute component={Characters} />}</Route>
              <Route path="/story-wizard">{() => <ProtectedRoute component={StoryWizard} />}</Route>
              <Route path="/story/:id">{() => <ProtectedRoute component={StoryReader} />}</Route>
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
    </Suspense>
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
