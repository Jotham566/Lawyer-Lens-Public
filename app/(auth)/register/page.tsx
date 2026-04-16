"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth, useAuthModal } from "@/components/providers";
import { RegisterView, type AuthView } from "@/components/auth/auth-modal";
import { safeInternalPath } from "@/lib/utils/safe-redirect";

/**
 * /register — first-class auth route.
 *
 * Renders the RegisterView form directly on the page (no modal).
 * Preserves invite= tokens from the URL through the shared
 * AuthModalProvider storage so the form picks them up the same way
 * it does inside the modal.
 */
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const {
    setReturnUrl,
    getReturnUrl,
    clearReturnUrl,
    setInvitationToken,
    clearInvitationToken,
  } = useAuthModal();

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
    if (inviteToken) {
      setInvitationToken(inviteToken);
    }
  }, [
    isLoading,
    isAuthenticated,
    returnUrl,
    inviteToken,
    setReturnUrl,
    setInvitationToken,
    router,
  ]);

  const handleSwitchView = useCallback(
    (view: AuthView) => {
      if (view === "login") router.push("/login");
    },
    [router]
  );

  const handleSuccess = useCallback(() => {
    const stored = getReturnUrl();
    clearReturnUrl();
    clearInvitationToken();
    const safe =
      stored && stored !== "/login" && stored !== "/register"
        ? safeInternalPath(stored, "")
        : "";
    router.push(safe && safe !== "/" ? safe : "/chat");
  }, [getReturnUrl, clearReturnUrl, clearInvitationToken, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <RegisterView
        headerVariant="page"
        onSwitchView={handleSwitchView}
        onSuccess={handleSuccess}
      />
    </div>
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
