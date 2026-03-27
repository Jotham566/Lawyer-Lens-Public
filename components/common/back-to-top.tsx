"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "Back to Top" button that appears after scrolling down.
 * Works with any scrollable container — auto-detects the main
 * scrollable element (either <main> or the dashboard content area).
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  const getScrollContainer = useCallback((): HTMLElement | null => {
    // Try the dashboard main content area first
    const dashboardMain = document.querySelector("main[role='main']") as HTMLElement;
    if (dashboardMain && dashboardMain.scrollHeight > dashboardMain.clientHeight) {
      return dashboardMain;
    }
    // Fallback to any main with overflow-auto
    const anyMain = document.querySelector("main.overflow-auto") as HTMLElement;
    if (anyMain) return anyMain;
    // Last resort: document scrolling element
    return document.documentElement;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const container = getScrollContainer();
      if (!container) return;
      const scrollTop = container === document.documentElement
        ? window.scrollY
        : container.scrollTop;
      setVisible(scrollTop > 400);
    };

    // Listen on both window and all main elements
    const container = getScrollContainer();
    if (container && container !== document.documentElement) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (container && container !== document.documentElement) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [getScrollContainer]);

  const scrollToTop = () => {
    const container = getScrollContainer();
    if (container && container !== document.documentElement) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center",
        "rounded-full bg-primary text-primary-foreground shadow-floating",
        "ll-transition hover:scale-110 hover:shadow-lg",
        "lg:bottom-8 lg:right-8 lg:h-11 lg:w-11",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="h-4 w-4 lg:h-5 lg:w-5" />
    </button>
  );
}
