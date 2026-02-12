"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";

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
  const [wasOffline, setWasOffline] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearWasOfflineTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleStatusChange = () => {
      const online = navigator.onLine;
      if (online) {
        setWasOffline(true);
        clearWasOfflineTimeout();
        timeoutRef.current = window.setTimeout(() => setWasOffline(false), 3000);
      } else {
        setWasOffline(false);
        clearWasOfflineTimeout();
      }
      onStoreChange();
    };

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
      clearWasOfflineTimeout();
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  }, []);

  const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  return { isOnline, wasOffline, isHydrated };
}
