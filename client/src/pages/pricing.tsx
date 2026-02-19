import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Zap, CreditCard, Loader2, Gift, Home } from "lucide-react";
import { apiRequest, queryClient, getErrorMessage } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type StripePriceRow = {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string; trial_period_days?: number } | null;
  metadata: { plan?: string } | null;
};

const features = [
  "19 productivity widgets",
  "Unlimited desktops",
  "Drag & drop layouts",
  "Notes, priorities, revenue tracking",
  "Habit tracker & daily journal",
  "CRM pipeline & time blocks",
  "Google Calendar integration",
  "AI chat widget",
  "Data export & sync",
];

export default function Pricing() {
  const { user } = useAuth();
  const { subscription, hasAccess } = useSubscription();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const { toast } = useToast();

  const { data: pricesData, isLoading: pricesLoading, isError: pricesError, refetch: refetchPrices } = useQuery<{ prices: StripePriceRow[] }>({
    queryKey: ["/api/stripe/prices"],
  });

  const prices = pricesData?.prices || [];
  const monthlyPrice = prices.find((p) => p.recurring?.interval === "month");
  const yearlyPrice = prices.find((p) => p.recurring?.interval === "year");

  const handleSubscribe = async (priceId: string, plan: string) => {
    setLoadingPlan(plan);
    try {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({ title: "Checkout failed", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPlan("portal");
    try {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({ title: "Could not open billing", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRedeemCode = async () => {
    if (!accessCode.trim()) return;
    setRedeemLoading(true);
    try {
      const res = await apiRequest("POST", "/api/redeem-code", { code: accessCode.trim() });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Access code redeemed!", description: "You now have free access to MallenniumDash." });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        setAccessCode("");
      }
    } catch (error: any) {
      const msg = error?.message || "Failed to redeem code";
      toast({ title: "Invalid code", description: msg, variant: "destructive" });
    } finally {
      setRedeemLoading(false);
    }
  };

  const isAccessCodeUser = subscription?.accessCode === true;
  const isActive = subscription?.status === "active" && !isAccessCodeUser;
  const isTrial = subscription?.status === "trialing";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <button onClick={() => hasAccess ? setLocation("/") : undefined} className="flex items-center gap-2 rounded-md hover:opacity-90 transition-opacity cursor-pointer bg-transparent border-0 p-0" data-testid="link-home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">MallenniumDash</span>
          </button>
          {hasAccess && (
            <Button variant="outline" size="sm" onClick={() => setLocation("/")} data-testid="link-back-dashboard">
              <Home className="h-4 w-4 mr-1.5" />
              Dashboard
            </Button>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" data-testid="text-pricing-title">
            {isActive ? "Manage Your Plan" : isAccessCodeUser ? "Your Plan" : "Choose Your Plan"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isTrial
              ? "Your free trial is active. You'll be charged when it ends."
              : isActive
                ? `You're on the ${subscription?.plan || "pro"} plan.`
                : isAccessCodeUser
                  ? "You have free access via access code. You can also subscribe to a paid plan below."
                  : "Add your card to start your 3-day free trial. You won't be charged until the trial ends."}
          </p>
          {isTrial && subscription?.trialEnd && (
            <p className="mt-2 text-sm text-muted-foreground" data-testid="text-trial-end">
              Trial ends: {new Date(subscription.trialEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        {(isActive || isTrial) && (
          <div className="text-center mb-8">
            <Button
              onClick={handleManageBilling}
              disabled={loadingPlan === "portal"}
              data-testid="button-manage-billing"
            >
              {loadingPlan === "portal" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {isTrial ? "Manage Billing or Cancel" : "Manage Billing"}
            </Button>
            {isTrial && (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="text-cancel-during-trial">
                Cancel during your trial and you won't be charged.
              </p>
            )}
          </div>
        )}

        {pricesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pricesError ? (
          <div className="text-center py-12 space-y-4 max-w-md mx-auto">
            <p className="text-muted-foreground">Couldn&apos;t load plans. Please try again.</p>
            <Button onClick={() => refetchPrices()} variant="outline" data-testid="button-retry-prices">
              Try again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className={`relative ${subscription?.plan === "monthly" ? "ring-2 ring-primary" : ""}`} data-testid="card-monthly-plan">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span>Monthly</span>
                  {subscription?.plan === "monthly" && <Badge>Current Plan</Badge>}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">$6</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Card required. Charged after 3-day free trial.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {!isActive && !isTrial && (
                  monthlyPrice ? (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(monthlyPrice.id, "monthly")}
                      disabled={!!loadingPlan}
                      data-testid="button-subscribe-monthly"
                    >
                      {loadingPlan === "monthly" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Add card & start trial
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Plans didn&apos;t load. Refresh the page or try again in a moment.</p>
                      <Button variant="outline" className="w-full" onClick={() => refetchPrices()} disabled={pricesLoading}>
                        Refresh plans
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            <Card className={`relative ${subscription?.plan === "yearly" ? "ring-2 ring-primary" : ""}`} data-testid="card-yearly-plan">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default">Save 17%</Badge>
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span>Annual</span>
                  {subscription?.plan === "yearly" && <Badge>Current Plan</Badge>}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">$60</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  $5/mo — Card required. Charged after 3-day trial.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {!isActive && !isTrial && (
                  yearlyPrice ? (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(yearlyPrice.id, "yearly")}
                      disabled={!!loadingPlan}
                      data-testid="button-subscribe-yearly"
                    >
                      {loadingPlan === "yearly" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Add card & start trial
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Plans didn&apos;t load. Refresh the page or try again in a moment.</p>
                      <Button variant="outline" className="w-full" onClick={() => refetchPrices()} disabled={pricesLoading}>
                        Refresh plans
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!isActive && (
          <div className="mt-10 max-w-md mx-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="h-4 w-4" />
                  Have an access code?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
                    className="font-mono tracking-wider"
                    data-testid="input-access-code"
                  />
                  <Button
                    onClick={handleRedeemCode}
                    disabled={redeemLoading || !accessCode.trim()}
                    data-testid="button-redeem-code"
                  >
                    {redeemLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Cancel anytime. Your data is always safe.</p>
        </div>
      </main>
    </div>
  );
}
