import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { MapPin, Phone, Mail } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { label: "Features", href: "/landing#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Browse Documents", href: "/browse" },
  ],
  Company: [
    { label: "About", href: "/about" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="px-6 py-12 lg:px-12 lg:py-14 xl:px-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="-ml-3 -mb-1">
              <Logo height={54} href="/landing" />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Legal intelligence for institutions that need faster research,
              grounded answers, and clearer visibility into legal risk,
              compliance, and regulatory change.
            </p>

            {/* Address */}
            <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold/70" />
                <span>
                  National ICT Innovation Hub
                  <br />
                  Plot 19-21 Port Bell Road, Kampala
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-brand-gold/70" />
                <a
                  href="tel:+256750990718"
                  className="transition-colors hover:text-foreground"
                >
                  +256 750 990 718
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-brand-gold/70" />
                <a
                  href="mailto:info@lawlens.io"
                  className="transition-colors hover:text-foreground"
                >
                  info@lawlens.io
                </a>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/30 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Law Lens. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
