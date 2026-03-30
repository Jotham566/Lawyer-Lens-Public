import type { Metadata } from "next";
import { LandingPageShell } from "@/components/landing/landing-page-shell";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description:
    "Get help using Law Lens for legal research, grounded answers, internal knowledge workflows, and compliance monitoring. Quick links, FAQs, and support.",
  openGraph: {
    title: "Help & FAQ — Law Lens",
    description: "Guidance on using Law Lens for legal research and compliance.",
    type: "website",
    url: "/help",
  },
  alternates: {
    canonical: "/help",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <LandingPageShell>{children}</LandingPageShell>;
}
