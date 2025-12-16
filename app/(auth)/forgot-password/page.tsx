"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";

/**
 * Forgot password page - redirects to home and opens auth modal.
 * This page handles direct URL access to /forgot-password by opening the modal.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { openForgotPassword } = useAuthModal();

  useEffect(() => {
    // If already authenticated, redirect to home
    if (!isLoading && isAuthenticated) {
      router.replace("/");
      return;
    }

    // If not loading and not authenticated, open the modal and go home
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
      // Small delay to ensure navigation completes
      setTimeout(() => {
        openForgotPassword();
      }, 100);
    }
  }, [isLoading, isAuthenticated, router, openForgotPassword]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
