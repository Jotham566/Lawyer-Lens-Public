import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lawlens.io";

/**
 * Dynamic sitemap for search engine discovery.
 *
 * Includes:
 * - Static public pages (landing, about, pricing, legal, help)
 * - Public content pages (judgments, legislation, browse)
 *
 * Auth-gated pages (chat, settings, billing, workspace) are excluded.
 * Document detail pages could be added dynamically via API in the future.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static marketing / public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/landing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Public content pages (accessible without auth)
  const contentPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/judgments`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/legislation/acts`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/legislation`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/legislation/constitution`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];

  return [...staticPages, ...contentPages];
}
