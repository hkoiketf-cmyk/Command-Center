import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { LoadingScreen } from "@/components/loading-screen";
import { apiRequest } from "@/lib/queryClient";

const Landing = lazy(() => import("@/pages/landing"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Pricing = lazy(() => import("@/pages/pricing"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, hasAccess, refetch } = useSubscription();
  const [location, setLocation] = useLocation();
  const [checkoutSyncing, setCheckoutSyncing] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("checkout") === "success";
  });
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success" && !syncAttempted.current) {
      syncAttempted.current = true;
      setCheckoutSyncing(true);
      apiRequest("POST", "/api/stripe/sync-subscription", {})
        .then(async () => {
          await queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
          await queryClient.refetchQueries({ queryKey: ["/api/subscription"] });
        })
        .catch(console.error)
        .finally(() => {
          window.history.replaceState({}, "", "/");
          setCheckoutSyncing(false);
        });
    } else if (params.get("checkout") === "cancel") {
      window.history.replaceState({}, "", "/pricing");
    }
  }, [isAuthenticated, authLoading]);

  // Refetch subscription when window regains focus (e.g. user completed checkout in another tab)
  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated]);

  // Preload dashboard chunk when user has access (so navigation to / is faster)
  useEffect(() => {
    if (hasAccess) void import("@/pages/dashboard");
  }, [hasAccess]);

  // Redirect to pricing when authenticated but no access (skip during checkout sync)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !subLoading && !hasAccess && !checkoutSyncing && location !== "/pricing") {
      setLocation("/pricing");
    }
  }, [authLoading, isAuthenticated, subLoading, hasAccess, checkoutSyncing, location, setLocation]);

  if (authLoading) {
    return <LoadingScreen label="Loading" />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingScreen label="Loading" />}>
        <Landing />
      </Suspense>
    );
  }

  if (subLoading || checkoutSyncing) {
    return <LoadingScreen label="Loading subscription" />;
  }

  if (!hasAccess && location !== "/pricing") {
    return <LoadingScreen label="Loading" />;
  }

  return (
    <Suspense fallback={<LoadingScreen label="Loading" />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="hunteros-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
