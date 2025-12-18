"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Lock, Sparkles, ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getFeatureDisplayName,
  getTierDisplayName,
  type FeatureGatingDetails,
} from "@/lib/api/client";

interface UpgradeRequiredModalProps {
  open: boolean;
  onClose: () => void;
  details: FeatureGatingDetails | null;
}

/**
 * Tier benefits for upgrade messaging
 */
const TIER_BENEFITS: Record<string, string[]> = {
  professional: [
    "500 AI queries per month",
    "Deep research capabilities",
    "Contract drafting & analysis",
    "Document export (PDF/DOCX)",
    "90-day chat history",
  ],
  team: [
    "2,000 shared AI queries per month",
    "Team collaboration features",
    "Role-based access control",
    "Activity logs & audit trail",
    "API access (1,000 calls/month)",
  ],
  enterprise: [
    "Unlimited AI queries",
    "SSO/SAML integration",
    "Advanced audit logging",
    "Custom integrations & API keys",
    "Organization knowledge base",
    "Dedicated support",
  ],
};

/**
 * Feature descriptions for context
 */
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  deep_research: "Conduct comprehensive multi-source legal research with AI-powered analysis across multiple jurisdictions and document types.",
  contract_drafting: "Generate professional legal documents using AI with customizable templates and clause libraries.",
  contract_analysis: "Analyze contracts for risks, obligations, and key terms with detailed AI-powered insights.",
  document_upload: "Upload and process your own documents for AI-powered search and analysis.",
  export_pdf: "Export research results and documents as professionally formatted PDFs.",
  export_docx: "Export documents in Word format for easy editing and collaboration.",
  team_management: "Manage team members, assign roles, and control access to features.",
  sso_saml: "Enable single sign-on with your organization's identity provider.",
  custom_integrations: "Build custom integrations with webhooks and the API.",
  api_access: "Access the API programmatically for automation and integrations.",
  audit_logs: "Track all user activity with detailed audit logs for compliance.",
};

export function UpgradeRequiredModal({
  open,
  onClose,
  details,
}: UpgradeRequiredModalProps) {
  const router = useRouter();

  // Don't render if no details or modal is closed
  if (!details || !open) {
    return null;
  }

  // Safely extract values with fallbacks
  const featureName = getFeatureDisplayName(details.feature);
  const currentTier = getTierDisplayName(details.tier);
  const requiredTier = getTierDisplayName(details.required_tier);
  const requiredTierKey = details.required_tier || "professional";
  const benefits = TIER_BENEFITS[requiredTierKey] || TIER_BENEFITS.professional;
  const featureDescription = details.feature ? (FEATURE_DESCRIPTIONS[details.feature] || "") : "";

  const handleUpgrade = () => {
    onClose();
    router.push(`/pricing?highlight=${requiredTierKey}&feature=${details.feature || "upgrade"}`);
  };

  const handleViewPlans = () => {
    onClose();
    router.push("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">
            Upgrade to Unlock {featureName}
          </DialogTitle>
          <DialogDescription className="text-base">
            {featureDescription || `${featureName} is a premium feature available on the ${requiredTier} plan and above.`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Current vs Required Tier */}
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <span className="text-muted-foreground">Your plan:</span>
              <span className="font-medium">{currentTier}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1">
              <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {requiredTier}
              </span>
            </div>
          </div>

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-amber-500" />
                What you&apos;ll get with {requiredTier}:
              </h4>
              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to {requiredTier}
          </Button>
        </div>

        {/* View all plans link */}
        <div className="mt-2 text-center">
          <button
            onClick={handleViewPlans}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Compare all plans
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing upgrade modal state
 */
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<FeatureGatingDetails | null>(null);

  const showUpgradeModal = (gatingDetails: FeatureGatingDetails) => {
    setDetails(gatingDetails);
    setIsOpen(true);
  };

  const hideUpgradeModal = () => {
    setIsOpen(false);
    // Clear details after animation
    setTimeout(() => setDetails(null), 200);
  };

  return {
    isOpen,
    details,
    showUpgradeModal,
    hideUpgradeModal,
  };
}
