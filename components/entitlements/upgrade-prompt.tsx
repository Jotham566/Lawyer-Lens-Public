"use client";

import { useRouter } from "next/navigation";
import { Sparkles, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Features } from "@/hooks/use-entitlements";

const FEATURE_LABELS: Record<keyof Features, string> = {
  basicSearch: "Basic Search",
  aiChat: "AI Chat",
  citations: "Citations",
  deepResearch: "Deep Research",
  contractDrafting: "Contract Drafting",
  contractAnalysis: "Contract Analysis",
  documentUpload: "Document Upload",
  exportPdf: "PDF Export",
  exportDocx: "Word Export",
  teamManagement: "Team Management",
  roleBasedAccess: "Role-Based Access",
  sharedWorkspaces: "Shared Workspaces",
  activityLogs: "Activity Logs",
  ssoSaml: "SSO/SAML",
  customIntegrations: "Custom Integrations",
  apiAccess: "API Access",
  dedicatedSupport: "Dedicated Support",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  professional: "Professional",
  team: "Team",
  enterprise: "Enterprise",
};

interface UpgradePromptProps {
  /** The feature that requires upgrade */
  feature?: keyof Features;
  /** The usage type that hit its limit */
  usageType?: string;
  /** The usage limit that was reached */
  usageLimit?: number;
  /** User's current tier */
  currentTier: string;
  /** Required tier for the feature */
  requiredTier?: string;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Variant: inline (default) or modal */
  variant?: "inline" | "compact";
}

export function UpgradePrompt({
  feature,
  usageType,
  usageLimit,
  currentTier,
  requiredTier,
  title,
  description,
  variant = "inline",
}: UpgradePromptProps) {
  const router = useRouter();

  const featureLabel = feature ? FEATURE_LABELS[feature] : null;
  const tierLabel = requiredTier ? TIER_LABELS[requiredTier] : null;

  const defaultTitle = usageType
    ? "Usage Limit Reached"
    : featureLabel
    ? `Upgrade to access ${featureLabel}`
    : "Upgrade Required";

  const defaultDescription = usageType
    ? `You've used all ${usageLimit?.toLocaleString()} of your monthly allowance. Upgrade your plan for higher limits.`
    : featureLabel && tierLabel
    ? `${featureLabel} is available on the ${tierLabel} plan and above.`
    : "This feature requires a higher tier subscription.";

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
        <div className="p-2 bg-primary/10 rounded-full">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title || defaultTitle}</p>
          <p className="text-xs text-muted-foreground truncate">
            {description || defaultDescription}
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          {usageType ? (
            <TrendingUp className="h-6 w-6 text-primary" />
          ) : (
            <Sparkles className="h-6 w-6 text-primary" />
          )}
        </div>
        <CardTitle className="text-lg">{title || defaultTitle}</CardTitle>
        <CardDescription>{description || defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {currentTier && (
          <p className="text-sm text-muted-foreground">
            You&apos;re currently on the{" "}
            <span className="font-medium">{TIER_LABELS[currentTier] || currentTier}</span> plan
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => router.push("/pricing")}>
            <Sparkles className="h-4 w-4 mr-2" />
            View Plans
          </Button>
          {requiredTier && requiredTier !== "enterprise" && (
            <Button
              variant="outline"
              onClick={() => router.push(`/checkout?tier=${requiredTier}`)}
            >
              Upgrade to {TIER_LABELS[requiredTier]}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UpgradeBannerProps {
  /** Message to display */
  message?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

export function UpgradeBanner({
  message = "Upgrade for unlimited access and premium features",
  dismissible = false,
  onDismiss,
}: UpgradeBannerProps) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20 py-3 px-4">
      <div className="container max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/pricing")}>
            Upgrade
          </Button>
          {dismissible && onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
