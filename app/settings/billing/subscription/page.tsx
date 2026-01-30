"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  ArrowDown,
  ArrowUp,
  X,
  MessageSquare,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SeatManagement } from "@/components/billing/seat-management";
import {
  fetchSubscription,
  fetchPricing,
  updateSubscription,
  cancelSubscription,
} from "@/lib/api/billing";

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
  // Seat management fields
  seatsUsed?: number;
  seatsTotal?: number;
  pricePerSeat?: number;
}

interface PricingTier {
  tier: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Record<string, boolean>;
}

// Tier order for upgrade/downgrade detection
const TIER_ORDER: Record<string, number> = {
  free: 0,
  professional: 1,
  team: 2,
  enterprise: 3,
};

// Downgrade reasons for feedback
const DOWNGRADE_REASONS = [
  { id: "too_expensive", label: "Too expensive for my needs" },
  { id: "missing_features", label: "Missing features I need" },
  { id: "not_using_enough", label: "Not using it enough" },
  { id: "switching_product", label: "Switching to another product" },
  { id: "temporary", label: "Temporary - will upgrade again later" },
  { id: "other", label: "Other reason" },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  // Downgrade/Change plan state
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [downgradeReason, setDowngradeReason] = useState("");
  const [downgradeFeedback, setDowngradeFeedback] = useState("");
  const [changingPlan, setChangingPlan] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, tiersRes] = await Promise.all([
          fetchSubscription(),
          fetchPricing(),
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
      const response = await cancelSubscription();

      if (response.ok) {
        // Refresh subscription data
        const subRes = await fetchSubscription();
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
      const response = await updateSubscription({ cancel_at_period_end: false });

      if (response.ok) {
        const subRes = await fetchSubscription();
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

  // Check if tier change is upgrade or downgrade
  const isDowngrade = (newTier: string): boolean => {
    if (!subscription) return false;
    const currentOrder = TIER_ORDER[subscription.tier] ?? 0;
    const newOrder = TIER_ORDER[newTier] ?? 0;
    return newOrder < currentOrder;
  };

  // Handle tier selection
  const handleTierSelect = (tier: PricingTier) => {
    setSelectedTier(tier);
    setChangeError(null);

    if (isDowngrade(tier.tier)) {
      // Show downgrade confirmation
      setShowPlanDialog(false);
      setShowDowngradeConfirm(true);
    } else {
      // Upgrade - redirect to checkout
      router.push(`/billing/checkout?plan=${tier.tier}&annual=false`);
    }
  };

  // Get features that will be lost on downgrade
  const getLostFeatures = (newTier: PricingTier): string[] => {
    if (!currentTier) return [];

    const lostFeatures: string[] = [];
    for (const [feature, enabled] of Object.entries(currentTier.features)) {
      if (enabled && !newTier.features[feature]) {
        lostFeatures.push(feature);
      }
    }
    return lostFeatures;
  };

  // Handle downgrade confirmation
  const handleDowngradeConfirm = async () => {
    if (!selectedTier || !downgradeReason) return;

    setChangingPlan(true);
    setChangeError(null);

    try {
      const response = await updateSubscription({
        new_tier: selectedTier.tier,
        downgrade_reason: downgradeReason,
        downgrade_feedback: downgradeFeedback || undefined,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to change plan");
      }

      // Refresh subscription data
      const subRes = await fetchSubscription();
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
      }

      // Reset and close dialogs
      setShowDowngradeConfirm(false);
      setSelectedTier(null);
      setDowngradeReason("");
      setDowngradeFeedback("");
    } catch (error) {
      setChangeError(error instanceof Error ? error.message : "Failed to change plan");
    } finally {
      setChangingPlan(false);
    }
  };

  const currentTier = tiers.find((t) => t.tier === subscription?.tier);
  const availableTiers = tiers.filter((t) => t.tier !== subscription?.tier && t.tier !== "enterprise");

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

          {/* Seat Management for Team/Enterprise Plans */}
          {subscription && (subscription.tier === "team" || subscription.tier === "enterprise") && (
            <SeatManagement
              seatInfo={{
                used: subscription.seatsUsed || subscription.quantity || 1,
                total: subscription.seatsTotal || subscription.quantity || 1,
                pricePerSeat: subscription.pricePerSeat || subscription.pricePerUnit || 29,
                billingCycle: subscription.billingCycle === "annual" ? "annual" : "monthly",
                canModify: !subscription.cancelAtPeriodEnd && subscription.status === "active",
              }}
              onUpdateSeats={async (newTotal, proratedAmount) => {
                const response = await updateSubscription({
                  seats: newTotal,
                  prorated_amount: proratedAmount,
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.detail || "Failed to update seats");
                }

                // Refresh subscription data
                const subRes = await fetchSubscription();
                if (subRes.ok) {
                  const data = await subRes.json();
                  setSubscription(data.subscription);
                }
              }}
            />
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setShowPlanDialog(true)}>
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

          {/* Plan Selection Dialog */}
          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogContent className="sm:max-w-lg" aria-describedby="plan-dialog-description">
              <DialogHeader>
                <DialogTitle>Change Your Plan</DialogTitle>
                <DialogDescription id="plan-dialog-description">
                  Select a new plan. Changes take effect at the end of your current billing period.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4" role="listbox" aria-label="Available plans">
                {availableTiers.map((tier) => {
                  const isDowngradeTier = isDowngrade(tier.tier);
                  return (
                    <div
                      key={tier.tier}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleTierSelect(tier)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleTierSelect(tier);
                        }
                      }}
                      role="option"
                      tabIndex={0}
                      aria-selected={false}
                      aria-label={`${tier.name} plan, ${tier.monthlyPrice} dollars per month, ${isDowngradeTier ? "downgrade" : "upgrade"}`}
                    >
                      <div className="flex items-center gap-3">
                        {isDowngradeTier ? (
                          <ArrowDown className="h-5 w-5 text-orange-500" aria-hidden="true" />
                        ) : (
                          <ArrowUp className="h-5 w-5 text-green-500" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-medium">{tier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${tier.monthlyPrice}/month
                          </p>
                        </div>
                      </div>
                      <Badge variant={isDowngradeTier ? "secondary" : "default"}>
                        {isDowngradeTier ? "Downgrade" : "Upgrade"}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Downgrade Confirmation Dialog */}
          <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
            <DialogContent className="sm:max-w-lg" aria-describedby="downgrade-dialog-description">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" aria-hidden="true" />
                  Confirm Downgrade
                </DialogTitle>
                <DialogDescription id="downgrade-dialog-description">
                  You&apos;re about to downgrade to the {selectedTier?.name} plan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Features you'll lose */}
                {selectedTier && getLostFeatures(selectedTier).length > 0 && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900" role="alert" aria-labelledby="lost-features-heading">
                    <h4 id="lost-features-heading" className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                      Features you&apos;ll lose:
                    </h4>
                    <ul className="space-y-1" role="list">
                      {getLostFeatures(selectedTier).map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span className="capitalize">
                            {feature.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price difference */}
                {selectedTier && currentTier && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">New monthly price:</span>
                    <span className="font-semibold">
                      ${selectedTier.monthlyPrice}/month
                      <span className="text-sm text-green-600 ml-2">
                        (Save ${currentTier.monthlyPrice - selectedTier.monthlyPrice}/month)
                      </span>
                    </span>
                  </div>
                )}

                <Separator />

                {/* Feedback section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Help us improve</Label>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reason">Why are you downgrading? *</Label>
                    <RadioGroup value={downgradeReason} onValueChange={setDowngradeReason}>
                      {DOWNGRADE_REASONS.map((reason) => (
                        <div key={reason.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={reason.id} id={reason.id} />
                          <Label htmlFor={reason.id} className="font-normal cursor-pointer">
                            {reason.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Additional feedback (optional)</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Tell us more about your experience..."
                      value={downgradeFeedback}
                      onChange={(e) => setDowngradeFeedback(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {changeError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2" role="alert" aria-live="polite">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    {changeError}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDowngradeConfirm(false);
                    setSelectedTier(null);
                    setDowngradeReason("");
                    setDowngradeFeedback("");
                  }}
                >
                  Keep Current Plan
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDowngradeConfirm}
                  disabled={changingPlan || !downgradeReason}
                >
                  {changingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Downgrade"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
