"use client";

import { useEntitlements, getTierDisplayName, USAGE_TYPES } from "@/hooks/use-entitlements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Calendar,
  Crown,
  Infinity,
  MessageSquare,
  Search,
  FileText,
  Zap,
  HardDrive,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const usageConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  [USAGE_TYPES.AI_QUERY]: {
    icon: <MessageSquare className="h-5 w-5" />,
    color: "text-blue-600"
  },
  [USAGE_TYPES.DEEP_RESEARCH]: {
    icon: <Search className="h-5 w-5" />,
    color: "text-purple-600"
  },
  [USAGE_TYPES.CONTRACT_DRAFT]: {
    icon: <FileText className="h-5 w-5" />,
    color: "text-green-600"
  },
  [USAGE_TYPES.CONTRACT_ANALYSIS]: {
    icon: <FileText className="h-5 w-5" />,
    color: "text-amber-600"
  },
  [USAGE_TYPES.STORAGE_GB]: {
    icon: <HardDrive className="h-5 w-5" />,
    color: "text-slate-600"
  },
  [USAGE_TYPES.API_CALL]: {
    icon: <Zap className="h-5 w-5" />,
    color: "text-yellow-600"
  },
};

interface UsageDashboardProps {
  showHeader?: boolean;
  compact?: boolean;
}

