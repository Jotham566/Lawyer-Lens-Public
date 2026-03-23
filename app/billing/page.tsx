"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Building2,
  Users,
  BarChart3,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Zap,
  FileText,
  MessageSquare,
  Search,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { fetchSubscription, fetchUsage } from "@/lib/api/billing";
import { getSubscriptionTierTheme, surfaceClasses } from "@/lib/design-system";
import { useAuth, useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import { formatDateOnly } from "@/lib/utils/date-formatter";

interface UsageData {
  tier: string;
  period_start: string;
  period_end: string;
  usage: {
    [key: string]: {
      display_name: string;
      current: number;
      limit: number | null;
      is_unlimited: boolean;
      remaining: number | null;
      percentage: number | null;
      is_at_limit: boolean;
    };
  };
}

interface SubscriptionData {
  id: string;
  tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  seats_used: number;
  seats_total: number;
}

const tierIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-4 w-4" />,
  professional: <Crown className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  enterprise: <Building2 className="h-4 w-4" />,
};

const usageIcons: Record<string, React.ReactNode> = {
  ai_query: <MessageSquare className="h-5 w-5" />,
  deep_research: <Search className="h-5 w-5" />,
  contract_draft: <FileText className="h-5 w-5" />,
  contract_analysis: <FileText className="h-5 w-5" />,
  storage_gb: <BarChart3 className="h-5 w-5" />,
  api_call: <Zap className="h-5 w-5" />,
};

export default function BillingPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillingData() {
      try {
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }
        setLoading(true);

        // Fetch usage data (with auth)
        const usageRes = await fetchUsage();
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUsage(usageData);
        }

        // Fetch subscription data (with auth)
        const subRes = await fetchSubscription();
        if (subRes.ok) {
          const subData = await subRes.json();
          const normalized = subData?.subscription || subData;
          if (normalized?.tier) {
            setSubscription(normalized);
          } else {
            setSubscription(null);
          }
        }
      } catch (err) {
        setError("Failed to load billing information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBillingData();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return <PageLoading message="Redirecting to login..." />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-36 rounded-panel bg-muted"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-panel bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className={`mb-8 ${surfaceClasses.pageHero}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={surfaceClasses.pageEyebrow}>
              Billing
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] text-foreground">
              Billing & Usage
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Manage your subscription, view usage, and update payment methods
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/60 bg-surface-container-high px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-secondary-foreground/80">
              Subscription controls
            </Badge>
            <Link href="/pricing">
              <Button variant="outline" className="gap-2">
                <Crown className="h-4 w-4" />
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto rounded-2xl border border-border/60 bg-surface-container p-1 shadow-soft">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Subscription Card */}
          <Card className="border-border/60 bg-surface-container shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </div>
                {subscription?.tier && (
                  <Badge className={getSubscriptionTierTheme(subscription.tier)}>
                    <span className="flex items-center gap-1">
                      {tierIcons[subscription.tier] || tierIcons.free}
                      {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                    </span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-surface-container-high p-4">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium flex items-center gap-1">
                        {subscription.status === "active" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Active
                          </>
                        ) : (
                          subscription.status
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-high p-4">
                      <p className="text-sm text-muted-foreground">Billing Period</p>
                      <p className="font-medium">
                        {formatDateOnly(subscription.current_period_start)} - {formatDateOnly(subscription.current_period_end)}
                      </p>
                    </div>
                    {subscription.tier === "team" && (
                      <div className="rounded-2xl bg-surface-container-high p-4">
                        <p className="text-sm text-muted-foreground">Team Seats</p>
                        <p className="font-medium">
                          {subscription.seats_used} / {subscription.seats_total} used
                        </p>
                      </div>
                    )}
                    {subscription.cancel_at_period_end && (
                      <div className="rounded-2xl bg-surface-container-high p-4 md:col-span-2">
                        <Badge variant="destructive">Cancels at period end</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 border-t border-border/60 pt-4">
                    <Link href="/pricing">
                      <Button>
                        {subscription.tier === "free" ? "Upgrade Plan" : "Change Plan"}
                      </Button>
                    </Link>
                    {subscription.tier !== "free" && (
                      <Button variant="outline">Manage Subscription</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You&apos;re currently on the Free plan</p>
                  <Link href="/pricing">
                    <Button>Upgrade Now</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Usage Summary */}
          {usage && (
            <Card className="border-border/60 bg-surface-container shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage This Period
                </CardTitle>
                <CardDescription>
                  {formatDateOnly(usage.period_start)} - {formatDateOnly(usage.period_end)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(usage.usage).map(([key, data]) => (
                    <div key={key} className="space-y-2 rounded-2xl bg-surface-container-high p-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {usageIcons[key]}
                          {data.display_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.is_unlimited ? (
                            "Unlimited"
                          ) : (
                            `${data.current} / ${data.limit}`
                          )}
                        </span>
                      </div>
                      {!data.is_unlimited && (
                        <Progress
                          value={data.percentage || 0}
                          className={data.is_at_limit ? "bg-destructive/10" : ""}
                        />
                      )}
                      {data.is_at_limit && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Limit reached
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage">
          <Card className="border-border/60 bg-surface-container shadow-soft">
            <CardHeader>
              <CardTitle>Detailed Usage</CardTitle>
              <CardDescription>View your usage history and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Detailed usage analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="border-border/60 bg-surface-container shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>View and download past invoices</CardDescription>
                </div>
                <Link href="/billing/invoices">
                  <Button variant="outline" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No invoices yet. Your invoices will appear here after your first payment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="border-border/60 bg-surface-container shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your payment methods</CardDescription>
                </div>
                <Link href="/billing/payment-methods">
                  <Button variant="outline" size="sm">
                    Manage <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground text-center py-4">
                  No payment methods added yet
                </p>
                <div className="flex justify-center">
                  <Link href="/billing/payment-methods">
                    <Button>Add Payment Method</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
