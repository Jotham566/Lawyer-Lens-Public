"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
              <div className="mx-auto w-12 h-12 bg-secondary/70 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-secondary-foreground" />
              </div>
              <DialogTitle className="text-center">Join the Beta Waitlist</DialogTitle>
              <DialogDescription className="text-center">
                Legal Intelligence is currently in private beta. Join our waitlist to get early access and exclusive perks!
              </DialogDescription>
            </DialogHeader>

            <Alert className="border border-border/60 bg-secondary/50">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong className="text-foreground">Beta users receive:</strong>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
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
              <div className="mx-auto w-16 h-16 bg-secondary/60 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-secondary-foreground" />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">You&apos;re on the list!</h3>
                <p className="text-muted-foreground">
                  We&apos;ve added you to our beta waitlist.
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-secondary/50 p-6">
                <div className="mb-2 text-5xl font-bold text-primary">
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
                <p>📧 We&apos;re inviting users weekly</p>
                <p>⚡ You&apos;ll receive an email when your invitation is ready</p>
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
