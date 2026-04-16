"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

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
 * Register route ( /register ).
 *
 * Renders inside the (auth) layout — minimal header + centered
 * content — so a direct visit or deep link (e.g. /register?invite=…)
 * lands on a page that looks like an auth surface, not a flash of
 * the marketing landing page (the previous behavior). Preserves the
 * `invite` param via the auth modal provider.
 *
 * The signup flow is still a modal, so this page auto-opens it on
 * mount. If the user dismisses the modal they see a clean "Create
 * your account" card with a button to reopen it.
 */
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { openRegister, setReturnUrl, isOpen } = useAuthModal();

  const returnUrl = searchParams.get("returnUrl");
  const inviteToken = searchParams.get("invite");

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

    openRegister(undefined, inviteToken || undefined);
  }, [
    isLoading,
    isAuthenticated,
    openRegister,
    returnUrl,
    inviteToken,
    setReturnUrl,
    router,
  ]);

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
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Get started with Law Lens Uganda for free.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          onClick={() => openRegister(undefined, inviteToken || undefined)}
          disabled={isOpen}
        >
          {isOpen ? "Sign up open…" : "Sign up"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
