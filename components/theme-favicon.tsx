"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Dynamically switches favicon based on color scheme (light/dark mode)
 * Prefers animated SVG favicons while keeping PNG and touch-icon fallbacks in sync.
 */
export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const upsertLink = (
      selector: string,
      attributes: Record<string, string>,
    ) => {
      let link = document.querySelector<HTMLLinkElement>(selector);
      if (!link) {
        link = document.createElement("link");
        document.head.appendChild(link);
      }

      Object.entries(attributes).forEach(([key, value]) => {
        link!.setAttribute(key, value);
      });
    };

    const updateFavicon = () => {
      const isDark = resolvedTheme === "dark";
      const iconPath = isDark ? "/icons/dark" : "/icons/light";

      upsertLink('link[data-ll-favicon="svg"]', {
        rel: "icon",
        type: "image/svg+xml",
        href: `${iconPath}/favicon.svg`,
        "data-ll-favicon": "svg",
      });

      upsertLink('link[data-ll-favicon="16"]', {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: `${iconPath}/favicon-16x16.png`,
        "data-ll-favicon": "16",
      });

      upsertLink('link[data-ll-favicon="32"]', {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: `${iconPath}/favicon-32x32.png`,
        "data-ll-favicon": "32",
      });

      upsertLink('link[data-ll-favicon="apple"]', {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: `${iconPath}/apple-touch-icon.png`,
        "data-ll-favicon": "apple",
      });
    };

    updateFavicon();
  }, [resolvedTheme]);

  return null;
}
