"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SeatInfo {
  used: number;
  total: number;
  pricePerSeat: number;
  billingCycle: "monthly" | "annual";
  canModify: boolean;
}

interface SeatManagementProps {
  seatInfo: SeatInfo;
  onUpdateSeats: (newTotal: number, proratedAmount: number) => Promise<void>;
}

export function SeatManagement({ seatInfo, onUpdateSeats }: SeatManagementProps) {
  const [open, setOpen] = useState(false);
  const [newTotal, setNewTotal] = useState(seatInfo.total);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = seatInfo.total - seatInfo.used;
  const usagePercent = (seatInfo.used / seatInfo.total) * 100;
  const seatDiff = newTotal - seatInfo.total;

  // Calculate prorated amount (simplified - actual calculation would come from backend)
  const daysRemaining = 15; // Would come from actual billing period
  const daysInPeriod = 30;
  const proratedFactor = daysRemaining / daysInPeriod;
  const proratedAmount = seatDiff * seatInfo.pricePerSeat * proratedFactor;

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);
    try {
      await onUpdateSeats(newTotal, proratedAmount);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update seats");
    } finally {
      setUpdating(false);
    }
  };

  const canDecrease = newTotal > seatInfo.used;
  const minSeats = Math.max(1, seatInfo.used);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seat Management
            </CardTitle>
            <CardDescription>
              Manage team seats for your organization
            </CardDescription>
          </div>
          {seatInfo.canModify && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Manage Seats
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adjust Team Seats</DialogTitle>
                  <DialogDescription>
                    Add or remove seats. Changes are prorated to your billing cycle.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Seat counter */}
                  <div className="flex items-center justify-center gap-6">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setNewTotal(Math.max(minSeats, newTotal - 1))}
                      disabled={newTotal <= minSeats}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                      <span className="text-5xl font-bold">{newTotal}</span>
                      <p className="text-sm text-muted-foreground mt-1">total seats</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setNewTotal(newTotal + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Current usage info */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current seats</span>
                      <span>{seatInfo.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seats in use</span>
                      <span>{seatInfo.used}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Change</span>
                      <span className={seatDiff > 0 ? "text-green-600" : seatDiff < 0 ? "text-amber-600" : ""}>
                        {seatDiff > 0 ? `+${seatDiff}` : seatDiff} seats
                      </span>
                    </div>
                    {seatDiff !== 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Per seat price</span>
                          <span>${seatInfo.pricePerSeat}/{seatInfo.billingCycle === "annual" ? "year" : "month"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span className="flex items-center gap-1">
                            Prorated {seatDiff > 0 ? "charge" : "credit"}
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Charges are calculated based on remaining days in your billing period.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </span>
                          <span className={seatDiff > 0 ? "text-green-600" : "text-amber-600"}>
                            {seatDiff > 0 ? "+" : "-"}${Math.abs(proratedAmount).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Warning for decreasing below usage */}
                  {!canDecrease && seatDiff < 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Cannot reduce below {seatInfo.used} seats while they are in use.
                        Remove team members first.
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={seatDiff === 0 || updating || (!canDecrease && seatDiff < 0)}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : seatDiff > 0 ? (
                      `Add ${seatDiff} Seat${seatDiff > 1 ? "s" : ""}`
                    ) : seatDiff < 0 ? (
                      `Remove ${Math.abs(seatDiff)} Seat${Math.abs(seatDiff) > 1 ? "s" : ""}`
                    ) : (
                      "No Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual seat display */}
        <div className="text-center">
          <div className="text-4xl font-bold">
            {seatInfo.used}
            <span className="text-2xl text-muted-foreground">/{seatInfo.total}</span>
          </div>
          <p className="text-sm text-muted-foreground">seats in use</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={usagePercent} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{seatInfo.used} used</span>
            <span>{available} available</span>
          </div>
        </div>

        {/* Seat status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-semibold text-green-600">{seatInfo.used}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Members</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-semibold text-blue-600">{available}</div>
            <p className="text-xs text-muted-foreground mt-1">Available Seats</p>
          </div>
        </div>

        {/* Price info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
          <span className="text-muted-foreground">Cost per seat</span>
          <span className="font-medium">
            ${seatInfo.pricePerSeat}/{seatInfo.billingCycle === "annual" ? "year" : "month"}
          </span>
        </div>

        {/* Warnings/Info */}
        {available === 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">All seats are in use</p>
              <p className="text-amber-600 mt-1">
                Add more seats to invite additional team members.
              </p>
            </div>
          </div>
        )}

        {available > 0 && available <= 2 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              You have {available} seat{available !== 1 ? "s" : ""} available for new team members.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar/overview
export function SeatUsageCompact({
  used,
  total,
  showLabel = true,
}: {
  used: number;
  total: number;
  showLabel?: boolean;
}) {
  const percent = (used / total) * 100;
  const isNearLimit = percent >= 80;
  const isAtLimit = used >= total;

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            Team Seats
          </span>
          <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}>
            {used}/{total}
          </Badge>
        </div>
      )}
      <Progress
        value={percent}
        className={`h-2 ${isAtLimit ? "bg-red-100" : isNearLimit ? "bg-amber-100" : ""}`}
      />
    </div>
  );
}

// Summary card for billing overview
export function SeatSummaryCard({
  used,
  total,
  pricePerSeat,
}: {
  used: number;
  total: number;
  pricePerSeat: number;
}) {
  const available = total - used;
  const monthlyTotal = total * pricePerSeat;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Team Seats</p>
              <p className="text-2xl font-bold">{used}/{total}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{available} available</p>
            <p className="text-sm text-muted-foreground">${monthlyTotal}/month total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
