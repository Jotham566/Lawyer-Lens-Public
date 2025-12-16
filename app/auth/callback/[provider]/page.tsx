"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers";
import { handleOAuthCallback, OAuthProvider } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";

type CallbackState = "loading" | "success" | "error";

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithOAuth } = useAuth();

  const [state, setState] = useState<CallbackState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

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
        const response = await handleOAuthCallback(provider, {
          code,
          state: stateParam,
        });

        // Get return URL before clearing storage
        const returnUrl = sessionStorage.getItem("oauth_return_url");

        // Clear stored OAuth state
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_return_url");
        sessionStorage.removeItem("auth_return_url");

        // Update auth context
        loginWithOAuth(response);

        setState("success");

        // Redirect to return URL or dashboard after brief success state
        setTimeout(() => {
          const destination = returnUrl && returnUrl !== "/" && returnUrl !== "/login" && returnUrl !== "/register"
            ? returnUrl
            : "/dashboard";
          router.push(destination);
        }, 1500);
      } catch (err) {
        setState("error");
        if (err instanceof APIError) {
          if (err.errorCode === "USER_EXISTS") {
            setErrorMessage(
              "An account with this email already exists. Please sign in with your email and password."
            );
          } else if (err.errorCode === "OAUTH_ERROR") {
            setErrorMessage(
              err.message || "Authentication failed. Please try again."
            );
          } else {
            setErrorMessage(err.message || "Authentication failed. Please try again.");
          }
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      }
    };

    processCallback();
  }, [code, stateParam, error, errorDescription, provider, router, loginWithOAuth]);

  const providerName = provider === "google" ? "Google" : "Microsoft";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {state === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <CardTitle>Signing in with {providerName}</CardTitle>
              <CardDescription>
                Please wait while we complete your authentication...
              </CardDescription>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Successfully signed in!</CardTitle>
              <CardDescription>
                Redirecting you to your dashboard...
              </CardDescription>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Authentication failed</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>

        {state === "error" && (
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Re-trigger OAuth flow
                router.push("/");
              }}
            >
              Try Again
            </Button>
          </CardContent>
        )}

        {state === "success" && (
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
