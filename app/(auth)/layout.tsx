import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,160,89,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0))] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Logo height={140} />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      <main className="container flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_minmax(0,460px)] lg:items-center">
          <section className="hidden rounded-[32px] border border-border/60 bg-surface-container px-8 py-10 shadow-[var(--shadow-soft)] lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
              Law Lens Uganda
            </p>
            <h1 className="mt-6 max-w-xl font-serif text-5xl font-semibold tracking-[-0.03em] text-foreground">
              Uganda&apos;s legal research workspace, rendered with institutional clarity.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Access legislation, judgments, research workflows, and drafting tools in a product surface designed for long reading sessions and high-trust legal work.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-surface-container-high px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-foreground/80">
                  Research
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Structured reports with cited authority and confidence signalling.
                </p>
              </div>
              <div className="rounded-3xl bg-surface-container-high px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-foreground/80">
                  Drafting
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Editorial contract workflows shaped for professional review.
                </p>
              </div>
              <div className="rounded-3xl bg-surface-container-high px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-foreground/80">
                  Authority
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Interfaces tuned for precision, auditability, and calm focus.
                </p>
              </div>
            </div>
          </section>

          <div className="mx-auto w-full max-w-md">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/85 py-4 backdrop-blur">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>Law Lens Uganda - Uganda Legal Intelligence Platform</p>
            <div className="flex items-center gap-4">
              <Link href="/help" className="hover:text-foreground transition-colors">
                Help
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
