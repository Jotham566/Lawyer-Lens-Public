"use client";

import { useState, Suspense } from "react";
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
} from "lucide-react";
import Link from "next/link";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan");
  const annual = searchParams.get("annual") === "true";

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("mtn");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamSeats, setTeamSeats] = useState(1);

  const plan = planId ? planDetails[planId] : null;

  if (!plan) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Plan</h2>
          <p className="text-slate-500 mb-6">The selected plan is not valid.</p>
          <Link href="/billing/plans">
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
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_interval: annual ? "yearly" : "monthly",
          payment_method: paymentMethod,
          phone_number: paymentMethod === "mobile_money" ? phoneNumber : undefined,
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
        <Link href="/billing/plans" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Complete Your Upgrade</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          You&apos;re upgrading to the {plan.name} plan
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
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
                >
                  <div className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "mobile_money" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Label htmlFor="mobile_money" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-slate-500">MTN, Airtel, or other providers</p>
                      </div>
                    </Label>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Recommended</Badge>
                  </div>

                  <div className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-slate-500">Visa, Mastercard, or other cards</p>
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
                        onValueChange={setMobileProvider}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mtn" id="mtn" />
                          <Label htmlFor="mtn" className="cursor-pointer">MTN Mobile Money</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="airtel" id="airtel" />
                          <Label htmlFor="airtel" className="cursor-pointer">Airtel Money</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g., 256771234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Enter your mobile money number with country code (256)
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="text-center py-8 text-slate-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-400" />
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
                        <span className="text-slate-500">seats (1-10 users)</span>
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
                  disabled={isProcessing || (paymentMethod === "mobile_money" && !phoneNumber)}
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

          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-slate-500">
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
                <span className="text-slate-600">{plan.name} Plan</span>
                <span className="font-medium">${plan.price}/{plan.period}</span>
              </div>

              {plan.id === "team" && teamSeats > 1 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{teamSeats} seats</span>
                  <span>${plan.price} x {teamSeats}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-slate-500">
                <span>Billing Period</span>
                <span>{annual ? "Yearly" : "Monthly"}</span>
              </div>

              {annual && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Annual Discount (20%)</span>
                  <span>-${Math.round(plan.price * (plan.id === "team" ? teamSeats : 1) * 12 * 0.2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <div className="text-right">
                  <div>${calculatePrice()}/{annual ? "year" : "month"}</div>
                  <div className="text-sm font-normal text-slate-500">
                    UGX {(calculatePrice() * 3700).toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">What&apos;s included:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-slate-600 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 text-center">
              By completing this purchase, you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
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
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
