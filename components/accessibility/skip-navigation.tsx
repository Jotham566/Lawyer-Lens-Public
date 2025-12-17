"use client";

import { cn } from "@/lib/utils";

interface SkipLink {
  id: string;
  label: string;
}

interface SkipNavigationProps {
  links?: SkipLink[];
  className?: string;
}

const DEFAULT_LINKS: SkipLink[] = [
  { id: "main-content", label: "Skip to main content" },
  { id: "main-navigation", label: "Skip to navigation" },
  { id: "search", label: "Skip to search" },
];

/**
 * SkipNavigation - Accessibility component for keyboard navigation
 *
 * Provides keyboard-accessible links that allow users to skip to main content
 * areas, particularly helpful for screen reader users and keyboard navigation.
 *
 * Links are visually hidden but become visible when focused.
 */
export function SkipNavigation({
  links = DEFAULT_LINKS,
  className,
}: SkipNavigationProps) {
  return (
    <nav
      aria-label="Skip navigation"
      className={cn(
        "fixed top-0 left-0 z-[100] flex gap-2 p-2",
        className
      )}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={cn(
            // Visually hidden by default
            "absolute -top-96 left-0",
            // Visible on focus
            "focus:top-2 focus:left-2 focus:relative",
            // Styling
            "bg-primary text-primary-foreground px-4 py-2 rounded-md",
            "text-sm font-medium shadow-lg",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all duration-200"
          )}
          onClick={(e) => {
            // Ensure the target element exists before scrolling
            const target = document.getElementById(link.id);
            if (target) {
              e.preventDefault();
              target.focus();
              target.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * useAnnounce - Hook for screen reader announcements
 *
 * Creates a live region that announces messages to screen readers.
 * Useful for dynamic content changes and notifications.
 */
export function useAnnounce() {
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    // Create or reuse announcement element
    let announcer = document.getElementById("screen-reader-announcer");

    if (!announcer) {
      announcer = document.createElement("div");
      announcer.id = "screen-reader-announcer";
      announcer.setAttribute("aria-live", priority);
      announcer.setAttribute("aria-atomic", "true");
      announcer.className = "sr-only";
      document.body.appendChild(announcer);
    } else {
      announcer.setAttribute("aria-live", priority);
    }

    // Clear and set message with a small delay to ensure announcement
    announcer.textContent = "";
    setTimeout(() => {
      announcer!.textContent = message;
    }, 100);
  };

  return { announce };
}

/**
 * ScreenReaderAnnouncer - Component for live announcements
 */
export function ScreenReaderAnnouncer() {
  return (
    <>
      {/* Polite announcements (queued) */}
      <div
        id="sr-polite"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Assertive announcements (immediate) */}
      <div
        id="sr-assertive"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * FocusTrap - Traps focus within a container
 *
 * Useful for modals and dialogs to keep keyboard focus contained.
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab" || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  return { handleKeyDown };
}

/**
 * ReducedMotion - Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  return mediaQuery.matches;
}
