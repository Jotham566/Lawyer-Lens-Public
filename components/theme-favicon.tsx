"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Dynamically switches favicon based on color scheme (light/dark mode)
 * Uses the icons from /public/icons/light and /public/icons/dark
 */
export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const updateFavicon = () => {
      const isDark = resolvedTheme === "dark";
      const iconPath = isDark ? "/icons/dark" : "/icons/light";

      // Update favicon - use 32x32 for better visibility
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = `${iconPath}/favicon-32x32.png`;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.href = `${iconPath}/favicon-32x32.png`;
        document.head.appendChild(link);
      }

      // Update apple-touch-icon
      const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (appleIcon) {
        appleIcon.href = `${iconPath}/apple-touch-icon.png`;
      }

      // Update 16x16 favicon
      const favicon16 = document.querySelector<HTMLLinkElement>('link[rel="icon"][sizes="16x16"]');
      if (favicon16) {
        favicon16.href = `${iconPath}/favicon-16x16.png`;
      }

      // Update 32x32 favicon
      const favicon32 = document.querySelector<HTMLLinkElement>('link[rel="icon"][sizes="32x32"]');
      if (favicon32) {
        favicon32.href = `${iconPath}/favicon-32x32.png`;
      }
    };

    updateFavicon();
  }, [resolvedTheme]);

  return null;
}
