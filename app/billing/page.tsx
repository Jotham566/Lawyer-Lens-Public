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

const tierColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-800",
  professional: "bg-blue-100 text-blue-800",
  team: "bg-purple-100 text-purple-800",
  enterprise: "bg-amber-100 text-amber-800",
};

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
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillingData() {
      try {
        setLoading(true);

        // Fetch usage data
        const usageRes = await fetch("/api/billing/usage");
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUsage(usageData);
        }

        // Fetch subscription data
        const subRes = await fetch("/api/billing/subscription");
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData);
        }
      } catch (err) {
        setError("Failed to load billing information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBillingData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Billing & Usage</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your subscription, view usage, and update payment methods
          </p>
        </div>
        <Link href="/billing/plans">
          <Button variant="outline" className="gap-2">
            <Crown className="h-4 w-4" />
            View Plans
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </div>
                {subscription && (
                  <Badge className={tierColors[subscription.tier] || tierColors.free}>
                    <span className="flex items-center gap-1">
                      {tierIcons[subscription.tier]}
                      {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                    </span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <p className="font-medium flex items-center gap-1">
                        {subscription.status === "active" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Active
                          </>
                        ) : (
                          subscription.status
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Billing Period</p>
                      <p className="font-medium">
                        {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                    {subscription.tier === "team" && (
                      <div>
                        <p className="text-sm text-slate-500">Team Seats</p>
                        <p className="font-medium">
                          {subscription.seats_used} / {subscription.seats_total} used
                        </p>
                      </div>
                    )}
                    {subscription.cancel_at_period_end && (
                      <div className="col-span-2">
                        <Badge variant="destructive">Cancels at period end</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Link href="/billing/plans">
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
                  <p className="text-slate-500 mb-4">You&apos;re currently on the Free plan</p>
                  <Link href="/billing/plans">
                    <Button>Upgrade Now</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Usage Summary */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage This Period
                </CardTitle>
                <CardDescription>
                  {formatDate(usage.period_start)} - {formatDate(usage.period_end)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(usage.usage).map(([key, data]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {usageIcons[key]}
                          {data.display_name}
                        </span>
                        <span className="text-sm text-slate-500">
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
                          className={data.is_at_limit ? "bg-red-100" : ""}
                        />
                      )}
                      {data.is_at_limit && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
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
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage</CardTitle>
              <CardDescription>View your usage history and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-center py-8">
                Detailed usage analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
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
              <p className="text-slate-500 text-center py-8">
                No invoices yet. Your invoices will appear here after your first payment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
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
                <p className="text-slate-500 text-center py-4">
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
