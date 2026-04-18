import { FlaskConical, PenTool } from "lucide-react";
import type { ComponentType } from "react";

import type { ToolKey } from "@/lib/analytics/track";

/**
 * Shared "Tools" navigation config.
 *
 * Single source of truth for the premium-gated entry points (Deep
 * Research, Contract Drafting). Imported by:
 * - components/layout/dashboard-sidebar.tsx (desktop nav)
 * - components/layout/mobile-nav.tsx (mobile slide-out drawer)
 *
 * Adding a new tool means editing this file only — the surfaces pick
 * it up automatically. Without this, drift between desktop and mobile
 * was a real risk (and one we already created in the Phase 1 ship).
 *
 * ``featureKey`` is typed as the analytics ``ToolKey`` union (not plain
 * string) so a typo at the config site fails to compile rather than
 * silently emitting a bogus ``tool`` value to the discoverability
 * dashboard.
 */
export interface ToolNavItem {
  featureKey: ToolKey;
  /** Display label (used by both surfaces). */
  label: string;
  /** Route to navigate to. */
  href: string;
  /** Lucide icon component. */
  icon: ComponentType<{ className?: string }>;
  /** Subtitle shown in the mobile drawer; sidebar omits it. */
  description: string;
}

export const toolsNav: ToolNavItem[] = [
  {
    featureKey: "deep_research",
    label: "Deep Research",
    href: "/research",
    icon: FlaskConical,
    description: "Multi-step legal research with citations",
  },
  {
    featureKey: "contract_drafting",
    label: "Contract Drafting",
    href: "/contracts",
    icon: PenTool,
    description: "Generate contracts from templates",
  },
];
