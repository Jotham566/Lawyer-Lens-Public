"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Login route ( /login ).
 *
 * Renders inside the (auth) layout — minimal header + centered
 * content — so a direct visit or deep link lands on a page that
 * actually looks like an auth surface instead of flashing the
 * marketing landing before opening a modal (the previous behavior).
 *
 * The existing auth flow is still a modal, so this page auto-opens
 * it on mount. If the user dismisses the modal they see a clean
 * "Welcome back" card with a button to reopen it, not a spinner
 * and not the landing page.
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLogin, setReturnUrl, isOpen } = useAuthModal();

  const returnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const destination = returnUrl ? decodeURIComponent(returnUrl) : "/chat";
      router.replace(destination);
      return;
    }

    if (returnUrl) {
      setReturnUrl(decodeURIComponent(returnUrl));
    }

    // Auto-open the modal the first time we land. We intentionally
    // don't navigate away; this URL stays /login so deep-link and
    // browser-back behavior stay predictable.
    openLogin();
  }, [isLoading, isAuthenticated, openLogin, returnUrl, setReturnUrl, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <LogIn className="h-5 w-5 text-primary" />
        </div>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Law Lens account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full" onClick={() => openLogin()} disabled={isOpen}>
          {isOpen ? "Sign in open…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary transition-colors hover:underline"
          >
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
