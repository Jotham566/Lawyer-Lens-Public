"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  /** Target rendered height of the logo in pixels */
  height?: number;
  /** Override the default link destination (default: "/") */
  href?: string;
}

const LOGO_WIDTH = 1000;
const LOGO_HEIGHT = 280;

export function Logo({ collapsed = false, className, height = 48, href = "/" }: LogoProps) {
  const width = Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center transition-opacity hover:opacity-90",
        className
      )}
    >
      {collapsed ? (
        // Show icon only when collapsed
        <>
          {/* Light mode icon */}
          <Image
            src="/logos/lm-black-icon.svg"
            alt="Law Lens Uganda"
            width={height}
            height={height}
            className="dark:hidden"
            style={{ width: height, height: height }}
            loading="eager"
          />
          {/* Dark mode icon */}
          <Image
            src="/logos/dm-white-icon.svg"
            alt="Law Lens Uganda"
            width={height}
            height={height}
            className="hidden dark:block"
            style={{ width: height, height: height }}
            loading="eager"
          />
        </>
      ) : (
        <>
          {/* Light mode logo */}
          <Image
            src="/logos/lm-lawlens-logo.svg"
            alt="Law Lens Uganda"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            className="dark:hidden max-w-full h-auto"
            style={{ width, height: "auto", maxWidth: "100%" }}
            loading="eager"
          />
          {/* Dark mode logo */}
          <Image
            src="/logos/dm-lawlens-logo.svg"
            alt="Law Lens Uganda"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            className="hidden dark:block max-w-full h-auto"
            style={{ width, height: "auto", maxWidth: "100%" }}
            loading="eager"
          />
        </>
      )}
    </Link>
  );
}
