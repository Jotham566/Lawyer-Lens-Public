"use client";

import { useState } from "react";
import { useEntitlements, USAGE_TYPES } from "@/hooks/use-entitlements";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  CheckCircle,
  Infinity,
  TrendingUp,
  MessageSquare,
  Search,
  FileText,
  Zap,
  HardDrive,
} from "lucide-react";
import Link from "next/link";

const usageIcons: Record<string, React.ReactNode> = {
  [USAGE_TYPES.AI_QUERY]: <MessageSquare className="h-4 w-4" />,
  [USAGE_TYPES.DEEP_RESEARCH]: <Search className="h-4 w-4" />,
  [USAGE_TYPES.CONTRACT_DRAFT]: <FileText className="h-4 w-4" />,
  [USAGE_TYPES.CONTRACT_ANALYSIS]: <FileText className="h-4 w-4" />,
  [USAGE_TYPES.STORAGE_GB]: <HardDrive className="h-4 w-4" />,
  [USAGE_TYPES.API_CALL]: <Zap className="h-4 w-4" />,
};

interface UsageIndicatorProps {
  usageKey: string;
  showLabel?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

/**
 * Displays usage information for a specific usage type.
 */
export function UsageIndicator({
  usageKey,
  showLabel = true,
  showProgress = true,
  compact = false,
}: UsageIndicatorProps) {
  const { getUsage, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-muted/50"></div>
      </div>
    );
  }

  const usage = getUsage(usageKey);
  if (!usage) return null;

  const getStatusColor = (percentage: number | null, isAtLimit: boolean) => {
    if (isAtLimit) return "text-destructive";
    if (percentage !== null && percentage >= 80) return "text-primary";
    return "text-muted-foreground";
  };

  const getProgressColor = (percentage: number | null, isAtLimit: boolean) => {
    if (isAtLimit) return "bg-destructive/10";
    if (percentage !== null && percentage >= 80) return "bg-accent/20";
    return "";
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {usageIcons[usageKey]}
              <span className={`text-sm font-medium ${getStatusColor(usage.percentage, usage.is_at_limit)}`}>
                {usage.is_unlimited ? (
                  <Infinity className="h-4 w-4 inline" />
                ) : (
                  `${usage.current}/${usage.limit}`
                )}
              </span>
              {usage.is_at_limit && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{usage.display_name}</p>
            {!usage.is_unlimited && (
              <p className="text-xs text-muted-foreground">{usage.remaining} remaining this period</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            {usageIcons[usageKey]}
            {usage.display_name}
          </span>
          <span className={`text-sm ${getStatusColor(usage.percentage, usage.is_at_limit)}`}>
            {usage.is_unlimited ? (
              <span className="flex items-center gap-1">
                <Infinity className="h-4 w-4" />
                Unlimited
              </span>
            ) : (
              `${usage.current} / ${usage.limit}`
            )}
          </span>
        </div>
      )}
      {showProgress && !usage.is_unlimited && (
        <Progress
          value={usage.percentage || 0}
          className={getProgressColor(usage.percentage, usage.is_at_limit)}
        />
      )}
      {usage.is_at_limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Limit reached
          </p>
          <Link href="/pricing">
            <Button size="sm" variant="link" className="text-xs p-0 h-auto">
              Upgrade for more
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

interface UsageSummaryProps {
  showAll?: boolean;
  maxItems?: number;
}

/**
 * Displays a summary of all usage types or ones near limits.
 */
export function UsageSummary({ showAll = false, maxItems = 4 }: UsageSummaryProps) {
  const { entitlements, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded bg-muted/50"></div>
        ))}
      </div>
    );
  }

  if (!entitlements) return null;

  let usageItems = Object.entries(entitlements.usage);

  if (!showAll) {
    // Sort by percentage (highest first) and filter to near-limit items
    usageItems = usageItems
      .filter(([, data]) => !data.is_unlimited && (data.percentage ?? 0) > 50)
      .sort((a, b) => (b[1].percentage ?? 0) - (a[1].percentage ?? 0));
  }

  usageItems = usageItems.slice(0, maxItems);

  if (usageItems.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        <CheckCircle className="mx-auto mb-2 h-5 w-5 text-primary" />
        All usage within limits
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {usageItems.map(([key]) => (
        <UsageIndicator key={key} usageKey={key} />
      ))}
    </div>
  );
}

interface UsageLimitWarningProps {
  usageKey: string;
  threshold?: number;
}

