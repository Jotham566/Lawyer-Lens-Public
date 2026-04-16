"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";
import { LoginView, type AuthView } from "@/components/auth/auth-modal";
import { safeInternalPath } from "@/lib/utils/safe-redirect";

/**
 * /login — first-class auth route.
 *
 * Renders the LoginView form directly on the page (no modal, no
 * overlay, no marketing-page flash behind it). The same underlying
 * form component is still used inside <AuthModal>; we opt into the
 * page-variant header via headerVariant="page" so it renders
 * semantic <h1>/<p> instead of DialogTitle/DialogDescription.
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { setReturnUrl, getReturnUrl, clearReturnUrl } = useAuthModal();

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
  }, [isLoading, isAuthenticated, returnUrl, setReturnUrl, router]);

  const handleSwitchView = useCallback(
    (view: AuthView) => {
      if (view === "register") router.push("/register");
      else if (view === "forgot-password") router.push("/forgot-password");
    },
    [router]
  );

  // Mirrors AuthModalProvider.handleAuthSuccess — narrow returnUrl to
  // a same-origin path so a phish link like
  //   https://lawlens.io/login?returnUrl=https://evil.com
  // can't bounce us off-site after a valid login.
  const handleSuccess = useCallback(() => {
    const stored = getReturnUrl();
    clearReturnUrl();
    const safe =
      stored && stored !== "/login" && stored !== "/register"
        ? safeInternalPath(stored, "")
        : "";
    router.push(safe && safe !== "/" ? safe : "/chat");
  }, [getReturnUrl, clearReturnUrl, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <LoginView
        headerVariant="page"
        onSwitchView={handleSwitchView}
        onSuccess={handleSuccess}
      />
    </div>
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
