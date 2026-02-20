"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getUserFriendlyError } from "@/lib/api/client";
import { useAuth, useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

interface PaymentMethod {
  id: string;
  type: "mobile_money" | "card";
  is_default: boolean;
  provider: string;
  last_four: string;
  expires_at?: string;
  phone_number?: string;
}

export default function PaymentMethodsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMethodType, setNewMethodType] = useState<"mobile_money" | "card">("mobile_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("mtn");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    fetchPaymentMethods();
  }, [isAuthenticated]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (err) {
      setError("Failed to load payment methods");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMethod(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newMethodType,
          phone_number: newMethodType === "mobile_money" ? phoneNumber : undefined,
          provider: newMethodType === "mobile_money" ? mobileProvider : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add payment method");
      }

      // If card, redirect to payment provider for card entry
      const data = await response.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      // Refresh payment methods list
      await fetchPaymentMethods();
      setShowAddDialog(false);
      setPhoneNumber("");
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to add payment method"));
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`/api/billing/payment-methods/${methodId}/default`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to set default payment method");
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to update payment method"));
    }
  };

  const handleDelete = async (methodId: string) => {
    try {
      const response = await fetch(`/api/billing/payment-methods/${methodId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete payment method");
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to delete payment method"));
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "mobile_money":
        return <Smartphone className="h-5 w-5 text-blue-600" />;
      case "card":
        return <CreditCard className="h-5 w-5 text-slate-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-slate-600" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "mtn":
        return "MTN Mobile Money";
      case "airtel":
        return "Airtel Money";
      case "visa":
        return "Visa";
      case "mastercard":
        return "Mastercard";
      default:
        return provider;
    }
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoading message="Redirecting to login..." />;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-48 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Link href="/billing" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Payment Methods</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your payment methods for subscriptions and billing
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddMethod}>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a new payment method for your subscription
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <RadioGroup
                    value={newMethodType}
                    onValueChange={(value) => setNewMethodType(value as "mobile_money" | "card")}
                    className="space-y-3"
                  >
                    <div className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${newMethodType === "mobile_money" ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                      <RadioGroupItem value="mobile_money" id="add-mobile" />
                      <Label htmlFor="add-mobile" className="flex items-center gap-3 cursor-pointer">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Mobile Money</p>
                          <p className="text-sm text-slate-500">MTN or Airtel Money</p>
                        </div>
                      </Label>
                    </div>

                    <div className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${newMethodType === "card" ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                      <RadioGroupItem value="card" id="add-card" />
                      <Label htmlFor="add-card" className="flex items-center gap-3 cursor-pointer">
                        <CreditCard className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-slate-500">Visa or Mastercard</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {newMethodType === "mobile_money" && (
                    <div className="space-y-4">
                      <div>
                        <Label>Provider</Label>
                        <RadioGroup
                          value={mobileProvider}
                          onValueChange={setMobileProvider}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mtn" id="prov-mtn" />
                            <Label htmlFor="prov-mtn" className="cursor-pointer">MTN</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="airtel" id="prov-airtel" />
                            <Label htmlFor="prov-airtel" className="cursor-pointer">Airtel</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor="add-phone">Phone Number</Label>
                        <Input
                          id="add-phone"
                          type="tel"
                          placeholder="e.g., 256771234567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {newMethodType === "card" && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      You&apos;ll be redirected to securely enter your card details.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingMethod || (newMethodType === "mobile_money" && !phoneNumber)}
                  >
                    {isAddingMethod ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Method"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Payment Methods</CardTitle>
          <CardDescription>
            Your default payment method will be used for subscription renewals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No payment methods added yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${method.is_default ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
                >
                  <div className="flex items-center gap-4">
                    {getMethodIcon(method.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getProviderName(method.provider)}</span>
                        {method.is_default && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {method.type === "mobile_money"
                          ? `${method.phone_number?.slice(0, 6)}****${method.phone_number?.slice(-2)}`
                          : `•••• ${method.last_four}`}
                        {method.expires_at && ` • Expires ${method.expires_at}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this payment method? This action cannot be undone.
                            {method.is_default && (
                              <span className="block mt-2 text-amber-600">
                                This is your default payment method. You&apos;ll need to set another method as default.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(method.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About Payment Security</h3>
        <p className="text-sm text-slate-500">
          Your payment information is securely processed by Flutterwave. We never store your full card
          numbers or mobile money PINs. All transactions are encrypted and comply with PCI-DSS standards.
        </p>
      </div>
    </div>
  );
}
