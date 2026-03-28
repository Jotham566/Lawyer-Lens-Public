import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { LandingShell } from "./landing-shell";

export const metadata: Metadata = {
  title: "Pricing — Plans for Legal Research, Compliance & Enterprise | Law Lens",
  description:
    "Plans for solo practitioners, law firms, and institutional deployments. Citation-backed legal research, compliance monitoring, and internal knowledge intelligence.",
  keywords: [
    "legal intelligence pricing",
    "legal research platform",
    "Uganda legal technology",
    "law firm legal research",
    "compliance monitoring software",
    "enterprise legal tools",
    "contract analysis pricing",
    "regulatory change monitoring",
  ],
  openGraph: {
    title: "Pricing — Law Lens Legal Intelligence",
    description:
      "Plans for every stage of legal practice. Solo practitioners, firms, and institutional deployments with citation-backed research and compliance monitoring.",
    type: "website",
    url: "/pricing",
    siteName: "Law Lens Uganda Legal Intelligence",
    images: [
      {
        url: "/og-pricing.png",
        width: 1200,
        height: 630,
        alt: "Law Lens Uganda Legal Intelligence Pricing Plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Plans | Law Lens Uganda Legal Intelligence",
    description:
      "AI-powered legal research pricing. Free tier available. Professional, Team, and Enterprise plans.",
    images: ["/og-pricing.png"],
  },
  alternates: {
    canonical: "/pricing",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for pricing
const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Pricing — Law Lens Legal Intelligence",
  description:
    "Plans for legal research, compliance monitoring, and institutional deployments",
  url: "https://lawlens.io/pricing",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Product",
        position: 1,
        name: "Free Plan",
        description: "Basic citation-backed legal research with 50 AI queries per month",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          priceValidUntil: "2026-12-31",
        },
      },
      {
        "@type": "Product",
        position: 2,
        name: "Professional Plan",
        description:
          "For solo practitioners — 500 AI queries, contract analysis, deep research, and compliance tools",
        offers: {
          "@type": "Offer",
          price: "25",
          priceCurrency: "USD",
          priceValidUntil: "2026-12-31",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Product",
        position: 3,
        name: "Team Plan",
        description:
          "For law firms and legal teams — 2000 AI queries per user, shared workspaces, and team management",
        offers: {
          "@type": "Offer",
          price: "30",
          priceCurrency: "USD",
          priceValidUntil: "2026-12-31",
          billingDuration: "P1M",
          eligibleQuantity: {
            "@type": "QuantitativeValue",
            minValue: 3,
          },
        },
      },
      {
        "@type": "Product",
        position: 4,
        name: "Enterprise Plan",
        description:
          "For courts, regulators, and large organizations — unlimited queries, private knowledge base, compliance monitoring, and dedicated support",
        offers: {
          "@type": "Offer",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "Custom",
          },
        },
      },
    ],
  },
  provider: {
    "@type": "Organization",
    name: "Law Lens",
    url: "https://lawlens.io",
  },
};

export default async function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <>
      <Script
        id="pricing-jsonld"
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <LandingShell>{children}</LandingShell>
    </>
  );
}
