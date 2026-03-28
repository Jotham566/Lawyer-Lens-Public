"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PricingTierCard, PricingTier, PricingFAQ } from "@/components/pricing";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSubscription } from "@/lib/api/billing";
import { useAuth } from "@/components/providers";
import { DemoRequestModal } from "@/components/landing/demo-request-modal";
import { BetaAccessModal } from "@/components/beta/beta-access-modal";
import { useGetStarted } from "@/hooks/use-get-started";

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { handleGetStarted, showWaitlist, setShowWaitlist } = useGetStarted();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string | undefined>();
  const [showDemoModal, setShowDemoModal] = useState(false);

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
        const response = await fetchSubscription();
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
      setShowDemoModal(true);
      return;
    }
    if (tier === "free") {
      handleGetStarted();
      return;
    }
    // Paid tiers — authenticated users go to checkout, others use get-started flow
    if (isAuthenticated) {
      router.push(`/checkout?tier=${tier}&billing=${billingCycle}`);
    } else {
      handleGetStarted(undefined, `/checkout?tier=${tier}&billing=${billingCycle}`);
    }
  };

  return (
    <main className="min-h-screen bg-background" role="main">
      {/* Header */}
      <header className="bg-gradient-to-b from-muted/50 to-background pt-8 pb-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight mb-4">
            Pricing for Solo Practitioners, Teams, and Institutions
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the plan that fits your workflow — from self-serve legal
            research for individual practitioners to team and enterprise
            deployments for firms, regulators, and corporate legal departments.
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
                <span className="ml-2 rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-xs text-secondary-foreground">
                  Save 20%
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </header>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="pricing-plans">
        <h2 id="pricing-plans" className="sr-only">Pricing Plans</h2>
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
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="feature-comparison">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold text-center">
          Feature Comparison
        </p>
        <h2 id="feature-comparison" className="text-2xl font-bold text-center mt-2 mb-2">
          Compare all features
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Every plan includes citation-backed legal research and access to Uganda&apos;s legal corpus.
        </p>
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
                <td className="py-2.5 px-4 text-sm">AI Queries / month</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.monthlyAiQueries === null
                      ? "Unlimited"
                      : tier.limits.monthlyAiQueries.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2.5 px-4 text-sm">Storage</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.storageGb === null
                      ? "Unlimited"
                      : `${tier.limits.storageGb} GB`}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2.5 px-4 text-sm">Team Members</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-3 px-4 text-sm">
                    {tier.limits.maxMembers === null
                      ? "Unlimited"
                      : tier.limits.maxMembers}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2.5 px-4 text-sm">Deep Research / month</td>
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
                <td className="py-2.5 px-4 text-sm">Chat History Retention</td>
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
                  <td className="py-2.5 px-4 text-sm">{label}</td>
                  {tiers.map((tier) => (
                    <td key={tier.tier} className="text-center py-3 px-4">
                      {tier.features[key as keyof typeof tier.features] ? (
                        <span className="text-secondary-foreground">&#10003;</span>
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
                  <td className="py-2.5 px-4 text-sm">{label}</td>
                  {tiers.map((tier) => (
                    <td key={tier.tier} className="text-center py-3 px-4">
                      {tier.features[key as keyof typeof tier.features] ? (
                        <span className="text-secondary-foreground">&#10003;</span>
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
              {/* Static row: Private Knowledge Base */}
              <tr className="border-b">
                <td className="py-2.5 px-4 text-sm">Private Organizational Knowledge Base</td>
                {tiers.map((tier) => (
                  <td key={tier.tier} className="text-center py-2.5 px-4">
                    {tier.tier === "enterprise" ? (
                      <span className="text-secondary-foreground">&#10003;</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
              {[
                ["ssoSaml", "SSO/SAML"],
                ["customIntegrations", "Custom Integrations"],
                ["dedicatedSupport", "Dedicated Support"],
              ].map(([key, label]) => (
                <tr key={key} className="border-b">
                  <td className="py-2.5 px-4 text-sm">{label}</td>
                  {tiers.map((tier) => (
                    <td key={tier.tier} className="text-center py-3 px-4">
                      {tier.features[key as keyof typeof tier.features] ? (
                        <span className="text-secondary-foreground">&#10003;</span>
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
      </section>

      {/* Enterprise callout */}
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-brand-gold/20 bg-primary/[0.03] p-8 lg:p-10 dark:bg-primary/[0.06]">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                Enterprise
              </p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight">
                Custom solutions for institutions with advanced legal, compliance, and knowledge workflows
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Bring your internal legal and compliance records into one secure
                intelligence workspace. Tailored to your institution&apos;s
                requirements.
              </p>
              <ul className="mt-4 grid gap-x-8 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                {[
                  "Private organizational knowledge base",
                  "Internal document ingestion",
                  "Secure institutional workspace",
                  "Compliance monitoring",
                  "SSO/SAML",
                  "Custom integrations",
                  "Dedicated support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-brand-gold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="brand"
              size="lg"
              onClick={() => setShowDemoModal(true)}
              className="mt-2 whitespace-nowrap"
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className="sr-only">Frequently Asked Questions</h2>
        <PricingFAQ />
      </section>

      {/* CTA Section */}
      <section className="border-t-2 border-brand-gold/20 bg-primary/[0.03] py-16 dark:bg-primary/[0.06]" aria-labelledby="cta-section">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
            Get Started
          </p>
          <h2 id="cta-section" className="mt-3 text-2xl font-bold">
            Not sure which plan fits?
          </h2>
          <p className="text-muted-foreground mt-3 mb-8 max-w-xl mx-auto">
            Talk to us about your team size, use cases, and requirements.
            We&apos;ll help you find the right setup.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="brand"
              size="lg"
              onClick={() => handleGetStarted()}
              aria-label="Get started"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowDemoModal(true)}
              aria-label="Talk to sales"
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      <DemoRequestModal open={showDemoModal} onOpenChange={setShowDemoModal} />
      <BetaAccessModal open={showWaitlist} onOpenChange={setShowWaitlist} />
    </main>
  );
}
