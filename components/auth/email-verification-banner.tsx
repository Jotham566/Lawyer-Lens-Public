"use client";

import { useAuth } from "@/components/providers";
import { AlertBanner } from "@/components/common";
import { useResendVerification } from "@/lib/hooks";

export function EmailVerificationBanner() {
  const { user, accessToken } = useAuth();
  const { resend, isSending, cooldown, success } = useResendVerification(accessToken);

  if (!user || user.email_verified) {
    return null;
  }

  const actionLabel = isSending
    ? "Sending..."
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : "Resend verification email";

  const message = success
    ? "Verification email sent. Please check your inbox to unlock all features."
    : "Please verify your email to unlock all features.";

  return (
    <div className="px-4 pt-3">
      <AlertBanner
        variant="warning"
        title="Verify your email"
        message={message}
        action={{
          label: actionLabel,
          onClick: resend,
          disabled: isSending || cooldown > 0,
        }}
      />
    </div>
  );
}
