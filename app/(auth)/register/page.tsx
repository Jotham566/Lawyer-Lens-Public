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
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    // If already authenticated, redirect to return URL or chat
    if (!isLoading && isAuthenticated) {
      const destination = returnUrl ? decodeURIComponent(returnUrl) : "/chat";
      router.replace(destination);
      return;
    }

    // If not loading and not authenticated, go to landing and open modal
    if (!isLoading && !isAuthenticated) {
      // Store returnUrl if provided
      if (returnUrl) {
        setReturnUrl(decodeURIComponent(returnUrl));
      }

      // Open modal and navigate to landing (no intermediate redirect)
      openRegister(undefined, inviteToken || undefined);
      router.replace("/landing");
    }
  }, [isLoading, isAuthenticated, router, openRegister, returnUrl, inviteToken, setReturnUrl]);

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
