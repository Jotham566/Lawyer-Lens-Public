import type { Metadata } from "next";
import { LandingShell } from "./landing-shell";

export const metadata: Metadata = {
  title: "About — Legal Intelligence for Institutions",
  description:
    "Law Lens is a legal intelligence platform built for courts, law firms, regulators, and corporate legal teams. Automate research, ground answers in law, and monitor compliance.",
  keywords: [
    "about law lens",
    "legal intelligence Uganda",
    "legal research platform",
    "law firm technology Uganda",
    "compliance platform",
  ],
  openGraph: {
    title: "About Law Lens — Legal Intelligence for Institutions",
    description:
      "Built for institutions where legal accuracy, trust, and timeliness matter.",
    type: "website",
    url: "/about",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LandingShell>{children}</LandingShell>;
}
