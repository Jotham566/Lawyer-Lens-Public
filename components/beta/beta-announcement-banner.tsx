"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BetaAnnouncementBannerProps {
  onJoinClick: () => void;
}

export function BetaAnnouncementBanner({ onJoinClick }: BetaAnnouncementBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("beta-banner-dismissed") !== "true";
  });

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (!isVisible) {
      root.style.setProperty("--landing-beta-banner-height", "0px");
      return () => {
        root.style.removeProperty("--landing-beta-banner-height");
      };
    }

    const updateHeight = () => {
      const height = bannerRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--landing-beta-banner-height", `${height}px`);
    };

    updateHeight();

    const observer =
      typeof ResizeObserver !== "undefined" && bannerRef.current
        ? new ResizeObserver(updateHeight)
        : null;

    if (observer && bannerRef.current) {
      observer.observe(bannerRef.current);
    } else {
      window.addEventListener("resize", updateHeight);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeight);
      root.style.removeProperty("--landing-beta-banner-height");
    };
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("beta-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      ref={bannerRef}
      className={cn(
        "relative z-40",
        "border-b border-border/60 bg-secondary/50",
        "transition-all duration-200"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles
              className="h-5 w-5 text-primary flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                <span className="hidden sm:inline">Law Lens Uganda is in Private Beta</span>
                <span className="sm:hidden">Private Beta</span>
              </p>
              <p className="hidden md:block text-xs text-muted-foreground">
                Join the waitlist for early access & exclusive perks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={onJoinClick}
              size="sm"
              variant="default"
              className="text-xs sm:text-sm"
            >
              Join Waitlist
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
