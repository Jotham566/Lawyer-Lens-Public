"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  /** Height of the logo in pixels (default: 155) */
  height?: number;
}

export function Logo({ collapsed = false, className, height = 155 }: LogoProps) {
  // Calculate width based on SVG aspect ratio (1264:848 ≈ 1.49)
  const aspectRatio = 1264 / 848;
  const width = Math.round(height * aspectRatio);

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center transition-opacity hover:opacity-80",
        className
      )}
    >
      {collapsed ? (
        // Show icon only when collapsed
        <>
          {/* Light mode icon */}
          <Image
            src="/logos/lm-black-icon.svg"
            alt="Law Lens"
            width={height}
            height={height}
            className="dark:hidden"
            style={{ width: height, height: height }}
            priority
          />
          {/* Dark mode icon */}
          <Image
            src="/logos/dm-white-icon.svg"
            alt="Law Lens"
            width={height}
            height={height}
            className="hidden dark:block"
            style={{ width: height, height: height }}
            priority
          />
        </>
      ) : (
        <>
          {/* Light mode logo */}
          <Image
            src="/logos/lm-lawlens-logo.svg"
            alt="Law Lens"
            width={width}
            height={height}
            className="dark:hidden"
            style={{ width: 'auto', height: height }}
            priority
          />
          {/* Dark mode logo */}
          <Image
            src="/logos/dm-lawlens-logo.svg"
            alt="Law Lens"
            width={width}
            height={height}
            className="hidden dark:block"
            style={{ width: 'auto', height: height }}
            priority
          />
        </>
      )}
    </Link>
  );
}
