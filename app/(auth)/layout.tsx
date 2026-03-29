import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header — logo + back to landing */}
      <header className="border-b border-border/40 bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6 lg:px-12">
          <div className="-ml-3.5">
            <Logo height={56} href="/landing" />
          </div>
        </div>
      </header>

      {/* Centered auth content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/40 py-4">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link href="/help" className="transition-colors hover:text-foreground">
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
}
