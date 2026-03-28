import type { Metadata } from "next";
import { LandingShell } from "./landing-shell";

export const metadata: Metadata = {
  title: "About — Law Lens",
  description:
    "Learn about Law Lens — a legal intelligence platform for institutions that need faster legal research, grounded answers, and clearer visibility into legal risk and compliance.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LandingShell>{children}</LandingShell>;
}
