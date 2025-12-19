/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that throttles a value, only updating at most once per interval.
 * Useful for streaming content to reduce re-renders.
 */
export function useThrottledValue<T>(value: T, intervalMs: number = 50): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef<T>(value);

  useEffect(() => {
    latestValue.current = value;
    const now = Date.now();
    const timeSinceLastUpdate = lastUpdate.current === 0 ? Number.POSITIVE_INFINITY : now - lastUpdate.current;

    if (timeSinceLastUpdate >= intervalMs) {
      // Enough time has passed, update immediately
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      // Schedule an update for the remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(latestValue.current);
        lastUpdate.current = Date.now();
      }, intervalMs - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, intervalMs]);

  // When streaming stops (value stabilizes), immediately use final value
  useEffect(() => {
    return () => {
      // On unmount or when stream ends, ensure final value is shown
      setThrottledValue(latestValue.current);
    };
  }, []);

  return throttledValue;
}

/**
 * Hook that provides a throttled setter function.
 * Useful for reducing state updates during high-frequency events.
 */
export function useThrottledState<T>(
  initialValue: T,
  intervalMs: number = 50
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const lastUpdate = useRef<number>(0);
  const pendingValue = useRef<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setThrottledState = useCallback((value: T) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    if (timeSinceLastUpdate >= intervalMs) {
      setState(value);
      lastUpdate.current = now;
      pendingValue.current = null;
    } else {
      pendingValue.current = value;

      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          if (pendingValue.current !== null) {
            setState(pendingValue.current);
            lastUpdate.current = Date.now();
            pendingValue.current = null;
          }
          timeoutRef.current = null;
        }, intervalMs - timeSinceLastUpdate);
      }
    }
  }, [intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setThrottledState];
}
