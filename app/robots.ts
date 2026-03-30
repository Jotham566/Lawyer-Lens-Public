import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lawlens.io";

/**
 * Robots.txt — crawl guidance for search engines.
 *
 * Allow: public marketing pages, public legal content
 * Disallow: auth routes, dashboard, settings, API, billing, admin
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/landing",
          "/about",
          "/pricing",
          "/help",
          "/privacy",
          "/terms",
          "/judgments",
          "/legislation",
          "/document",
        ],
        disallow: [
          "/chat",
          "/settings",
          "/billing",
          "/admin",
          "/workspace",
          "/library",
          "/knowledge-base",
          "/compliance",
          "/contracts",
          "/research",
          "/onboarding",
          "/checkout",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/invite",
          "/auth/",
          "/account/",
          "/waitlist",
          "/browse",
          "/search",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
