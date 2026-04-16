"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { handleOAuthCallback, OAuthProvider } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";

type CallbackState = "loading" | "success" | "error" | "beta_required";
type OAuthFlow = "login" | "register";

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithOAuth } = useAuth();
  const { openLogin, openRegister, openWaitlist } = useAuthModal();

  const [state, setState] = useState<CallbackState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // We remember what the user was trying to do (sign in vs sign up)
  // so the copy + error recovery reflect their intent. Without this,
  // the screen always said "Signing in" even for new-account flows.
  // Lazy init reads sessionStorage once on mount — can't be done
  // inside the effect below because the effect also clears it.
  const [flow] = useState<OAuthFlow>(() => {
    if (typeof window === "undefined") return "login";
    const stored = sessionStorage.getItem("oauth_flow");
    return stored === "register" ? "register" : "login";
  });

  const provider = params.provider as OAuthProvider;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  useEffect(() => {
    const processCallback = async () => {
      // Check for OAuth errors from provider
      if (error) {
        setState("error");
        setErrorMessage(errorDescription || `Authentication failed: ${error}`);
        return;
      }

      // Validate code and state
      if (!code || !stateParam) {
        setState("error");
        setErrorMessage("Invalid callback parameters. Please try again.");
        return;
      }

      // Verify state matches stored state
      const storedState = sessionStorage.getItem("oauth_state");
      const storedProvider = sessionStorage.getItem("oauth_provider");

      if (stateParam !== storedState) {
        setState("error");
        setErrorMessage("Invalid authentication state. Please try again.");
        return;
      }

      if (provider !== storedProvider) {
        setState("error");
        setErrorMessage("Provider mismatch. Please try again.");
        return;
      }

      try {
        // Exchange code for tokens
        await handleOAuthCallback(provider, {
          code,
          state: stateParam,
        });

        // Get return URL before clearing storage
        const returnUrl = sessionStorage.getItem("oauth_return_url");

        // Clear stored OAuth state
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_flow");
        sessionStorage.removeItem("oauth_return_url");
        sessionStorage.removeItem("auth_return_url");

        // Update auth context (fetches full user profile including avatar)
        await loginWithOAuth();

        setState("success");

        // Redirect to return URL or /chat after brief success state.
        // The email auth flow lands users on /chat; OAuth was going
        // to /dashboard, which then redirects to /chat, adding an
        // extra frame of spinner. Unified on /chat.
        setTimeout(() => {
          const destination = returnUrl && returnUrl !== "/" && returnUrl !== "/login" && returnUrl !== "/register"
            ? returnUrl
            : "/chat";
          router.push(destination);
        }, 1500);
      } catch (err) {
        if (err instanceof APIError) {
          if (
            err.errorCode === "BETA_ACCESS_REQUIRED" ||
            err.errorCode === "beta_access_required" ||
            err.message?.toLowerCase().includes("invite-only")
          ) {
            // New Google/Microsoft signup blocked by the private-beta
            // gate. Rather than the generic "Authentication failed"
            // wall, route them into the dedicated beta surface with
            // language that matches the email-signup path.
            setState("beta_required");
            setErrorMessage(
              "Sign-ups are currently invite-only. Join the waitlist and we'll let you in as seats open."
            );
            return;
          }
          if (err.errorCode === "USER_EXISTS") {
            setState("error");
            setErrorMessage(
              "An account with this email already exists. Please sign in with your email and password."
            );
            return;
          }
          if (err.errorCode === "OAUTH_ERROR") {
            setState("error");
            setErrorMessage(
              err.message || "Authentication failed. Please try again."
            );
            return;
          }
          setState("error");
          setErrorMessage(err.message || "Authentication failed. Please try again.");
          return;
        }
        setState("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    processCallback();
  }, [code, stateParam, error, errorDescription, provider, router, loginWithOAuth]);

  const providerName = provider === "google" ? "Google" : "Microsoft";
  const loadingTitle =
    flow === "register"
      ? `Creating your account with ${providerName}`
      : `Signing in with ${providerName}`;
  const successTitle =
    flow === "register" ? "Welcome to Law Lens!" : "Successfully signed in!";

  // "Try again" should put users back where they started — the
  // originating auth modal with the right default view — not dump
  // them at the homepage to rediscover the login link.
  const retryFromOrigin = () => {
    router.push("/");
    if (flow === "register") {
      openRegister();
    } else {
      openLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {state === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <CardTitle>{loadingTitle}</CardTitle>
              <CardDescription>
                Please wait while we complete your authentication...
              </CardDescription>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                <CheckCircle2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>{successTitle}</CardTitle>
              <CardDescription>
                Redirecting you to the chat...
              </CardDescription>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Authentication failed</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}

          {state === "beta_required" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Invite needed</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>

        {state === "error" && (
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={retryFromOrigin}>
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </CardContent>
        )}

        {state === "beta_required" && (
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                router.push("/");
                openWaitlist();
              }}
            >
              Join Waitlist
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                router.push("/");
                openLogin();
              }}
            >
              I already have an account
            </Button>
          </CardContent>
        )}

        {state === "success" && (
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/chat")}
            >
              Go to Chat
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
