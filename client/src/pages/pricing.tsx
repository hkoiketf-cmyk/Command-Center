import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Zap, CreditCard, Loader2, Gift } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const { subscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const { toast } = useToast();

  const { data: pricesData, isLoading: pricesLoading } = useQuery<{ prices: StripePriceRow[] }>({
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
      console.error("Checkout error:", error);
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
      console.error("Portal error:", error);
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

  const isActive = subscription?.status === "active";
  const isTrial = subscription?.status === "trialing";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">MallenniumDash</span>
          </div>
          {isActive && (
            <Button variant="outline" asChild data-testid="link-back-dashboard">
              <a href="/">Back to Dashboard</a>
            </Button>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" data-testid="text-pricing-title">
            {isActive ? "Manage Your Plan" : "Choose Your Plan"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isTrial
              ? "Your free trial is active. Subscribe before it ends to keep access."
              : isActive
                ? `You're on the ${subscription?.plan || "pro"} plan.`
                : "Start with a 3-day free trial. No credit card required to begin."}
          </p>
          {isTrial && subscription?.trialEnd && (
            <p className="mt-2 text-sm text-muted-foreground" data-testid="text-trial-end">
              Trial ends: {new Date(subscription.trialEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        {isActive && (
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
              Manage Billing
            </Button>
          </div>
        )}

        {pricesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Includes 3-day free trial
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
                {!isActive && monthlyPrice && (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(monthlyPrice.id, "monthly")}
                    disabled={!!loadingPlan}
                    data-testid="button-subscribe-monthly"
                  >
                    {loadingPlan === "monthly" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Start Free Trial
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className={`relative ${subscription?.plan === "yearly" ? "ring-2 ring-primary" : ""}`} data-testid="card-yearly-plan">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default">Save 30%</Badge>
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span>Annual</span>
                  {subscription?.plan === "yearly" && <Badge>Current Plan</Badge>}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">$75.60</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  $6.30/mo — Includes 3-day free trial
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
                {!isActive && yearlyPrice && (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(yearlyPrice.id, "yearly")}
                    disabled={!!loadingPlan}
                    data-testid="button-subscribe-yearly"
                  >
                    {loadingPlan === "yearly" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Start Free Trial
                  </Button>
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
