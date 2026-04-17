"use client";

import { BetaAnnouncementBanner } from "@/components/beta/beta-announcement-banner";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useBetaMode } from "@/hooks/use-beta-mode";

/**
 * Landing-page wrapper for the beta waitlist banner.
 *
 * The waitlist MODAL itself is owned by AuthModalProvider so there
 * is exactly one instance mounted across the app — we just open it
 * from here when someone clicks the banner CTA.
 *
 * useBetaMode fails closed: on error, betaEnabled stays false. The old
 * behavior was to keep the "Private Beta — Join Waitlist" banner up
 * on ANY fetch error, which could resurrect beta UI long after beta
 * ended.
 */
export function LandingBetaBanner() {
  const { openWaitlist } = useAuthModal();
  const { betaEnabled } = useBetaMode();

  if (!betaEnabled) return null;

  return <BetaAnnouncementBanner onJoinClick={openWaitlist} />;
}
