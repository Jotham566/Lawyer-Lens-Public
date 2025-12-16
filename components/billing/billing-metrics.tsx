"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  TrendingUp,
  Users,
  UserX,
} from "lucide-react";

interface BillingMetrics {
  mrr: number;
  arr: number;
  total_revenue_mtd: number;
  total_customers: number;
  paying_customers: number;
  free_tier_customers: number;
  trial_customers: number;
  churned_customers_mtd: number;
  new_customers_mtd: number;
  average_revenue_per_customer: number;
  churn_rate: number;
  tier_breakdown: Record<string, number>;
}

interface BillingMetricsProps {
  metrics: BillingMetrics | null;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: "up" | "down" | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend === "up" && (
            <ArrowUp className="h-4 w-4 text-green-500" />
          )}
          {trend === "down" && (
            <ArrowDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  );
}

export function BillingMetricsGrid({ metrics, isLoading }: BillingMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load billing metrics
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Monthly Recurring Revenue"
        value={formatCurrency(metrics.mrr)}
        icon={DollarSign}
        description="Current MRR"
      />
      <MetricCard
        title="Annual Recurring Revenue"
        value={formatCurrency(metrics.arr)}
        icon={TrendingUp}
        description="Projected ARR"
      />
      <MetricCard
        title="Revenue MTD"
        value={formatCurrency(metrics.total_revenue_mtd)}
        icon={DollarSign}
        description="Month to date"
      />
      <MetricCard
        title="Avg Revenue per Customer"
        value={formatCurrency(metrics.average_revenue_per_customer)}
        icon={DollarSign}
        description="ARPC"
      />
      <MetricCard
        title="Total Customers"
        value={metrics.total_customers.toString()}
        icon={Users}
        description={`${metrics.paying_customers} paying, ${metrics.free_tier_customers} free`}
      />
      <MetricCard
        title="Trial Customers"
        value={metrics.trial_customers.toString()}
        icon={Users}
        description="Active trials"
      />
      <MetricCard
        title="New Customers MTD"
        value={metrics.new_customers_mtd.toString()}
        icon={Users}
        description="This month"
        trend="up"
      />
      <MetricCard
        title="Churn Rate"
        value={formatPercent(metrics.churn_rate)}
        icon={UserX}
        description={`${metrics.churned_customers_mtd} churned this month`}
        trend={metrics.churn_rate > 5 ? "down" : null}
      />
    </div>
  );
}

export function TierBreakdown({
  metrics,
  isLoading,
}: BillingMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tier Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const tiers = [
    { key: "free", label: "Free", color: "bg-gray-500" },
    { key: "professional", label: "Professional", color: "bg-blue-500" },
    { key: "team", label: "Team", color: "bg-purple-500" },
    { key: "enterprise", label: "Enterprise", color: "bg-amber-500" },
  ];

  const total = Object.values(metrics.tier_breakdown).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tier Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const count = metrics.tier_breakdown[tier.key] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={tier.key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{tier.label}</span>
                  <span className="text-muted-foreground">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${tier.color} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
