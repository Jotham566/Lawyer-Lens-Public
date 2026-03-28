import { LandingPageShell } from "@/components/landing/landing-page-shell";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <LandingPageShell>{children}</LandingPageShell>;
}
