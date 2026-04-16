"use client";

import { useState, useEffect } from "react";
import { BetaAnnouncementBanner } from "@/components/beta/beta-announcement-banner";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { getPublicBetaMode } from "@/lib/api";

/**
 * Landing-page wrapper for the beta waitlist banner.
 *
 * The waitlist MODAL itself is owned by AuthModalProvider so there
 * is exactly one instance mounted across the app — we just open it
 * from here when someone clicks the banner CTA.
 */
export function LandingBetaBanner() {
  const { openWaitlist } = useAuthModal();
  const [betaEnabled, setBetaEnabled] = useState(false);

  useEffect(() => {
    getPublicBetaMode()
      .then((res) => setBetaEnabled(res.enabled))
      .catch(() => {
        // Fail-closed: if we can't confirm beta is on, assume it's
        // off. The old behavior was to fall back to showing the
        // "Private Beta — Join Waitlist" banner on ANY fetch error,
        // which meant one flaky API call resurrects the beta UI for
        // every subsequent visitor — long after beta has ended.
        setBetaEnabled(false);
      });
  }, []);

  if (!betaEnabled) return null;

  return <BetaAnnouncementBanner onJoinClick={openWaitlist} />;
}
