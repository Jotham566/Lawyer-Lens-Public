"use client";

import { useSkipToMain } from "@/lib/hooks";

interface SkipLinkProps {
  mainContentId?: string;
  children?: React.ReactNode;
}

/**
 * Skip to main content link for accessibility.
 * Appears when focused (via keyboard navigation) and allows users
 * to skip repetitive navigation elements.
 */
export function SkipLink({
  mainContentId = "main-content",
  children = "Skip to main content",
}: SkipLinkProps) {
  const skipToMain = useSkipToMain(mainContentId);

  return (
    <a
      href={`#${mainContentId}`}
      onClick={(e) => {
        e.preventDefault();
        skipToMain();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </a>
  );
}
