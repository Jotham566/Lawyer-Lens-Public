"use client";

import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { cn } from "@/lib/utils";

/**
 * Banner that appears when the user goes offline
 * Shows "back online" message briefly when connectivity is restored
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Don't render anything if online and wasn't just offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform",
        "flex items-center gap-2 rounded-full px-4 py-2 shadow-lg",
        "text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white animate-in fade-in slide-in-from-bottom-4"
          : "bg-destructive text-destructive-foreground animate-in fade-in slide-in-from-bottom-4"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>You&apos;re offline. Some features may be unavailable.</span>
        </>
      )}
    </div>
  );
}
