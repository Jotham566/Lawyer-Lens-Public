"use client";

import { useState, useEffect, useCallback } from "react";

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // True if was offline and just came back online
  isHydrated: boolean; // True after initial client-side hydration
}

/**
 * Hook for detecting online/offline status
 *
 * @returns Current online status and whether user was previously offline
 */
export function useOnlineStatus(): OnlineStatus {
  // Start with true to prevent flash during SSR/hydration
  // The actual status will be set after hydration in useEffect
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    // Track that we just came back online (for showing "back online" message)
    setWasOffline(true);
    // Reset the "was offline" flag after a brief period
    setTimeout(() => setWasOffline(false), 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(false);
  }, []);

  useEffect(() => {
    // Set the actual online status after hydration
    setIsOnline(navigator.onLine);
    setIsHydrated(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, isHydrated };
}
