/**
 * Tests for useOnlineStatus hook
 */

import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

describe("useOnlineStatus", () => {
  // Store original navigator.onLine
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    // Reset to online by default
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  it("should return isOnline as true initially (pre-hydration)", () => {
    const { result } = renderHook(() => useOnlineStatus());
    // Before useEffect runs, should default to true to prevent flash
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
    // After hydration
    expect(result.current.isHydrated).toBe(true);
  });

  it("should return isOnline as false when navigator.onLine is false after hydration", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    // After useEffect, should reflect actual status
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isHydrated).toBe(true);
  });

  it("should update isOnline when offline event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      // Simulate going offline
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("should update isOnline when online event fires", () => {
    // Start offline
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(false);

    act(() => {
      // Simulate coming back online
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("should set wasOffline to true when coming back online", () => {
    // Start offline
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      // Come back online
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.wasOffline).toBe(true);
  });

  it("should cleanup event listeners on unmount", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useOnlineStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
