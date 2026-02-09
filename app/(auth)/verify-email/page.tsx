"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers";
import { verifyEmail } from "@/lib/api/auth";
import { useResendVerification } from "@/lib/hooks";
import { APIError } from "@/lib/api/client";

type VerifyState = "verifying" | "success" | "error" | "pending";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isPending = searchParams.get("pending") === "true";

  const { user, isAuthenticated, refreshSession } = useAuth();

  const [state, setState] = useState<VerifyState>(
    token ? "verifying" : isPending ? "pending" : "error"
  );
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const {
    resend,
    isSending: resendLoading,
    cooldown,
    success: resendSuccess,
    error: resendError,
  } = useResendVerification(isAuthenticated);

  // Verify the email token
  useEffect(() => {
    async function verify() {
      if (!token) return;

      try {
        await verifyEmail({ token });
        setState("success");
        // Refresh the session to update the user's email_verified status
        await refreshSession();
      } catch (err) {
        setState("error");
        if (err instanceof APIError) {
          if (err.errorCode === "TOKEN_EXPIRED" || err.errorCode === "TOKEN_INVALID") {
            setVerificationError("This verification link has expired or is invalid. Please request a new one.");
          } else if (err.errorCode === "ALREADY_VERIFIED") {
            setState("success");
          } else {
            setVerificationError(err.message || "Failed to verify email. Please try again.");
          }
        } else {
          setVerificationError("An unexpected error occurred. Please try again.");
        }
      }
    }

    if (token) {
      verify();
    }
  }, [token, refreshSession]);

  const handleResendVerification = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    await resend();
  };

  // Verifying state (loading)
  if (state === "verifying") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verifying your email</CardTitle>
          <CardDescription className="text-center">
            Please wait while we verify your email address...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Email verified!</CardTitle>
          <CardDescription className="text-center">
            Your email has been successfully verified. You can now access all features.
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/">Continue to Law Lens</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Pending state (just registered, waiting for verification)
  if (state === "pending") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent a verification link to{" "}
            {user?.email ? (
              <span className="font-medium">{user.email}</span>
            ) : (
              "your email"
            )}
            . Please check your inbox and click the link to verify your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {(verificationError || resendError) && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{verificationError || resendError}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <p>Verification email sent! Check your inbox.</p>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Didn&apos;t receive the email?</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={resendLoading || cooldown > 0 || !isAuthenticated}
          >
            {resendLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              "Resend verification email"
            )}
          </Button>

          <Link href="/" className="text-center text-sm text-muted-foreground hover:text-foreground">
            Continue to Law Lens (limited access)
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Error state
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Verification failed</CardTitle>
        <CardDescription className="text-center">
          {verificationError || "This verification link is invalid or has expired."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {resendError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{resendError}</p>
          </div>
        )}
        {resendSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <p>Verification email sent! Check your inbox.</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={resendLoading || cooldown > 0}
          >
            {resendLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Request new link in ${cooldown}s`
            ) : (
              "Request new verification email"
            )}
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/login">Sign in to request new link</Link>
          </Button>
        )}

        <Link href="/" className="text-center text-sm text-muted-foreground hover:text-foreground">
          Go to homepage
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Loading</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
