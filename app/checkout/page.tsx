"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Smartphone, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { PricingTier } from "@/components/pricing";

const TIER_NAMES: Record<string, string> = {
  professional: "Professional",
  team: "Team",
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tierParam = searchParams.get("tier") || "professional";
  const billingParam = (searchParams.get("billing") || "monthly") as "monthly" | "annual";
  const seatsParam = parseInt(searchParams.get("seats") || "1", 10);

  const [tier, setTier] = useState<PricingTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mtn" | "airtel">("card");
  const [seats, setSeats] = useState(seatsParam);
  const [billingCycle] = useState(billingParam);

  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTier() {
      try {
        const response = await fetch("/api/billing/pricing");
        if (response.ok) {
          const data = await response.json();
          const selectedTier = data.tiers.find(
            (t: PricingTier) => t.tier === tierParam
          );
          if (selectedTier) {
            setTier(selectedTier);
            if (selectedTier.minSeats > seats) {
              setSeats(selectedTier.minSeats);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch tier:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTier();
  }, [tierParam, seats]);

  const calculateTotal = () => {
    if (!tier) return 0;
    const price = billingCycle === "monthly" ? tier.monthlyPrice : tier.annualPrice;
    const quantity = tier.isPerSeat ? seats : 1;
    const monthlyTotal = price * quantity;
    return billingCycle === "annual" ? monthlyTotal * 12 : monthlyTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate phone number for mobile money
      if (paymentMethod === "mtn" || paymentMethod === "airtel") {
        if (!phoneNumber || phoneNumber.length < 9) {
          setError("Please enter a valid phone number");
          setSubmitting(false);
          return;
        }
      }

      // Create checkout session
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierParam,
          billingCycle,
          seats: tier?.isPerSeat ? seats : 1,
          paymentMethod,
          phoneNumber: paymentMethod !== "card" ? phoneNumber : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to payment provider
        window.location.href = data.checkoutUrl;
      } else if (data.status === "pending") {
        // Mobile money - redirect to pending page
        router.push(`/billing/pending?reference=${data.reference}`);
      } else {
        throw new Error("Invalid checkout response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Plan not found</CardTitle>
            <CardDescription>
              The selected plan could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/pricing")}>
              View Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = calculateTotal();
  const monthlyPrice = billingCycle === "monthly" ? tier.monthlyPrice : tier.annualPrice;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/pricing")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Complete your purchase</CardTitle>
                <CardDescription>
                  Subscribe to {TIER_NAMES[tier.tier] || tier.name} plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Seats selector for team plans */}
                  {tier.isPerSeat && (
                    <div className="space-y-2">
                      <Label htmlFor="seats">Number of seats</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="seats"
                          type="number"
                          min={tier.minSeats}
                          max={100}
                          value={seats}
                          onChange={(e) => setSeats(parseInt(e.target.value, 10) || tier.minSeats)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          Minimum {tier.minSeats} seats
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <Label>Payment method</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
                      className="grid gap-4"
                    >
                      <div className="flex items-center space-x-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Credit/Debit Card</div>
                            <div className="text-sm text-muted-foreground">
                              Visa, Mastercard
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="mtn" id="mtn" />
                        <Label htmlFor="mtn" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-yellow-500" />
                          <div>
                            <div className="font-medium">MTN Mobile Money</div>
                            <div className="text-sm text-muted-foreground">
                              Pay with MTN MoMo
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="airtel" id="airtel" />
                        <Label htmlFor="airtel" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-medium">Airtel Money</div>
                            <div className="text-sm text-muted-foreground">
                              Pay with Airtel Money
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Phone number for mobile money */}
                  {(paymentMethod === "mtn" || paymentMethod === "airtel") && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={paymentMethod === "mtn" ? "0771234567" : "0701234567"}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        {paymentMethod === "mtn"
                          ? "Enter your MTN number (077x or 078x)"
                          : "Enter your Airtel number (070x or 075x)"}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Pay ${total.toFixed(2)}</>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                    {tier.trialDays > 0 && (
                      <> Your {tier.trialDays}-day free trial starts today.</>
                    )}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{TIER_NAMES[tier.tier] || tier.name} Plan</span>
                  <span>${monthlyPrice}/mo</span>
                </div>
                {tier.isPerSeat && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{seats} seats</span>
                    <span>x ${monthlyPrice}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Billing</span>
                  <span className="capitalize">{billingCycle}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {billingCycle === "annual" && (
                  <p className="text-sm text-green-600">
                    You save ${((tier.monthlyPrice - tier.annualPrice) * (tier.isPerSeat ? seats : 1) * 12).toFixed(2)} per year
                  </p>
                )}

                {tier.trialDays > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      {tier.trialDays}-day free trial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You won&apos;t be charged until the trial ends
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Secure payment via Flutterwave</span>
                  </div>
                  <p className="text-muted-foreground">
                    Cancel anytime. No hidden fees.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
