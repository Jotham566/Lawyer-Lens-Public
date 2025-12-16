"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Check,
  X,
  Zap,
  Crown,
  Users,
  Building2,
  ArrowLeft,
  Sparkles,
  Shield,
  HeadphonesIcon,
} from "lucide-react";
import Link from "next/link";

interface PlanFeature {
  name: string;
  free: boolean | string;
  professional: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { name: "AI-powered legal queries", free: "50/month", professional: "500/month", team: "2,000/month", enterprise: "Unlimited" },
  { name: "Document search", free: true, professional: true, team: true, enterprise: true },
  { name: "Deep legal research", free: false, professional: "10/month", team: "50/month", enterprise: "Unlimited" },
  { name: "Contract drafting", free: false, professional: "5/month", team: "25/month", enterprise: "Unlimited" },
  { name: "Contract analysis", free: false, professional: "10/month", team: "50/month", enterprise: "Unlimited" },
  { name: "Document storage", free: "1 GB", professional: "10 GB", team: "50 GB", enterprise: "Unlimited" },
  { name: "API access", free: false, professional: "1,000/month", team: "10,000/month", enterprise: "Unlimited" },
  { name: "Team members", free: "1", professional: "1", team: "Up to 10", enterprise: "Unlimited" },
  { name: "Priority support", free: false, professional: true, team: true, enterprise: true },
  { name: "Custom integrations", free: false, professional: false, team: false, enterprise: true },
  { name: "Dedicated success manager", free: false, professional: false, team: false, enterprise: true },
  { name: "SLA guarantee", free: false, professional: false, team: "99.5%", enterprise: "99.9%" },
];

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Get started with basic legal research",
    price: 0,
    period: "forever",
    icon: <Zap className="h-6 w-6" />,
    highlight: false,
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For individual legal professionals",
    price: 25,
    period: "per month",
    icon: <Crown className="h-6 w-6" />,
    highlight: true,
    cta: "Upgrade to Professional",
    disabled: false,
  },
  {
    id: "team",
    name: "Team",
    description: "For law firms and legal departments",
    price: 30,
    period: "per user/month",
    icon: <Users className="h-6 w-6" />,
    highlight: false,
    cta: "Upgrade to Team",
    disabled: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: null,
    period: "Custom pricing",
    icon: <Building2 className="h-6 w-6" />,
    highlight: false,
    cta: "Contact Sales",
    disabled: false,
  },
];

export default function PlansPage() {
  const [annual, setAnnual] = useState(false);

  const getPrice = (price: number | null) => {
    if (price === null) return "Custom";
    if (price === 0) return "Free";
    const annualPrice = Math.round(price * 12 * 0.8); // 20% discount for annual
    return annual ? `$${annualPrice}/year` : `$${price}/mo`;
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === "enterprise") {
      // Open contact form or redirect to contact page
      window.location.href = "/contact?subject=enterprise";
      return;
    }
    // Redirect to checkout with plan and billing preference
    window.location.href = `/billing/checkout?plan=${planId}&annual=${annual}`;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link href="/billing" className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full power of Legal Intelligence with a plan that fits your needs
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <Label htmlFor="billing-toggle" className={!annual ? "font-semibold" : "text-muted-foreground"}>
          Monthly
        </Label>
        <Switch id="billing-toggle" checked={annual} onCheckedChange={setAnnual} />
        <Label htmlFor="billing-toggle" className={annual ? "font-semibold" : "text-muted-foreground"}>
          Annual
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Save 20%
          </Badge>
        </Label>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.highlight
                ? "border-primary border-2 shadow-lg scale-105"
                : "border-border"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${plan.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {plan.icon}
                </div>
                <CardTitle>{plan.name}</CardTitle>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">{getPrice(plan.price)}</span>
                {plan.price !== null && plan.price > 0 && (
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                )}
              </div>
              <ul className="space-y-3">
                {features.slice(0, 5).map((feature) => {
                  const value = feature[plan.id as keyof PlanFeature];
                  return (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      {value ? (
                        <Check className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={!value ? "text-muted-foreground/70" : ""}>
                        {feature.name}
                        {typeof value === "string" && (
                          <span className="text-muted-foreground ml-1">({value})</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlight ? "default" : "outline"}
                disabled={plan.disabled}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Full Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-medium">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-4 px-4 font-medium">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.name} className="border-b border-border">
                  <td className="py-4 px-4 text-muted-foreground">{feature.name}</td>
                  {plans.map((plan) => {
                    const value = feature[plan.id as keyof PlanFeature];
                    return (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {value === true ? (
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        ) : value === false ? (
                          <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                        ) : (
                          <span className="text-sm">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-muted rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Trusted by Legal Professionals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Secure & Compliant</h3>
            <p className="text-muted-foreground text-sm">
              Bank-level encryption and data protection for your legal documents
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeadphonesIcon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Expert Support</h3>
            <p className="text-muted-foreground text-sm">
              Get help from our team of legal tech specialists
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Cancel Anytime</h3>
            <p className="text-muted-foreground text-sm">
              No long-term contracts. Upgrade, downgrade, or cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* FAQ or Contact */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
        <p className="text-muted-foreground mb-6">
          Our team is here to help you find the right plan for your needs
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/help">
            <Button variant="outline">View FAQ</Button>
          </Link>
          <Link href="/contact">
            <Button>Contact Sales</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
