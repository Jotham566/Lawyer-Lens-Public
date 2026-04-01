"use client";

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

interface UseScrollAnimationOptions {
  /** Intersection threshold (0-1). Default 0.15 */
  threshold?: number;
  /** Only animate once. Default true */
  once?: boolean;
  /** Root margin for early trigger. Default "0px 0px -60px 0px" */
  rootMargin?: string;
}

/**
 * Hook that returns a ref and animation state for scroll-reveal.
 *
 * VISIBLE-FIRST model:
 * - SSR and initial render: content is fully visible (no flash of blank)
 * - After hydration: elements below the fold get a subtle entrance animation
 * - Elements already in the viewport on load stay visible (no flicker)
 * - Respects prefers-reduced-motion
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0.15, once = true, rootMargin = "0px 0px -60px 0px" } = options;
  const ref = useRef<T | null>(null);

  // Compute initial state: visible by default (SSR-safe)
  const [isVisible, setIsVisible] = useState(true);
  const hasSetup = useRef(false);

  const reveal = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Prevent double-setup on the same mount cycle
    if (hasSetup.current) return;
    hasSetup.current = true;

    // Respect reduced motion — keep everything visible
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Check if element is already in the viewport on mount
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight + 60 && rect.bottom > 0;

    if (inViewport) {
      // Already visible on load — don't animate
      return;
    }

    // Element is below the fold — use a microtask to batch the state change
    // after the effect completes (avoids React Compiler sync setState warning)
    queueMicrotask(hide);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          if (once) observer.unobserve(el);
        } else if (!once) {
          hide();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      // Reset setup flag on cleanup so re-mounts work correctly
      // (e.g., navigating away and back via client-side routing)
      hasSetup.current = false;
    };
  }, [threshold, once, rootMargin, reveal, hide]);

  return [ref, isVisible];
}

/**
 * Returns a className string for scroll-triggered animations.
 * Combine with useScrollAnimation hook.
 */
export function scrollRevealClass(
  isVisible: boolean,
  variant: "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale-in" = "fade-up",
  delay: number = 0
): string {
  const base = "transition-all duration-500 ease-out";
  const delayClass = delay > 0 ? `delay-[${delay}ms]` : "";

  const hidden: Record<string, string> = {
    "fade-up": "opacity-0 translate-y-4",
    "fade-in": "opacity-0",
    "fade-left": "opacity-0 -translate-x-4",
    "fade-right": "opacity-0 translate-x-4",
    "scale-in": "opacity-0 scale-[0.98]",
  };

  const visible = "opacity-100 translate-y-0 translate-x-0 scale-100";

  return `${base} ${delayClass} ${isVisible ? visible : hidden[variant]}`;
}
