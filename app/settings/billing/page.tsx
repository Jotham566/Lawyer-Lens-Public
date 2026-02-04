"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageLoading } from "@/components/common";
import { fetchSubscription, fetchUsage, fetchInvoices } from "@/lib/api/billing";
import { formatDateOnly } from "@/lib/utils/date-formatter";

interface Subscription {
  tier: string;
  name: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pricePerUnit: number;
  quantity: number;
}

interface UsageSummary {
  tier: string;
  usage: {
    [key: string]: {
      display_name: string;
      current: number;
      limit: number | null;
      is_unlimited: boolean;
      percentage: number | null;
    };
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  dueDate: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    async function fetchBillingData() {
      try {
        const [subRes, usageRes, invoicesRes] = await Promise.all([
          fetchSubscription(),
          fetchUsage(),
          fetchInvoices(),
        ]);

        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }

        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(data);
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setRecentInvoices(data.invoices?.slice(0, 3) || []);
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBillingData();
  }, []);

  const tierLabels: Record<string, string> = {
    free: "Free",
    professional: "Professional",
    team: "Team",
    enterprise: "Enterprise",
  };

  if (loading) {
    return <PageLoading message="Loading billing information..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and billing"
      />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription details
              </CardDescription>
            </div>
            <Link href="/settings/billing/subscription">
              <Button variant="outline" size="sm">
                Manage Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {tierLabels[subscription.tier] || subscription.name}
                    </span>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${subscription.pricePerUnit}/mo • Billed {subscription.billingCycle}
                  </p>
                </div>
                {subscription.tier !== "enterprise" && subscription.tier !== "free" && (
                  <Button onClick={() => router.push("/pricing")}>
                    Upgrade
                  </Button>
                )}
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Your subscription will be cancelled on {formatDateOnly(subscription.currentPeriodEnd)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                You&apos;re currently on the Free plan
              </p>
              <Button onClick={() => router.push("/pricing")}>
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage This Month
              </CardTitle>
              <CardDescription>
                Your current usage against limits
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usage?.usage ? (
            <div className="space-y-4">
              {Object.entries(usage.usage).slice(0, 4).map(([key, item]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.display_name}</span>
                    <span className="text-muted-foreground">
                      {item.current.toLocaleString()}
                      {item.is_unlimited ? "" : ` / ${item.limit?.toLocaleString()}`}
                    </span>
                  </div>
                  {!item.is_unlimited && item.limit && (
                    <Progress
                      value={item.percentage || 0}
                      className={item.percentage && item.percentage > 80 ? "bg-yellow-100" : ""}
                    />
                  )}
                  {item.is_unlimited && (
                    <div className="text-xs text-muted-foreground">Unlimited</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No usage data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/settings/billing/invoices">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Invoices & Receipts
              </CardTitle>
              <CardDescription>
                View and download your billing history
              </CardDescription>
            </CardHeader>
            {recentInvoices.length > 0 && (
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {recentInvoices.length} recent invoice(s)
                </div>
              </CardContent>
            )}
          </Link>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/settings/billing/payment-methods">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your payment methods
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
