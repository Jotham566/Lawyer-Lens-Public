"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { getPublicBetaMode } from "@/lib/api";

/**
 * Unified "Get Started" action across the UI.
 *
 * - Authenticated → navigate to /chat
 * - Not authenticated + beta ON  → open the waitlist modal
 * - Not authenticated + beta OFF → open the register modal
 *
 * The waitlist + register modals are both owned by AuthModalProvider,
 * so this hook no longer manages any local modal state. Call sites
 * used to also render their own <BetaAccessModal>; they should now
 * remove that — the provider renders it once at the root.
 */
export function useGetStarted() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { openRegister, openWaitlist } = useAuthModal();
  const [betaEnabled, setBetaEnabled] = useState(false);

  useEffect(() => {
    getPublicBetaMode()
      .then((res) => setBetaEnabled(res.enabled))
      .catch(() => {});
  }, []);

  const handleGetStarted = useCallback(
    (e?: React.MouseEvent, redirectAfter?: string) => {
      e?.preventDefault();

      if (isAuthenticated) {
        router.push("/chat");
        return;
      }

      if (betaEnabled) {
        openWaitlist();
      } else {
        openRegister(redirectAfter);
      }
    },
    [isAuthenticated, betaEnabled, openRegister, openWaitlist, router]
  );

  return { handleGetStarted, betaEnabled };
}
