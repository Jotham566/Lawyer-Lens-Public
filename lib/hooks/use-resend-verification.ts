"use client";

import { useCallback, useEffect, useState } from "react";
import { APIError } from "@/lib/api/client";
import { resendVerificationEmail } from "@/lib/api/auth";

const DEFAULT_COOLDOWN_SECONDS = 60;

export function useResendVerification(
  isAuthenticated: boolean,
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS
) {
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Please sign in to resend the verification email.");
      return false;
    }
    if (cooldown > 0 || isSending) return false;

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      await resendVerificationEmail();
      setSuccess(true);
      setCooldown(cooldownSeconds);
      return true;
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Failed to resend verification email.");
      } else {
        setError("An unexpected error occurred.");
      }
      return false;
    } finally {
      setIsSending(false);
    }
  }, [isAuthenticated, cooldown, isSending, cooldownSeconds]);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(false), []);

  return {
    resend,
    isSending,
    cooldown,
    success,
    error,
    clearError,
    clearSuccess,
  };
}
