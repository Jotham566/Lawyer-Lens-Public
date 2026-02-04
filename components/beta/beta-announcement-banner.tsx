"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BetaAnnouncementBannerProps {
  onJoinClick: () => void;
}

export function BetaAnnouncementBanner({ onJoinClick }: BetaAnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Check if user has dismissed the banner in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("beta-banner-dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("beta-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-50",
        "border-b border-blue-500/50 bg-blue-50 dark:bg-blue-900/20",
        "transition-all duration-200"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles
              className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                <span className="hidden sm:inline">Law Lens is in Private Beta</span>
                <span className="sm:hidden">Private Beta</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 hidden md:block">
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
