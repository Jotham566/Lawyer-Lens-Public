"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { getPublicBetaMode } from "@/lib/api";

/**
 * Unified "Get Started" action across the UI.
 *
 * - Authenticated → navigate to dashboard
 * - Not authenticated + Beta on → show waitlist callback
 * - Not authenticated + Beta off → open register modal
 *
 * Returns { handleGetStarted, betaEnabled, showWaitlist, setShowWaitlist }
 */
export function useGetStarted() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const [betaEnabled, setBetaEnabled] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

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
        setShowWaitlist(true);
      } else {
        openRegister(redirectAfter);
      }
    },
    [isAuthenticated, betaEnabled, openRegister, router]
  );

  return { handleGetStarted, betaEnabled, showWaitlist, setShowWaitlist };
}
