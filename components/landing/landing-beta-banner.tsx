"use client";

import { useState, useEffect } from "react";
import { BetaAnnouncementBanner } from "@/components/beta/beta-announcement-banner";
import { BetaAccessModal } from "@/components/beta/beta-access-modal";
import { getPublicBetaMode } from "@/lib/api";

/**
 * Landing-page wrapper for the beta waitlist banner + modal.
 * Handles beta mode detection and modal state.
 */
export function LandingBetaBanner() {
  const [showModal, setShowModal] = useState(false);
  const [betaEnabled, setBetaEnabled] = useState(false);

  useEffect(() => {
    getPublicBetaMode()
      .then((res) => setBetaEnabled(res.enabled))
      .catch(() => {
        // Fallback: show banner anyway for landing page
        setBetaEnabled(true);
      });
  }, []);

  if (!betaEnabled) return null;

  return (
    <>
      <BetaAnnouncementBanner onJoinClick={() => setShowModal(true)} />
      <BetaAccessModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
}
