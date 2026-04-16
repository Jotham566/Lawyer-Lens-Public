"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/providers";
import { ForgotPasswordView, type AuthView } from "@/components/auth/auth-modal";

/**
 * /forgot-password — first-class auth route.
 *
 * Renders the ForgotPasswordView form directly on the page. The
 * "Back to sign in" action routes to /login via router.push instead
 * of switching an internal modal view.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/chat");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSwitchView = useCallback(
    (view: AuthView) => {
      if (view === "login") router.push("/login");
      else if (view === "register") router.push("/register");
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <ForgotPasswordView headerVariant="page" onSwitchView={handleSwitchView} />
    </div>
  );
}
