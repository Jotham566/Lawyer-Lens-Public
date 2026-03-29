import type { Metadata } from "next";
import { LandingHeader, LandingFooter } from "@/components/landing";
import { LandingBetaBanner } from "@/components/landing/landing-beta-banner";

export const metadata: Metadata = {
  title: {
    default: "Law Lens — Legal Intelligence for Africa",
    template: "%s | Law Lens",
  },
  description:
    "AI-powered legal intelligence platform connecting Africa's legal corpus — legislation, case law, and regulations — into one searchable, citation-accurate knowledge base.",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Law Lens",
    title: "Law Lens — Legal Intelligence for Africa",
    description:
      "AI-powered legal intelligence platform for African jurisdictions. Search laws, judgments, and regulations with natural language.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Law Lens — Legal Intelligence for Africa",
    description:
      "AI-powered legal intelligence platform for African jurisdictions.",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Floating waitlist ribbon — fixed at top, above the landing header */}
      <div className="fixed inset-x-0 top-0 z-[60]">
        <LandingBetaBanner />
      </div>
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
