"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

interface PaymentMethod {
  id: string;
  type: string;
  isDefault: boolean;
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  phoneNumber?: string;
}

export default function PaymentMethodsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<"card" | "mtn" | "airtel">("card");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    try {
      const response = await fetch("/api/billing/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/billing/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete payment method:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefault(id);
    try {
      const response = await fetch(`/api/billing/payment-methods/${id}/default`, {
        method: "POST",
      });
      if (response.ok) {
        setPaymentMethods((prev) =>
          prev.map((pm) => ({
            ...pm,
            isDefault: pm.id === id,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to set default:", error);
    } finally {
      setSettingDefault(null);
    }
  };

  const handleAddMethod = async () => {
    setAdding(true);
    try {
      if (newMethodType === "card") {
        // For card payments, redirect to payment provider
        const response = await fetch("/api/billing/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "card" }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          }
        }
      } else {
        // For mobile money, save the phone number
        const response = await fetch("/api/billing/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newMethodType,
            phoneNumber,
          }),
        });
        if (response.ok) {
          await fetchPaymentMethods();
          setAddDialogOpen(false);
          setPhoneNumber("");
        }
      }
    } catch (error) {
      console.error("Failed to add payment method:", error);
    } finally {
      setAdding(false);
    }
  };

  const getMethodIcon = (type: string) => {
    if (type === "card") return <CreditCard className="h-5 w-5" />;
    return <Smartphone className="h-5 w-5" />;
  };

  const getMethodLabel = (pm: PaymentMethod) => {
    if (pm.type === "card" && pm.brand) {
      return `${pm.brand} •••• ${pm.lastFour}`;
    }
    if (pm.type === "mtn") {
      return `MTN Mobile Money ${pm.phoneNumber ? `(${pm.phoneNumber})` : ""}`;
    }
    if (pm.type === "airtel") {
      return `Airtel Money ${pm.phoneNumber ? `(${pm.phoneNumber})` : ""}`;
    }
    return pm.type;
  };

  if (authLoading) {
    return <PageLoading message="Loading payment methods..." />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings/billing")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Payment Methods</h2>
          <p className="text-sm text-muted-foreground">
            Manage your payment methods
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Choose a payment method to add to your account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <RadioGroup
                value={newMethodType}
                onValueChange={(v) => setNewMethodType(v as typeof newMethodType)}
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="card" id="add-card" />
                  <Label htmlFor="add-card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-5 w-5" />
                    Credit/Debit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="mtn" id="add-mtn" />
                  <Label htmlFor="add-mtn" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="h-5 w-5 text-yellow-500" />
                    MTN Mobile Money
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="airtel" id="add-airtel" />
                  <Label htmlFor="add-airtel" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="h-5 w-5 text-red-500" />
                    Airtel Money
                  </Label>
                </div>
              </RadioGroup>

              {(newMethodType === "mtn" || newMethodType === "airtel") && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={newMethodType === "mtn" ? "0771234567" : "0701234567"}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleAddMethod}
                disabled={adding || ((newMethodType === "mtn" || newMethodType === "airtel") && !phoneNumber)}
                className="w-full"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : newMethodType === "card" ? (
                  "Continue to add card"
                ) : (
                  "Add payment method"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Payment Methods</CardTitle>
          <CardDescription>
            Payment methods used for subscriptions and purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment methods</p>
              <p className="text-sm">Add a payment method to make purchases</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getMethodIcon(pm.type)}
                    <div>
                      <p className="font-medium">{getMethodLabel(pm)}</p>
                      {pm.type === "card" && pm.expiryMonth && pm.expiryYear && (
                        <p className="text-sm text-muted-foreground">
                          Expires {pm.expiryMonth}/{pm.expiryYear}
                        </p>
                      )}
                    </div>
                    {pm.isDefault && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!pm.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(pm.id)}
                        disabled={settingDefault === pm.id}
                      >
                        {settingDefault === pm.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Set Default"
                        )}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pm.isDefault || deleting === pm.id}
                        >
                          {deleting === pm.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This payment method will be removed from your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(pm.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div>
  );
}
