"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";

/**
 * Register page content - uses useSearchParams
 */
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { openRegister, setReturnUrl } = useAuthModal();

  const returnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    // If already authenticated, redirect to return URL or dashboard
    if (!isLoading && isAuthenticated) {
      const destination = returnUrl ? decodeURIComponent(returnUrl) : "/dashboard";
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
        openRegister();
      }, 100);
    }
  }, [isLoading, isAuthenticated, router, openRegister, returnUrl, setReturnUrl]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Register page - redirects to home and opens auth modal.
 * This page handles direct URL access to /register by opening the modal.
 * Preserves returnUrl from query params for post-registration redirect.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
