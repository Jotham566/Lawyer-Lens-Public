/**
 * Waitlist Status Page
 * 
 * @route /waitlist/status?email={email}
 * @description Displays beta waitlist status for users who received notification emails
 * 
 * Features:
 * - Three status states: pending, invited, registered
 * - Full light/dark mode support
 * - Mock data fallback for development without backend
 * 
 * Backend Integration:
 * - API endpoint: GET /api/v1/beta/waitlist/status?email={email}
 * - Expected response: { email, position, total_waiting, status, created_at, invited_at? }
 * - Set NEXT_PUBLIC_USE_MOCK_WAITLIST=true to always use mock data
 * 
 * @see app/api/v1/beta/waitlist/status/route.ts for the proxy API route
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface WaitlistStatus {
  email: string;
  position: number;
  total_waiting: number;
  status: "pending" | "invited" | "registered";
  created_at: string;
  invited_at?: string;
}

// Enable mock mode for development without backend
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_WAITLIST === "true";

function WaitlistStatusContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      setError("No email provided");
      setLoading(false);
      return;
    }

    fetchWaitlistStatus(email);
  }, [email]);

  const getMockStatus = (email: string): WaitlistStatus => {
    // Generate consistent mock data based on email
    const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const statusOptions: Array<"pending" | "invited" | "registered"> = ["pending", "invited", "registered"];
    const mockStatus = statusOptions[hash % statusOptions.length];
    
    return {
      email,
      position: (hash % 150) + 1,
      total_waiting: 250,
      status: mockStatus,
      created_at: new Date(Date.now() - (hash % 30) * 24 * 60 * 60 * 1000).toISOString(),
      invited_at: mockStatus === "invited" ? new Date(Date.now() - (hash % 7) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };
  };

  const fetchWaitlistStatus = async (emailToCheck: string) => {
    try {
      // Use mock data if enabled or if backend is not available
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus(getMockStatus(emailToCheck));
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/v1/beta/waitlist/status?email=${encodeURIComponent(emailToCheck)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Email not found on the waitlist");
        } else {
          const errorData = await response.json().catch(() => ({ message: "Failed to check status" }));
          setError(errorData.message || errorData.detail || "Failed to check status");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error("Error fetching waitlist status:", err);
      
      // Fallback to mock data in development when backend is unavailable
      if (process.env.NODE_ENV === "development") {
        console.warn("Backend unavailable, using mock data. Set NEXT_PUBLIC_USE_MOCK_WAITLIST=true to suppress this warning.");
        setStatus(getMockStatus(emailToCheck));
      } else {
        setError("Unable to connect to the server. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Checking your status...</p>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-lg w-full border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Unable to Check Status</CardTitle>
            <CardDescription>
              {error || "Please provide a valid email address"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/#waitlist">Return to Waitlist</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.status === "invited") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-lg w-full border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <Badge className="mx-auto mb-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Invitation Ready
            </Badge>
            <CardTitle className="text-2xl">You&apos;re Invited! 🎉</CardTitle>
            <CardDescription className="text-base">
              Check your email for your invitation link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                An invitation email has been sent to <strong>{status.email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-foreground">Click the registration link in your email</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg">🎁</span>
                <span className="text-foreground">Enjoy your beta perks and early adopter benefits</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg">💬</span>
                <span className="text-foreground">Your feedback helps shape the platform</span>
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Can&apos;t find the email? Check your spam folder or contact support.
              </p>
              <Button asChild className="w-full">
                <Link href="/register">Register Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.status === "registered") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-lg w-full border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge className="mx-auto mb-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Already Registered
            </Badge>
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription className="text-base">
              Your account is already active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              You&apos;ve already registered with <strong>{status.email}</strong>
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending status
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <Badge className="mx-auto mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            On the Waitlist
          </Badge>
          <CardTitle className="text-2xl">You&apos;re on the list! 🎉</CardTitle>
          <CardDescription className="text-base">
            Thank you for joining our beta waitlist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-8 bg-white dark:bg-background rounded-lg border-2 border-purple-300 dark:border-purple-700">
            <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              #{status?.position}
            </div>
            <p className="text-muted-foreground">Your position in line</p>
            {status?.total_waiting && (
              <p className="text-sm text-muted-foreground mt-2">
                {status.total_waiting} people are waiting
              </p>
            )}
          </div>

          <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <AlertDescription>
              <strong className="text-purple-900 dark:text-purple-100">Beta users receive:</strong>
              <ul className="mt-2 space-y-1 text-sm text-purple-800 dark:text-purple-200">
                <li>• Early Adopter Badge</li>
                <li>• 180-day extended trial</li>
                <li>• Priority support</li>
                <li>• Founding member pricing</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              We&apos;ve sent a confirmation email to <strong>{status?.email}</strong>.
              You&apos;ll hear from us when your invitation is ready!
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-lg">📧</span>
              <span>We&apos;re inviting users weekly in order of signup</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">⚡</span>
              <span>You&apos;ll receive an email when your invitation is ready</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">🎁</span>
              <span>Beta users get exclusive perks and early adopter benefits</span>
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WaitlistStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <WaitlistStatusContent />
    </Suspense>
  );
}
