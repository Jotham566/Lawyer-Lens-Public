import type { Metadata } from "next";
import { LandingPageShell } from "@/components/landing/landing-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing access to and use of Law Lens, including individual, team, and enterprise use. Covers subscriptions, billing, acceptable use, and customer data.",
  openGraph: {
    title: "Terms of Service — Law Lens",
    description: "Terms governing use of Law Lens.",
    type: "website",
    url: "/terms",
  },
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <LandingPageShell>{children}</LandingPageShell>;
}