export function UsageDashboard({ showHeader = true, compact = false }: UsageDashboardProps) {
  const { entitlements, loading } = useEntitlements();

  if (loading) {
    return <UsageDashboardSkeleton compact={compact} />;
  }

  if (!entitlements) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Unable to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  const usageEntries = Object.entries(entitlements.usage);
  const atLimitItems = usageEntries.filter(([, data]) => data.is_at_limit);
  const nearLimitItems = usageEntries.filter(
    ([, data]) => !data.is_at_limit && !data.is_unlimited && (data.percentage ?? 0) >= 80
  );

  return (
    <div className="space-y-6">
      {showHeader && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage Dashboard
                </CardTitle>
                <CardDescription>
                  Track your usage and plan limits
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-4 py-1">
                <Crown className="h-4 w-4 mr-2" />
                {getTierDisplayName(entitlements.tier)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Current period: {new Date(entitlements.period_start).toLocaleDateString()} -{" "}
                {new Date(entitlements.period_end).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {(atLimitItems.length > 0 || nearLimitItems.length > 0) && (
        <div className="space-y-3">
          {atLimitItems.map(([key, data]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-700">{data.display_name} limit reached</p>
                  <p className="text-sm text-red-600">
                    Upgrade your plan to continue using this feature
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button size="sm">Upgrade</Button>
              </Link>
            </div>
          ))}
          {nearLimitItems.map(([key, data]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-700">
                    {data.display_name} at {data.percentage}%
                  </p>
                  <p className="text-sm text-amber-600">
                    {data.remaining} remaining this period
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button size="sm" variant="outline">View Plans</Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Usage Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage This Period</CardTitle>
        </CardHeader>
        <CardContent>
          {compact ? (
            <CompactUsageGrid usageEntries={usageEntries} />
          ) : (
            <DetailedUsageList usageEntries={usageEntries} />
          )}
        </CardContent>
      </Card>

      {/* All Clear Message */}
      {atLimitItems.length === 0 && nearLimitItems.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <p className="text-sm">All usage within limits</p>
        </div>
      )}
    </div>
  );
}

function CompactUsageGrid({
  usageEntries
}: {
  usageEntries: [string, { display_name: string; current: number; limit: number | null; is_unlimited: boolean; percentage: number | null; is_at_limit: boolean; remaining: number | null }][]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {usageEntries.map(([key, data]) => {
        const config = usageConfig[key] || { icon: <Zap className="h-5 w-5" />, color: "text-slate-600" };
        const isWarning = !data.is_unlimited && (data.percentage ?? 0) >= 80;

        return (
          <div
            key={key}
            className={`p-4 rounded-lg border ${
              data.is_at_limit
                ? "border-red-200 bg-red-50"
                : isWarning
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={config.color}>{config.icon}</span>
              <span className="font-medium text-sm">{data.display_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {data.current.toLocaleString()}
                {!data.is_unlimited && ` / ${data.limit?.toLocaleString()}`}
              </span>
              {data.is_unlimited ? (
                <Badge variant="secondary" className="bg-slate-100">
                  <Infinity className="h-3 w-3 mr-1" />
                  Unlimited
                </Badge>
              ) : data.is_at_limit ? (
                <Badge variant="destructive">At Limit</Badge>
              ) : (
                <span className={isWarning ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                  {data.percentage}%
                </span>
              )}
            </div>
            {!data.is_unlimited && (
              <Progress
                value={data.percentage || 0}
                className={`mt-2 h-1.5 ${
                  data.is_at_limit
                    ? "bg-red-100"
                    : isWarning
                    ? "bg-amber-100"
                    : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailedUsageList({
  usageEntries,
}: {
  usageEntries: [string, { display_name: string; current: number; limit: number | null; is_unlimited: boolean; percentage: number | null; is_at_limit: boolean; remaining: number | null }][];
}) {
  return (
    <div className="space-y-6">
      {usageEntries.map(([key, data], index) => {
        const config = usageConfig[key] || { icon: <Zap className="h-5 w-5" />, color: "text-slate-600" };
        const isWarning = !data.is_unlimited && (data.percentage ?? 0) >= 80;

        return (
          <div key={key}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-slate-100 ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{data.display_name}</h4>
                  {data.is_unlimited ? (
                    <Badge variant="secondary" className="bg-slate-100">
                      <Infinity className="h-3 w-3 mr-1" />
                      Unlimited
                    </Badge>
                  ) : data.is_at_limit ? (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Limit Reached
                    </Badge>
                  ) : isWarning ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      {data.remaining} remaining
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {data.remaining} remaining
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>
                    {data.current.toLocaleString()} used
                    {!data.is_unlimited && ` of ${data.limit?.toLocaleString()}`}
                  </span>
                  {!data.is_unlimited && (
                    <span className={data.is_at_limit ? "text-red-600" : isWarning ? "text-amber-600" : ""}>
                      {data.percentage}%
                    </span>
                  )}
                </div>
                {!data.is_unlimited && (
                  <Progress
                    value={data.percentage || 0}
                    className={`h-2 ${
                      data.is_at_limit
                        ? "bg-red-100"
                        : isWarning
                        ? "bg-amber-100"
                        : ""
                    }`}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsageDashboardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-72" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          {compact ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Stats Component for sidebar or compact views
export function UsageQuickStats() {
  const { entitlements, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!entitlements) return null;

  const criticalItems = Object.entries(entitlements.usage)
    .filter(([, data]) => !data.is_unlimited)
    .sort((a, b) => (b[1].percentage ?? 0) - (a[1].percentage ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Current Plan</span>
        <Badge variant="outline">{getTierDisplayName(entitlements.tier)}</Badge>
      </div>
      <Separator />
      {criticalItems.map(([key, data]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{data.display_name}</span>
            <span className={data.is_at_limit ? "text-red-600 font-medium" : ""}>
              {data.current}/{data.limit}
            </span>
          </div>
          <Progress value={data.percentage || 0} className="h-1" />
        </div>
      ))}
      <Link href="/settings/billing">
        <Button variant="ghost" size="sm" className="w-full mt-2">
          View All Usage
        </Button>
      </Link>
    </div>
  );
}

// Team Usage Component for team plans
export function TeamUsageOverview() {
  const { entitlements, loading } = useEntitlements();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entitlements || !["team", "enterprise"].includes(entitlements.tier)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Usage
        </CardTitle>
        <CardDescription>
          Combined usage across all team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(entitlements.usage).slice(0, 4).map(([key, data]) => {
            const config = usageConfig[key] || { icon: <Zap className="h-4 w-4" />, color: "text-slate-600" };
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={config.color}>{config.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{data.display_name}</span>
                    <span className="text-muted-foreground">
                      {data.is_unlimited ? (
                        <span className="flex items-center gap-1">
                          <Infinity className="h-3 w-3" /> Unlimited
                        </span>
                      ) : (
                        `${data.current} / ${data.limit}`
                      )}
                    </span>
                  </div>
                  {!data.is_unlimited && (
                    <Progress value={data.percentage || 0} className="h-1.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