/**
 * Shows a warning banner when usage is near or at limit.
 */
export function UsageLimitWarning({ usageKey, threshold = 80 }: UsageLimitWarningProps) {
  const { getUsage, isAtLimit } = useEntitlements();

  const usage = getUsage(usageKey);
  if (!usage || usage.is_unlimited) return null;

  const percentage = usage.percentage ?? 0;
  if (percentage < threshold && !isAtLimit(usageKey)) return null;

  const isAtLimitNow = isAtLimit(usageKey);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isAtLimitNow
          ? "border border-destructive/20 bg-destructive/10"
          : "border border-border/30 bg-accent/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle
          className={`h-5 w-5 ${isAtLimitNow ? "text-destructive" : "text-primary"}`}
        />
        <div>
          <p className={`text-sm font-medium ${isAtLimitNow ? "text-destructive" : "text-primary"}`}>
            {isAtLimitNow
              ? `${usage.display_name} limit reached`
              : `${usage.display_name} at ${percentage}%`}
          </p>
          <p className={`text-xs ${isAtLimitNow ? "text-destructive/80" : "text-muted-foreground"}`}>
            {isAtLimitNow
              ? "Upgrade to continue using this feature"
              : `${usage.remaining} remaining this period`}
          </p>
        </div>
      </div>
      <Link href="/pricing">
        <Button size="sm" variant={isAtLimitNow ? "default" : "outline"}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Upgrade
        </Button>
      </Link>
    </div>
  );
}

/**
 * Global usage alert banner that monitors all usage types.
 * Shows a dismissible banner when any usage type is at 80%+ or at limit.
 * Hides during both initial loading and background refresh to prevent flash.
 */
export function GlobalUsageAlert() {
  const { entitlements, loading, isRefreshing, hasInitialized } = useEntitlements();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // CRITICAL: Only render after the entitlements system has fully initialized.
  // This prevents the banner from flashing during:
  // - Initial page load
  // - Page refresh when logged in
  // - Auth state transitions
  // The hasInitialized flag is set by the entitlements hook only after
  // the first successful data fetch completes AND a brief stabilization delay.
  if (!hasInitialized || loading || isRefreshing || !entitlements) {
    return null;
  }

  // Find usage items that are at 80%+ and not dismissed
  const warningItems = Object.entries(entitlements.usage)
    .filter(([key, usage]) => {
      if (usage.is_unlimited) return false;
      if (dismissed.includes(key)) return false;
      return (usage.percentage ?? 0) >= 80;
    })
    .sort((a, b) => (b[1].percentage ?? 0) - (a[1].percentage ?? 0));

  if (warningItems.length === 0) return null;

  const [topKey, topUsage] = warningItems[0];
  const isAtLimit = topUsage.is_at_limit;

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-sm ${
        isAtLimit
          ? "border-b border-destructive/20 bg-destructive/10"
          : "border-b border-border/30 bg-accent/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle
          className={`h-4 w-4 ${isAtLimit ? "text-destructive" : "text-primary"}`}
        />
        <span className={isAtLimit ? "text-destructive" : "text-primary"}>
          {isAtLimit
            ? `${topUsage.display_name} limit reached`
            : `${topUsage.display_name} at ${topUsage.percentage}% — ${topUsage.remaining} remaining`}
          {warningItems.length > 1 && ` (+${warningItems.length - 1} more)`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/pricing">
          <Button size="sm" variant={isAtLimit ? "default" : "outline"} className="h-7 text-xs">
            Upgrade
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setDismissed([...dismissed, topKey])}
        >
          <span className="sr-only">Dismiss</span>
          ×
        </Button>
      </div>
    </div>
  );
}

interface UsageBadgeProps {
  usageKey: string;
}

/**
 * Small badge showing usage status, useful for inline display.
 */
export function UsageBadge({ usageKey }: UsageBadgeProps) {
  const { getUsage } = useEntitlements();

  const usage = getUsage(usageKey);
  if (!usage) return null;

  if (usage.is_unlimited) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        <Infinity className="h-3 w-3 mr-1" />
        Unlimited
      </Badge>
    );
  }

  if (usage.is_at_limit) {
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        At Limit
      </Badge>
    );
  }

  if ((usage.percentage ?? 0) >= 80) {
    return (
      <Badge variant="secondary" className="bg-accent/20 text-primary">
        {usage.remaining} left
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary">
      {usage.remaining} left
    </Badge>
  );
}
