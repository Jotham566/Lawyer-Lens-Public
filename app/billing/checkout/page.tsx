"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import {
  validateUgandaPhone,
  detectProvider,
  getPlaceholder,
  formatPhoneDisplay,
  type MobileProvider,
} from "@/lib/utils/phone-validation";

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

const planDetails: Record<string, PlanDetails> = {
  professional: {
    id: "professional",
    name: "Professional",
    price: 25,
    period: "month",
    features: [
      "500 AI queries per month",
      "10 deep research sessions",
      "5 contract drafts",
      "10 GB storage",
      "Priority support",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 30,
    period: "user/month",
    features: [
      "2,000 AI queries per month",
      "50 deep research sessions",
      "25 contract drafts",
      "50 GB storage",
      "Up to 10 team members",
      "Priority support",
    ],
  },
};

type PaymentMethod = "mobile_money" | "card";

function CheckoutContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan");
  const annual = searchParams.get("annual") === "true";

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>("mtn");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);
  const [teamSeats, setTeamSeats] = useState(1);

  const plan = planId ? planDetails[planId] : null;

  // Validate phone number and auto-detect provider
  const validatePhone = useCallback((phone: string) => {
    if (!phone) {
      setPhoneError(null);
      setPhoneValid(false);
      return;
    }

    const result = validateUgandaPhone(phone);
    if (result.isValid) {
      setPhoneError(null);
      setPhoneValid(true);
      // Auto-detect and set provider
      if (result.provider !== "unknown") {
        setMobileProvider(result.provider);
      }
    } else {
      setPhoneError(result.error || "Invalid phone number");
      setPhoneValid(false);
    }
  }, []);

  // Debounced phone validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validatePhone(phoneNumber);
    }, 300);
    return () => clearTimeout(timer);
  }, [phoneNumber, validatePhone]);

  // Auto-detect provider on phone change
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    // Quick provider detection for immediate UI feedback
    const detected = detectProvider(value);
    if (detected !== "unknown") {
      setMobileProvider(detected);
    }
  };

  if (authLoading) {
    return <PageLoading message="Loading checkout..." />;
  }

  if (!plan) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Plan</h2>
          <p className="text-muted-foreground mb-6">The selected plan is not valid.</p>
          <Link href="/pricing">
            <Button>View Available Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  const calculatePrice = () => {
    let basePrice = plan.price;
    if (plan.id === "team") {
      basePrice = plan.price * teamSeats;
    }
    if (annual) {
      return Math.round(basePrice * 12 * 0.8); // 20% discount
    }
    return basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number for mobile money
    if (paymentMethod === "mobile_money") {
      const validation = validateUgandaPhone(phoneNumber);
      if (!validation.isValid) {
        setPhoneError(validation.error || "Invalid phone number");
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Get formatted phone number for API
      const formattedPhone = paymentMethod === "mobile_money"
        ? validateUgandaPhone(phoneNumber).formatted
        : undefined;

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_interval: annual ? "yearly" : "monthly",
          payment_method: paymentMethod,
          phone_number: formattedPhone,
          mobile_provider: paymentMethod === "mobile_money" ? mobileProvider : undefined,
          seats: plan.id === "team" ? teamSeats : 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Payment failed");
      }

      const data = await response.json();

      // Redirect to payment provider or success page
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        router.push("/billing?success=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Link href="/pricing" className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </Link>
        <h1 className="text-3xl font-bold">Complete Your Upgrade</h1>
        <p className="text-muted-foreground mt-1">
          You&apos;re upgrading to the {plan.name} plan
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} aria-label="Payment form">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you&apos;d like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  className="space-y-4"
                  aria-label="Select payment method"
                >
                  <div className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "mobile_money" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}>
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Label htmlFor="mobile_money" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-muted-foreground">MTN, Airtel, or other providers</p>
                      </div>
                    </Label>
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Recommended</Badge>
                  </div>

                  <div className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">Visa, Mastercard, or other cards</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Separator />

                {paymentMethod === "mobile_money" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider">Mobile Provider</Label>
                      <RadioGroup
                        value={mobileProvider}
                        onValueChange={(v) => setMobileProvider(v as MobileProvider)}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mtn" id="mtn" />
                          <Label htmlFor="mtn" className="cursor-pointer">
                            <span className="flex items-center gap-2">
                              MTN Mobile Money
                              <span className="text-xs text-muted-foreground">(077x, 078x)</span>
                            </span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="airtel" id="airtel" />
                          <Label htmlFor="airtel" className="cursor-pointer">
                            <span className="flex items-center gap-2">
                              Airtel Money
                              <span className="text-xs text-muted-foreground">(070x, 075x)</span>
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={getPlaceholder(mobileProvider)}
                          value={phoneNumber}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className={`pr-10 ${
                            phoneError
                              ? "border-red-500 focus-visible:ring-red-500"
                              : phoneValid
                              ? "border-green-500 focus-visible:ring-green-500"
                              : ""
                          }`}
                          required
                          aria-invalid={phoneError ? "true" : "false"}
                          aria-describedby="phone-description phone-error"
                        />
                        {phoneValid && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
                        )}
                        {phoneError && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                        )}
                      </div>
                      {phoneError ? (
                        <p id="phone-error" className="text-xs text-red-500 dark:text-red-400 mt-1" role="alert" aria-live="polite">{phoneError}</p>
                      ) : phoneValid ? (
                        <p id="phone-description" className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {formatPhoneDisplay(phoneNumber)} - {mobileProvider === "mtn" ? "MTN" : "Airtel"} detected
                        </p>
                      ) : (
                        <p id="phone-description" className="text-xs text-muted-foreground mt-1">
                          Enter your Uganda mobile number (e.g., 772123456 or 0772123456)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>You&apos;ll be redirected to our secure payment partner to enter your card details.</p>
                  </div>
                )}

                {plan.id === "team" && (
                  <>
                    <Separator />
                    <div>
                      <Label htmlFor="seats">Team Size</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          id="seats"
                          type="number"
                          min={1}
                          max={10}
                          value={teamSeats}
                          onChange={(e) => setTeamSeats(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">seats (1-10 users)</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || (paymentMethod === "mobile_money" && !phoneValid)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay UGX {(calculatePrice() * 3700).toLocaleString()}</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Secure payment
            </div>
            <div>Powered by Flutterwave</div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{plan.name} Plan</span>
                <span className="font-medium">${plan.price}/{plan.period}</span>
              </div>

              {plan.id === "team" && teamSeats > 1 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{teamSeats} seats</span>
                  <span>${plan.price} x {teamSeats}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Billing Period</span>
                <span>{annual ? "Yearly" : "Monthly"}</span>
              </div>

              {annual && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Annual Discount (20%)</span>
                  <span>-${Math.round(plan.price * (plan.id === "team" ? teamSeats : 1) * 12 * 0.2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <div className="text-right">
                  <div>${calculatePrice()}/{annual ? "year" : "month"}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    UGX {(calculatePrice() * 3700).toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium" id="features-heading">What&apos;s included:</p>
                <ul className="space-y-1" aria-labelledby="features-heading" role="list">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              By completing this purchase, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              You can cancel anytime from your billing settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
