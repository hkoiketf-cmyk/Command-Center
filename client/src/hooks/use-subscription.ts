import { useQuery } from "@tanstack/react-query";

export type SubscriptionStatus = {
  status: "trialing" | "active" | "past_due" | "canceled" | "expired" | "incomplete";
  trialEnd?: string | null;
  plan?: "monthly" | "yearly" | "free" | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  accessCode?: boolean;
};

async function fetchSubscription(): Promise<SubscriptionStatus> {
  const response = await fetch("/api/subscription", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useSubscription() {
  const { data, isLoading, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription"],
    queryFn: fetchSubscription,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const hasAccess =
    data?.status === "trialing" ||
    data?.status === "active" ||
    data?.status === "past_due";

  return {
    subscription: data,
    isLoading,
    hasAccess,
    refetch,
  };
}
