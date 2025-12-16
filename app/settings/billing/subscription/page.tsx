"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

interface Subscription {
  id: string;
  tier: string;
  name: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pricePerUnit: number;
  quantity: number;
  trialEnd?: string;
}

interface PricingTier {
  tier: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Record<string, boolean>;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, tiersRes] = await Promise.all([
          fetch("/api/billing/subscription"),
          fetch("/api/billing/pricing"),
        ]);

        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }

        if (tiersRes.ok) {
          const data = await tiersRes.json();
          setTiers(data.tiers);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh subscription data
        const subRes = await fetch("/api/billing/subscription");
        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_period_end: false }),
      });

      if (response.ok) {
        const subRes = await fetch("/api/billing/subscription");
        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }
      }
    } catch (error) {
      console.error("Failed to reactivate:", error);
    } finally {
      setReactivating(false);
    }
  };

  const currentTier = tiers.find((t) => t.tier === subscription?.tier);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings/billing")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Subscription</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription plan
          </p>
        </div>
      </div>

      {subscription ? (
        <>
          {/* Current Plan Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Plan</CardTitle>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{currentTier?.name || subscription.tier}</h3>
                  <p className="text-muted-foreground">
                    ${subscription.pricePerUnit}/month
                    {subscription.quantity > 1 && ` × ${subscription.quantity} seats`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Billing cycle</p>
                  <p className="font-medium capitalize">{subscription.billingCycle}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Current period
                  </div>
                  <p className="font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Next billing date</div>
                  <p className="font-medium">
                    {subscription.cancelAtPeriodEnd
                      ? "Subscription ends"
                      : new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md">
                  <p className="text-sm font-medium">
                    Trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Your subscription will end on{" "}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReactivate}
                    disabled={reactivating}
                  >
                    {reactivating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Reactivate"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Features */}
          {currentTier && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(currentTier.features)
                    .filter(([, enabled]) => enabled)
                    .map(([feature]) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="capitalize">
                          {feature.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => router.push("/pricing")}>
                  Change Plan
                </Button>

                {!subscription.cancelAtPeriodEnd && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Cancel Subscription</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your subscription will remain active until{" "}
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                          You can reactivate anytime before then.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {cancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Cancel Subscription"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You&apos;re currently on the Free plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/pricing")}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
