"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PricingTierCard, PricingTier, PricingFAQ } from "@/components/pricing";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string | undefined>();

  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch("/api/billing/pricing");
        if (response.ok) {
          const data = await response.json();
          setTiers(data.tiers);
        }
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCurrentSubscription() {
      try {
        const response = await fetch("/api/billing/subscription");
        if (response.ok) {
          const data = await response.json();
          if (data.subscription?.tier) {
            setCurrentTier(data.subscription.tier);
          }
        }
      } catch {
        // User may not be logged in, that's fine
      }
    }

    fetchPricing();
    fetchCurrentSubscription();
  }, []);

  const handleSelectTier = (tier: string) => {
    if (tier === "enterprise") {
      // Open contact form or mailto
      window.location.href = "mailto:sales@legalintelligence.com?subject=Enterprise%20Inquiry";
      return;
    }
    if (tier === "free") {
      router.push("/register");
      return;
    }
    // Navigate to checkout with selected tier and billing cycle
    router.push(`/checkout?tier=${tier}&billing=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/50 to-background pt-16 pb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include access to
            Kenya&apos;s comprehensive legal database.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <ToggleGroup
              type="single"
              value={billingCycle}
              onValueChange={(value) => {
                if (value) setBillingCycle(value as "monthly" | "annual");
              }}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem
                value="monthly"
                className="rounded-md px-4 py-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                Monthly
              </ToggleGroupItem>
              <ToggleGroupItem
                value="annual"
                className="rounded-md px-4 py-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[500px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
            {tiers.map((tier) => (
              <PricingTierCard
                key={tier.tier}
                tier={tier}
                billingCycle={billingCycle}
                isPopular={tier.tier === "professional"}
                currentTier={currentTier}
                onSelect={handleSelectTier}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          Compare all features
        </h2>
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-medium">Feature</th>
                {tiers.map((tier) => (
                  <th key={tier.tier} className="text-center py-4 px-4 font-medium">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Usage Limits */}
              <tr className="border-b bg-muted/30">
                <td colSpan={5} className="py-2 px-4 font-semibold text-sm">
                  Usage Limits
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm">AI Queries / month</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.monthlyAiQueries === null
                      ? "Unlimited"
                      : tier.limits.monthlyAiQueries.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm">Storage</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.storageGb === null
                      ? "Unlimited"
                      : `${tier.limits.storageGb} GB`}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm">Team Members</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.maxMembers === null
                      ? "Unlimited"
                      : tier.limits.maxMembers}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm">Deep Research / month</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.monthlyDeepResearch === null
                      ? "Unlimited"
                      : tier.limits.monthlyDeepResearch === 0
                      ? "-"
                      : tier.limits.monthlyDeepResearch}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm">Chat History Retention</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.chatHistoryDays === null
                      ? "Unlimited"
                      : `${tier.limits.chatHistoryDays} days`}
                  </td>
                ))}
              </tr>

              {/* Core Features */}
              <tr className="border-b bg-muted/30">
                <td colSpan={5} className="py-2 px-4 font-semibold text-sm">
                  Core Features
                </td>
              </tr>
              {[
                ["basicSearch", "Legal Search"],
                ["aiChat", "AI Chat"],
                ["citations", "Case Citations"],
                ["deepResearch", "Deep Research"],
                ["contractDrafting", "Contract Drafting"],
                ["contractAnalysis", "Contract Analysis"],
                ["documentUpload", "Document Uploads"],
                ["exportPdf", "PDF Export"],
              ].map(([key, label]) => (
                <tr key={key} className="border-b">
                  <td className="py-3 px-4 text-sm">{label}</td>
                  {tiers.map((tier) => (
                    <td key={tier.tier} className="text-center py-3 px-4">
                      {tier.features[key as keyof typeof tier.features] ? (
                        <span className="text-green-600">&#10003;</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Team Features */}
              <tr className="border-b bg-muted/30">
                <td colSpan={5} className="py-2 px-4 font-semibold text-sm">
                  Team Features
                </td>
              </tr>
              {[
                ["teamManagement", "Team Management"],
                ["roleBasedAccess", "Role-Based Access"],
                ["sharedWorkspaces", "Shared Workspaces"],
                ["activityLogs", "Activity Logs"],
                ["apiAccess", "API Access"],
              ].map(([key, label]) => (
                <tr key={key} className="border-b">
                  <td className="py-3 px-4 text-sm">{label}</td>
                  {tiers.map((tier) => (
                    <td key={tier.tier} className="text-center py-3 px-4">
                      {tier.features[key as keyof typeof tier.features] ? (
                        <span className="text-green-600">&#10003;</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Enterprise Features */}
              <tr className="border-b bg-muted/30">
                <td colSpan={5} className="py-2 px-4 font-semibold text-sm">
                  Enterprise Features
                </td>
              </tr>
              {[
                ["ssoSaml", "SSO/SAML"],
                ["customIntegrations", "Custom Integrations"],
                ["dedicatedSupport", "Dedicated Support"],
              ].map(([key, label]) => (
                <tr key={key} className="border-b">
                  <td className="py-3 px-4 text-sm">{label}</td>
                  {tiers.map((tier) => (
                    <td key={tier.tier} className="text-center py-3 px-4">
                      {tier.features[key as keyof typeof tier.features] ? (
                        <span className="text-green-600">&#10003;</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <PricingFAQ />
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to transform your legal research?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start with a free account and upgrade when you&apos;re ready.
            No credit card required.
          </p>
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}
