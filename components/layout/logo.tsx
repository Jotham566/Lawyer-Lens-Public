"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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

// Previously rendered both the light and dark variants with CSS-driven
// display toggling — which meant the browser fetched BOTH SVGs on every
// page load regardless of active theme. We now pick one src after mount
// using next-themes' resolvedTheme, which matches the rest of the app's
// theme-aware rendering (see ThemeFavicon). On first paint before mount
// we render the light variant to avoid hydration mismatch; any flash at
// the *moment* of theme change is imperceptible for a cached SVG.
export function Logo({ collapsed = false, className, height = 48, href = "/" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const width = Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  const src = collapsed
    ? isDark ? "/logos/dm-white-icon.svg" : "/logos/lm-black-icon.svg"
    : isDark ? "/logos/dm-lawlens-logo.svg" : "/logos/lm-lawlens-logo.svg";

  const imgWidth = collapsed ? height : LOGO_WIDTH;
  const imgHeight = collapsed ? height : LOGO_HEIGHT;
  const style = collapsed
    ? { width: height, height }
    : { width, height: "auto" as const, maxWidth: "100%" };

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center transition-opacity hover:opacity-90",
        className
      )}
    >
      <Image
        key={src}
        src={src}
        alt="Law Lens Uganda"
        width={imgWidth}
        height={imgHeight}
        className={cn(!collapsed && "max-w-full h-auto")}
        style={style}
        loading="eager"
      />
    </Link>
  );
}
