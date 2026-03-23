"use client";

import { ReactNode } from "react";
import { useEntitlements, SubscriptionTier, getTierDisplayName } from "@/hooks/use-entitlements";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

interface FeatureGateProps {
  /** The feature key to check */
  feature: string;
  /** Content to render if user has access */
  children: ReactNode;
  /** Optional fallback content if user doesn't have access */
  fallback?: ReactNode;
  /** Minimum tier required for this feature */
  requiredTier?: SubscriptionTier;
  /** Feature display name for the upgrade prompt */
  featureName?: string;
}

/**
 * FeatureGate component that conditionally renders content based on user's subscription tier.
 * If the user doesn't have access, shows an upgrade prompt.
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  requiredTier = "professional",
  featureName,
}: FeatureGateProps) {
  const { hasFeature, entitlements, loading } = useEntitlements();

  // Show loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 rounded-xl bg-muted/40"></div>
      </div>
    );
  }

  // User has access to the feature
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <UpgradePrompt
      featureName={featureName || feature}
      requiredTier={requiredTier}
      currentTier={entitlements?.tier || "free"}
    />
  );
}

interface UpgradePromptProps {
  featureName: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  className?: string;
}

/**
 * UpgradePrompt component shown when a user tries to access a premium feature.
 */
export function UpgradePrompt({
  featureName,
  requiredTier,
  currentTier,
  className = "",
}: UpgradePromptProps) {
  return (
    <Card className={`border-dashed border border-border/40 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upgrade to Access {featureName}</h3>
        <p className="mb-6 max-w-md text-center text-muted-foreground">
          This feature requires the {getTierDisplayName(requiredTier)} plan or higher.
          You&apos;re currently on the {getTierDisplayName(currentTier)} plan.
        </p>
        <Link href="/pricing">
          <Button className="gap-2">
            <Crown className="h-4 w-4" />
            View Upgrade Options
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface PremiumBadgeProps {
  tier?: SubscriptionTier;
  size?: "sm" | "md" | "lg";
}

/**
 * Badge indicating a premium feature
 */
export function PremiumBadge({ tier = "professional", size = "sm" }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-accent/20 font-medium text-primary ${sizeClasses[size]}`}
    >
      <Sparkles className={iconSizes[size]} />
      {getTierDisplayName(tier)}
    </span>
  );
}

interface FeatureLockedOverlayProps {
  children: ReactNode;
  feature: string;
  requiredTier?: SubscriptionTier;
  featureName?: string;
}

/**
 * Wraps content with a locked overlay if user doesn't have access.
 * Content is still visible but blurred/disabled.
 */
export function FeatureLockedOverlay({
  children,
  feature,
  requiredTier = "professional",
  featureName,
}: FeatureLockedOverlayProps) {
  const { hasFeature } = useEntitlements();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
        <Lock className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-2 text-sm font-medium text-foreground">
          {featureName || feature} requires {getTierDisplayName(requiredTier)}
        </p>
        <Link href="/pricing">
          <Button size="sm" variant="outline">
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  );
}
