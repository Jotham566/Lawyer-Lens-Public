"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingTier {
  tier: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  isPerSeat: boolean;
  minSeats: number;
  trialDays: number;
  limits: {
    monthlyAiQueries: number | null;
    storageGb: number | null;
    maxMembers: number | null;
    monthlyDeepResearch: number | null;
    monthlyContractDrafts: number | null;
    monthlyContractAnalyses: number | null;
    chatHistoryDays: number | null;
    monthlyApiCalls: number | null;
  };
  features: {
    basicSearch: boolean;
    aiChat: boolean;
    citations: boolean;
    deepResearch: boolean;
    contractDrafting: boolean;
    contractAnalysis: boolean;
    documentUpload: boolean;
    exportPdf: boolean;
    exportDocx: boolean;
    teamManagement: boolean;
    roleBasedAccess: boolean;
    sharedWorkspaces: boolean;
    activityLogs: boolean;
    ssoSaml: boolean;
    customIntegrations: boolean;
    apiAccess: boolean;
    dedicatedSupport: boolean;
  };
}

interface PricingTierCardProps {
  tier: PricingTier;
  billingCycle: "monthly" | "annual";
  isPopular?: boolean;
  currentTier?: string;
  onSelect: (tier: string) => void;
}

const FEATURE_LABELS: Record<string, string> = {
  basicSearch: "Basic legal search",
  aiChat: "AI-powered chat",
  citations: "Case citations",
  deepResearch: "Deep research mode",
  contractDrafting: "Contract drafting",
  contractAnalysis: "Contract analysis",
  documentUpload: "Document uploads",
  exportPdf: "PDF export",
  exportDocx: "Word export",
  teamManagement: "Team management",
  roleBasedAccess: "Role-based access",
  sharedWorkspaces: "Shared workspaces",
  activityLogs: "Activity logs",
  ssoSaml: "SSO/SAML",
  customIntegrations: "Custom integrations",
  apiAccess: "API access",
  dedicatedSupport: "Dedicated support",
};

export function PricingTierCard({
  tier,
  billingCycle,
  isPopular,
  currentTier,
  onSelect,
}: PricingTierCardProps) {
  const price = billingCycle === "monthly" ? tier.monthlyPrice : tier.annualPrice;
  const isEnterprise = tier.tier === "enterprise";
  const isFree = tier.tier === "free";
  const isCurrent = currentTier === tier.tier;

  const enabledFeatures = Object.entries(tier.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => FEATURE_LABELS[key] || key);

  const annualSavings = tier.monthlyPrice > 0
    ? Math.round(((tier.monthlyPrice - tier.annualPrice) / tier.monthlyPrice) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-primary shadow-lg scale-105",
        isCurrent && "ring-2 ring-primary"
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      {isCurrent && (
        <Badge variant="secondary" className="absolute -top-3 right-4">
          Current Plan
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          {isEnterprise ? (
            <div className="text-3xl font-bold">Custom</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">${price}</span>
                <span className="text-muted-foreground">
                  /{tier.isPerSeat ? "user/" : ""}mo
                </span>
              </div>
              {billingCycle === "annual" && annualSavings > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Save {annualSavings}% with annual billing
                </p>
              )}
              {tier.isPerSeat && (
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum {tier.minSeats} seats
                </p>
              )}
              {tier.trialDays > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {tier.trialDays}-day free trial
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Includes:</div>
          <ul className="space-y-2">
            {/* Limits */}
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>
                {tier.limits.monthlyAiQueries === null
                  ? "Unlimited AI queries"
                  : `${tier.limits.monthlyAiQueries} AI queries/month`}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>
                {tier.limits.storageGb === null
                  ? "Unlimited storage"
                  : `${tier.limits.storageGb} GB storage`}
              </span>
            </li>
            {tier.limits.monthlyDeepResearch !== null && tier.limits.monthlyDeepResearch > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{tier.limits.monthlyDeepResearch} deep research sessions/month</span>
              </li>
            )}
            {tier.limits.monthlyDeepResearch === null && (
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Unlimited deep research</span>
              </li>
            )}

            {/* Key Features */}
            {enabledFeatures.slice(0, 6).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
            {enabledFeatures.length > 6 && (
              <li className="text-sm text-muted-foreground pl-6">
                +{enabledFeatures.length - 6} more features
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          disabled={isCurrent}
          onClick={() => onSelect(tier.tier)}
        >
          {isCurrent
            ? "Current Plan"
            : isEnterprise
            ? "Contact Sales"
            : isFree
            ? "Get Started"
            : "Start Free Trial"}
        </Button>
      </CardFooter>
    </Card>
  );
}
