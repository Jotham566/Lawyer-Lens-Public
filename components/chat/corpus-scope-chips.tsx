"use client";

/**
 * CorpusScopeChips — segmented control above the chat input that picks
 * which corpus the next turn queries.
 *
 *   ⚖️  Legal Corpus   │  🔒 Internal   │  ⚖️🔒 Both
 *
 * Tier gating:
 *   - FREE / PROFESSIONAL: only "Legal Corpus" enabled (other chips render
 *     disabled with an upsell tooltip).
 *   - TEAM / ENTERPRISE: all three enabled; "Both" is currently a Phase 2
 *     stub (the backend returns 501) — we mark it "Coming soon" via tooltip
 *     and disable selection.
 *
 * Why three chips and not a dropdown:
 *   - Glean / Notion AI / MS Copilot all show all options at once. A drop-
 *     down would hide that the Internal KB option exists, defeating
 *     discovery on a multi-corpus product.
 *   - Three options fit comfortably even on mobile (chips wrap).
 */

import { Lock, Scale, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CorpusScope } from "@/lib/api/types";

type TierLite = "free" | "professional" | "team" | "enterprise" | string | null | undefined;

export interface CorpusScopeChipsProps {
  value: CorpusScope;
  onChange: (next: CorpusScope) => void;
  tier: TierLite;
  /** Hide the "Both" chip entirely (e.g., on the dedicated KB Ask tab). */
  hideBoth?: boolean;
  /** Disable selection (e.g., while a stream is in flight). */
  disabled?: boolean;
  className?: string;
}

interface ChipDef {
  scope: CorpusScope;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CHIPS: ChipDef[] = [
  {
    scope: "legal_corpus",
    label: "Law Lens",
    icon: <Scale className="h-3.5 w-3.5" />,
    description: "Search Uganda's Acts, Statutory Instruments, and Judgments.",
  },
  {
    scope: "org_kb",
    label: "Internal",
    icon: <Lock className="h-3.5 w-3.5" />,
    description: "Search your organization's uploaded documents.",
  },
  {
    scope: "both",
    label: "Both",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    description: "Search Law Lens + your Internal KB and synthesize an answer.",
  },
];

function tierAllowsScope(tier: TierLite, scope: CorpusScope): boolean {
  if (scope === "legal_corpus") return true;
  const t = (tier || "").toString().toLowerCase();
  return t === "team" || t === "enterprise";
}

export function CorpusScopeChips({
  value,
  onChange,
  tier,
  hideBoth = false,
  disabled = false,
  className,
}: CorpusScopeChipsProps) {
  const visibleChips = hideBoth ? CHIPS.filter((c) => c.scope !== "both") : CHIPS;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="radiogroup"
        aria-label="Corpus scope"
        className={cn(
          "inline-flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1",
          className
        )}
      >
        {visibleChips.map((chip) => {
          const allowed = tierAllowsScope(tier, chip.scope);
          const isSelected = value === chip.scope;
          const isInteractive = allowed && !disabled;

          const tooltip = allowed
            ? chip.description
            : `${chip.description} Available on Team and Enterprise plans.`;

          return (
            <Tooltip key={chip.scope}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={chip.label}
                  disabled={!isInteractive}
                  onClick={() => isInteractive && onChange(chip.scope)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-foreground text-background shadow-sm"
                      : "text-foreground/70 hover:bg-muted",
                    !isInteractive && "cursor-not-allowed opacity-50 hover:bg-transparent"
                  )}
                >
                  {chip.icon}
                  <span>{chip.label}</span>
                  {!allowed && (
                    <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Pro
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
