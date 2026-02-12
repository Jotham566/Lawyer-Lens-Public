"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Users, Zap, Shield, CheckCircle2, Mail, Loader2 } from "lucide-react";

interface WaitlistSectionProps {
  id?: string;
  className?: string;
}

export function WaitlistSection({ id, className }: WaitlistSectionProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    organization: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [totalWaiting, setTotalWaiting] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

      // Prepare payload with source field
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        organization: formData.organization || undefined,
        role: formData.role || undefined,
        source: "landing_page",
      };

      const response = await fetch(`${apiUrl}/beta/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get response text first
        const responseText = await response.text();
        console.error("Error response text:", responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText || "Failed to join waitlist" };
        }

        console.error("Waitlist error:", errorData);

        // Show user-friendly error message
        let errorMessage = errorData.message || errorData.detail || "Failed to join waitlist";

        // Special handling for duplicate email
        if (errorMessage.toLowerCase().includes("already on waitlist")) {
          errorMessage = "This email is already on the waitlist. Check your inbox for your position!";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setPosition(data.position);
      setTotalWaiting(data.total_waiting);
      setSubmitted(true);
    } catch (err) {
      console.error("Waitlist submission error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted && position !== null) {
    return (
      <section id={id} className={className}>
        <Card className="max-w-2xl mx-auto border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-3xl">You&apos;re on the list! 🎉</CardTitle>
            <CardDescription className="text-lg">
              Thank you for joining our beta waitlist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-8 bg-white dark:bg-background rounded-lg border-2 border-purple-300 dark:border-purple-700">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                #{position}
              </div>
              <p className="text-muted-foreground">Your position in line</p>
              <p className="text-sm text-muted-foreground mt-2">
                {totalWaiting} people are waiting
              </p>
            </div>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                We&apos;ve sent a confirmation email to <strong>{formData.email}</strong>.
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
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id={id} className={className}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            Beta Program
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Join the Legal Intelligence Beta
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get early access to Uganda&apos;s premier AI-powered legal research platform.
            Limited spots available.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Beta Perks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Early Adopter Badge</p>
                  <p className="text-sm text-muted-foreground">Exclusive recognition in your profile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Extended Trial</p>
                  <p className="text-sm text-muted-foreground">180 days of full platform access</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-muted-foreground">Direct line to our team</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Founding Member Pricing</p>
                  <p className="text-sm text-muted-foreground">Lock in special rates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join the Waitlist</CardTitle>
              <CardDescription>
                Be among the first to experience the future of legal research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@lawfirm.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    type="text"
                    placeholder="Your law firm or company"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    type="text"
                    placeholder="Lawyer, Judge, Researcher, etc."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Waitlist"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By joining, you agree to receive updates about our beta program
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="font-semibold mb-2">AI-Powered Search</h3>
              <p className="text-sm text-muted-foreground">
                Find relevant case law and legislation in seconds with natural language queries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Comprehensive Coverage</h3>
              <p className="text-sm text-muted-foreground">
                Access Uganda&apos;s complete legal database with up-to-date legislation and judgments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-semibold mb-2">Shape the Platform</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback directly influences features and improvements
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
