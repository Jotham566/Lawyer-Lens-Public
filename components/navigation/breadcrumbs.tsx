"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Route segment configuration for human-readable labels
 */
const ROUTE_LABELS: Record<string, string> = {
  legislation: "Legislation",
  acts: "Acts",
  regulations: "Regulations",
  constitution: "Constitution",
  judgments: "Case Law",
  "supreme-court": "Supreme Court",
  "court-of-appeal": "Court of Appeal",
  "constitutional-court": "Constitutional Court",
  "high-court": "High Court",
  "commercial-court": "Commercial Court",
  "family-division": "Family Division",
  "land-division": "Land Division",
  "criminal-division": "Criminal Division",
  "anti-corruption": "Anti-Corruption Division",
  library: "My Library",
  saved: "Saved Documents",
  recent: "Recently Viewed",
  collections: "Collections",
  search: "Search",
  chat: "Legal Assistant",
  ask: "Ask a Question",
  document: "Document",
  browse: "Browse",
  about: "About",
  help: "Help & FAQ",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

interface BreadcrumbsProps {
  /**
   * Custom breadcrumb items to override automatic generation
   */
  items?: BreadcrumbItem[];
  /**
   * Optional document title for the last segment (e.g., "Income Tax Act")
   */
  documentTitle?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the home icon
   */
  showHome?: boolean;
  /**
   * Maximum number of segments to show (middle segments will be collapsed)
   */
  maxSegments?: number;
}

/**
 * Generate breadcrumb label from path segment
 */
function getSegmentLabel(segment: string): string {
  // Check for configured label
  if (ROUTE_LABELS[segment]) {
    return ROUTE_LABELS[segment];
  }

  // Check if it's a UUID (document ID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return "Document";
  }

  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(
  pathname: string,
  documentTitle?: string
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    const isLastSegment = i === segments.length - 1;

    let label = getSegmentLabel(segment);

    // Use document title for the last segment if provided
    if (isLastSegment && documentTitle) {
      label = documentTitle;
    }

    items.push({
      label,
      href: currentPath,
      isCurrentPage: isLastSegment,
    });
  }

  return items;
}

/**
 * Breadcrumbs component for navigation hierarchy display.
 *
 * Automatically generates breadcrumbs from the current pathname,
 * or accepts custom items for more control.
 *
 * @example
 * // Automatic generation
 * <Breadcrumbs />
 *
 * @example
 * // With document title
 * <Breadcrumbs documentTitle="Income Tax Act, 2023" />
 *
 * @example
 * // Custom items
 * <Breadcrumbs items={[
 *   { label: "Home", href: "/", isCurrentPage: false },
 *   { label: "Legislation", href: "/legislation", isCurrentPage: false },
 *   { label: "Income Tax Act", href: "/document/123", isCurrentPage: true },
 * ]} />
 */
export function Breadcrumbs({
  items: customItems,
  documentTitle,
  className,
  showHome = true,
  maxSegments = 5,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  // Generate or use custom items
  const items = customItems || generateBreadcrumbs(pathname, documentTitle);

  // Collapse middle segments if too many
  const shouldCollapse = items.length > maxSegments;
  let displayItems = items;

  if (shouldCollapse) {
    const firstItems = items.slice(0, 1);
    const lastItems = items.slice(-2);
    displayItems = [
      ...firstItems,
      { label: "...", href: "#", isCurrentPage: false },
      ...lastItems,
    ];
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {/* Home link */}
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            {displayItems.length > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
            )}
          </li>
        )}

        {/* Breadcrumb items */}
        {displayItems.map((item, index) => (
          <Fragment key={item.href + index}>
            <li className="flex items-center">
              {item.isCurrentPage || item.label === "..." ? (
                <span
                  className={cn(
                    "font-medium",
                    item.isCurrentPage
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                  aria-current={item.isCurrentPage ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
            {index < displayItems.length - 1 && (
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Structured data breadcrumbs for SEO
 */
export function BreadcrumbsJsonLd({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
