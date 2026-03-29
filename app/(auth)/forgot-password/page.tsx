"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";

/**
 * Forgot password page - redirects to landing and opens auth modal.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { openForgotPassword } = useAuthModal();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/chat");
      return;
    }

    openForgotPassword();
    router.replace("/landing");
  }, [isLoading, isAuthenticated, router, openForgotPassword]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
