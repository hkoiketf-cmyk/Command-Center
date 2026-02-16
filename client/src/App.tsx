import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";

function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, hasAccess, refetch } = useSubscription();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      apiRequest("POST", "/api/stripe/sync-subscription", {})
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
          window.history.replaceState({}, "", "/");
        })
        .catch(console.error);
    } else if (params.get("checkout") === "cancel") {
      window.history.replaceState({}, "", "/");
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  if (subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasAccess && location !== "/pricing") {
    return <Pricing />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="hunteros-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
