"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Mail, Loader2, CheckCircle2 } from "lucide-react";

interface BetaAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BetaAccessModal({ open, onOpenChange }: BetaAccessModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        organization: formData.organization || undefined,
        role: formData.role || undefined,
        source: "registration_modal",
      };

      const response = await fetch(`${apiUrl}/beta/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText || "Failed to join waitlist" };
        }

        let errorMessage = errorData.message || errorData.detail || "Failed to join waitlist";

        if (errorMessage.toLowerCase().includes("already on waitlist")) {
          errorMessage = "This email is already on the waitlist. Check your inbox for your confirmation!";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setPosition(data.position);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (submitted) {
      // Reset form on close after successful submission
      setFormData({ email: "", full_name: "", organization: "", role: "" });
      setSubmitted(false);
      setPosition(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!submitted ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <DialogTitle className="text-center">Join the Beta Waitlist</DialogTitle>
              <DialogDescription className="text-center">
                Legal Intelligence is currently in private beta. Join our waitlist to get early access and exclusive perks!
              </DialogDescription>
            </DialogHeader>

            <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-900/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription>
                <strong className="text-purple-900 dark:text-purple-100">Beta users receive:</strong>
                <ul className="mt-2 space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <li>• Early Adopter Badge</li>
                  <li>• Extended trial period</li>
                  <li>• Priority support</li>
                  <li>• Founding member pricing</li>
                </ul>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization (optional)</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Professional Role (optional)</Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="e.g., Lawyer, Judge, Researcher"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={loading}
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Join Waitlist
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
                <p className="text-muted-foreground">
                  We've added you to our beta waitlist.
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-background rounded-lg border-2 border-purple-200 dark:border-purple-700">
                <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  #{position}
                </div>
                <p className="text-sm text-muted-foreground">Your position in line</p>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Check your email at <strong>{formData.email}</strong> for confirmation and updates!
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>📧 We're inviting users weekly</p>
                <p>⚡ You'll receive an email when your invitation is ready</p>
                <p>🎁 Beta users get exclusive early adopter perks</p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
