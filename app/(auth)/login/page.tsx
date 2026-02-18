"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";

/**
 * Login page content component - uses useSearchParams
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLogin, setReturnUrl } = useAuthModal();

  const returnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    // If already authenticated, redirect to return URL or chat
    if (!isLoading && isAuthenticated) {
      const destination = returnUrl ? decodeURIComponent(returnUrl) : "/chat";
      router.replace(destination);
      return;
    }

    // If not loading and not authenticated, open the modal and go home
    if (!isLoading && !isAuthenticated) {
      // Store returnUrl if provided
      if (returnUrl) {
        setReturnUrl(decodeURIComponent(returnUrl));
      }

      router.replace("/");
      // Small delay to ensure navigation completes
      setTimeout(() => {
        openLogin();
      }, 100);
    }
  }, [isLoading, isAuthenticated, router, openLogin, returnUrl, setReturnUrl]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Login page - redirects to home and opens auth modal.
 * This page handles direct URL access to /login by opening the modal.
 * Preserves returnUrl from query params for post-login redirect.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
