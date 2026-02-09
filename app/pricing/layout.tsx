import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Law Lens Legal Intelligence | AI Legal Research Plans",
  description:
    "Choose the perfect plan for your legal research needs. From free basic access to enterprise solutions. AI-powered legal research for Uganda with transparent pricing.",
  keywords: [
    "legal research pricing",
    "AI legal assistant pricing",
    "Uganda legal database",
    "law firm software pricing",
    "legal tech subscription",
    "legal research tools",
    "contract analysis software",
    "legal document management",
  ],
  openGraph: {
    title: "Pricing Plans | Law Lens Legal Intelligence",
    description:
      "Simple, transparent pricing for AI-powered legal research. Start free, upgrade when ready. Plans for solo practitioners, teams, and enterprises.",
    type: "website",
    url: "/pricing",
    siteName: "Law Lens Legal Intelligence",
    images: [
      {
        url: "/og-pricing.png",
        width: 1200,
        height: 630,
        alt: "Law Lens Legal Intelligence Pricing Plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Plans | Law Lens Legal Intelligence",
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
  name: "Pricing - Law Lens Legal Intelligence",
  description:
    "Choose the perfect plan for AI-powered legal research in Uganda",
  url: "https://lawlens.io/pricing",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Product",
        position: 1,
        name: "Free Plan",
        description: "Basic legal research access with 50 AI queries per month",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          priceValidUntil: "2025-12-31",
        },
      },
      {
        "@type": "Product",
        position: 2,
        name: "Professional Plan",
        description:
          "For solo practitioners with 500 AI queries, contract drafting, and deep research",
        offers: {
          "@type": "Offer",
          price: "25",
          priceCurrency: "USD",
          priceValidUntil: "2025-12-31",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Product",
        position: 3,
        name: "Team Plan",
        description:
          "For law firms and teams with 2000 AI queries per user, team management, and SSO",
        offers: {
          "@type": "Offer",
          price: "30",
          priceCurrency: "USD",
          priceValidUntil: "2025-12-31",
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
          "Custom solutions with unlimited queries, private knowledge base, and dedicated support",
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
    name: "Law Lens Legal Intelligence",
    url: "https://lawlens.ug",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
