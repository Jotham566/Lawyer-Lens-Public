"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * Hook to manage focus restoration when a modal/dialog closes.
 * Stores the previously focused element and restores focus when the modal closes.
 *
 * @param isOpen - Whether the modal is open
 * @returns Object with methods for managing focus
 */
export function useFocusRestore(isOpen: boolean) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store the currently focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
    } else if (previouslyFocusedRef.current) {
      // Restore focus when modal closes
      // Use setTimeout to ensure the modal has fully closed
      setTimeout(() => {
        previouslyFocusedRef.current?.focus();
        previouslyFocusedRef.current = null;
      }, 0);
    }
  }, [isOpen]);
}

/**
 * Hook to trap focus within a container.
 * Useful for custom modals or popovers that don't use Radix UI.
 *
 * @param containerRef - Ref to the container element
 * @param isActive - Whether focus trapping is active
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => el.offsetParent !== null); // Only visible elements
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first focusable element when trap becomes active
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, isActive]);
}

/**
 * Hook for managing focus on a specific element.
 * Useful for focusing an input when a component mounts or state changes.
 *
 * @returns Ref to attach to the element and a function to focus it
 */
export function useFocusRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  const focusAndSelect = useCallback(() => {
    if (ref.current) {
      ref.current.focus();
      if (ref.current instanceof HTMLInputElement || ref.current instanceof HTMLTextAreaElement) {
        ref.current.select();
      }
    }
  }, []);

  return { ref, focus, focusAndSelect };
}

/**
 * Hook to skip to main content (for accessibility)
 * Returns a handler and component for the skip link
 */
export function useSkipToMain(mainContentId: string = "main-content") {
  const skipToMain = useCallback(() => {
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    }
  }, [mainContentId]);

  return skipToMain;
}
