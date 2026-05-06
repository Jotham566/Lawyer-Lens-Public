"use client";

/**
 * InternalKbNudge — small contextual hint shown in the empty /chat
 * state when the user has an Internal KB connected and at least one
 * doc indexed but is currently scoped to Law Lens. Click → flips the
 * chip to org_kb so the next question goes to their private corpus.
 *
 * Why this exists:
 *   Without a hint, users on TEAM/ENTERPRISE often forget Internal
 *   even exists — they land on /chat, see the same "ask about Uganda
 *   law" framing as the Free tier, and skip the chip control. The
 *   nudge surfaces "you've indexed N docs — try asking about them"
 *   inline so the option is impossible to miss.
 *
 * Render conditions (all must hold):
 *   - tier ∈ {team, enterprise}        (org_kb actually accessible)
 *   - kb has ≥1 ready document         (something to query)
 *   - corpusScope is not already org_kb (don't nudge if they're already there)
 *
 * Lifecycle:
 *   - Fetches KB stats once on mount via useEffect
 *   - Caches the count so flipping the chip doesn't re-fetch
 *   - Returns null while loading or if any condition fails
 */

import { useEffect, useRef, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getKnowledgeBaseStats } from "@/lib/api/knowledge-base";
import type { CorpusScope } from "@/lib/api/types";

interface InternalKbNudgeProps {
  tier: string | null | undefined;
  corpusScope: CorpusScope;
  onUseInternal: () => void;
  className?: string;
}

function tierAllowsInternal(tier: string | null | undefined): boolean {
  const t = (tier || "").toLowerCase();
  return t === "team" || t === "enterprise";
}

export function InternalKbNudge({
  tier,
  corpusScope,
  onUseInternal,
  className,
}: InternalKbNudgeProps) {
  // readyCount === null means we haven't fetched yet (or we're not
  // allowed to). The render gate at the bottom hides the nudge in
  // both states, so we don't need a separate `loading` flag — which
  // would otherwise force a setState-in-effect that Next 15's
  // react-hooks/set-state-in-effect rule flags.
  const [readyCount, setReadyCount] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const allowed = tierAllowsInternal(tier);

  useEffect(() => {
    // Only fetch when the user could actually use Internal — avoids a
    // wasted /knowledge-base/stats call for FREE/Pro users (which would
    // 403 anyway). Async work happens off the render path; the only
    // state mutation is in the .then/.catch which are NOT inside the
    // effect body itself, so the lint rule doesn't fire.
    if (!allowed || fetchedRef.current) return;
    fetchedRef.current = true;
    getKnowledgeBaseStats()
      .then((s) => setReadyCount(s.ready_documents))
      .catch(() => {
        // Quiet failure — if stats endpoint hiccups we just don't show
        // the nudge. The chip is still discoverable above the input.
        setReadyCount(0);
      });
  }, [allowed]);

  if (!allowed) return null;
  if (readyCount === null) return null;
  if (readyCount < 1) return null;
  if (corpusScope === "org_kb") return null;

  return (
    <button
      type="button"
      onClick={onUseInternal}
      className={cn(
        "group mx-auto inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300",
        className,
      )}
    >
      <Lock className="h-3.5 w-3.5" />
      <span>
        You have <span className="font-semibold">{readyCount}</span> doc
        {readyCount === 1 ? "" : "s"} in your Internal KB.
      </span>
      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
      <span className="font-semibold underline-offset-2 group-hover:underline">
        Try asking about them →
      </span>
    </button>
  );
}
