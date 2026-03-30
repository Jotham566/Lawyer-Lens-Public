import type { Metadata } from "next";
import { LandingPageShell } from "@/components/landing/landing-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Law Lens collects, uses, and protects personal, organizational, and platform data. Covers account information, documents, workspace data, and user rights.",
  openGraph: {
    title: "Privacy Policy — Law Lens",
    description: "How Law Lens handles your data.",
    type: "website",
    url: "/privacy",
  },
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <LandingPageShell>{children}</LandingPageShell>;
}
