"use client";

import { useState, useEffect, useCallback } from "react";

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // True if was offline and just came back online
}

/**
 * Hook for detecting online/offline status
 *
 * @returns Current online status and whether user was previously offline
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  // Initialize with actual status (SSR-safe)
  useEffect(() => {
    setIsOnline(navigator.onLine);
  }, []);

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
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}
