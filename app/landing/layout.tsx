import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { LandingHeader, LandingFooter } from "@/components/landing";
import { LandingBetaBanner } from "@/components/landing/landing-beta-banner";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lawlens.io";

// JSON-LD: Organization + WebSite + SearchAction
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Law Lens",
      url: BASE_URL,
      logo: `${BASE_URL}/icons/light/android-chrome-512x512.png`,
      description:
        "Legal intelligence platform for institutions. Automate legal research, get citation-backed answers, and stay ahead of compliance.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Plot 19-21 Port Bell Road",
        addressLocality: "Kampala",
        addressCountry: "UG",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+256-750-990-718",
        contactType: "sales",
        email: "hello@lawlens.io",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Law Lens Uganda",
      description:
        "Legal intelligence platform for courts, law firms, regulators, and enterprises.",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/judgments?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Law Lens — Legal Intelligence for Institutions",
  description:
    "Automate legal research, unlock insight from internal records, and stay ahead of legal risk, compliance, and regulatory change. Built for courts, law firms, regulators, and enterprises.",
  keywords: [
    "legal intelligence platform",
    "legal research automation",
    "Uganda legal technology",
    "citation-backed legal answers",
    "compliance monitoring",
    "regulatory change monitoring",
    "contract analysis",
    "internal knowledge base",
    "AI legal research",
    "law firm technology",
  ],
  openGraph: {
    type: "website",
    locale: "en_UG",
    siteName: "Law Lens",
    title: "Law Lens — Legal Intelligence for Institutions",
    description:
      "Search the law. Understand risk. Stay ahead of change. Legal intelligence for courts, law firms, regulators, and enterprises.",
    url: "/landing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Law Lens — Legal Intelligence for Institutions",
    description:
      "Automate legal research, get citation-backed answers, and stay ahead of compliance obligations.",
  },
  alternates: {
    canonical: "/landing",
  },
};

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <>
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        {/* Floating waitlist ribbon — fixed at top, above the landing header */}
        <div className="fixed inset-x-0 top-0 z-[60]">
          <LandingBetaBanner />
        </div>
        <LandingHeader />
        <main className="flex-1">{children}</main>
        <LandingFooter />
      </div>
    </>
  );
}
