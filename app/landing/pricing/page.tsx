import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Law Lens pricing plans for solo practitioners, law firms, and enterprise legal teams.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For law students and occasional research",
    features: [
      "Keyword document search",
      "Browse all legislation",
      "Browse all case law",
      "5 AI questions per day",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "For solo practitioners and small firms",
    features: [
      "Everything in Free",
      "Unlimited AI questions",
      "Deep research reports",
      "Amendment tracking",
      "Document bookmarks & collections",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/register?plan=professional",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large firms and corporate legal teams",
    features: [
      "Everything in Professional",
      "Internal knowledge base upload",
      "Regulatory compliance monitoring",
      "Team management & SSO",
      "Custom integrations & API access",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "/landing/contact",
    highlighted: false,
  },
];

export default function LandingPricingPage() {
  return (
    <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="mx-auto px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
            Pricing
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight lg:text-5xl">
            Plans for every practice
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Start free. Upgrade when your practice demands more. All plans
            include access to the full legal corpus.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? "border-2 border-primary bg-card shadow-floating"
                  : "border border-transparent bg-card shadow-soft dark:border-glass"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-bold">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={`mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-opacity hover:opacity-90 ${
                  tier.highlighted
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 bg-surface-container-high text-foreground"
                }`}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        {/* FAQ link */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions about which plan is right for you?{" "}
            <Link
              href="/contact"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Talk to our team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
