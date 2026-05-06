"use client";

/**
 * useCorpusScope — picks WHICH corpus the next chat turn queries.
 *
 * Scopes:
 *   legal_corpus = Uganda Acts/Judgments         (default, all tiers)
 *   org_kb       = User's Internal Knowledge Base (TEAM/ENTERPRISE)
 *   both         = Cross-corpus parallel + merge  (TEAM/ENTERPRISE; Phase 2)
 *
 * Persisted to localStorage so the user's preference survives reloads.
 * Tier-gated client-side (the backend re-checks server-side; this is just
 * a UX guard so we don't ship a 403 on every send).
 *
 * Mirrors the precedent set by Glean / Notion AI / MS Copilot: scope chip
 * lives next to the input, persists across turns, but is per-turn flippable.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CorpusScope } from "@/lib/api/types";

const STORAGE_KEY = "law-lens.corpus-scope";

export interface UseCorpusScopeReturn {
  /** Currently selected scope (defaults to "legal_corpus"). */
  corpusScope: CorpusScope;
  /** Update the scope. Persisted to localStorage. */
  setCorpusScope: (scope: CorpusScope) => void;
  /** True if the current user's tier permits the given scope. */
  isScopeAllowed: (scope: CorpusScope) => boolean;
  /** All scopes the current user's tier can pick. */
  allowedScopes: CorpusScope[];
}

/**
 * Tier-to-scope access matrix. Mirrors the backend gate in
 * routes/ai/chat.py::_check_corpus_scope_tier_access.
 *
 * Sources of truth:
 * - FREE/PROFESSIONAL: legal_corpus only (no Internal KB on these tiers)
 * - TEAM/ENTERPRISE:   all three (Internal KB is unlocked at Team)
 *
 * `tier` is the org subscription_tier string the backend serves on the
 * user/me payload — keep these in sync.
 */
function scopesAllowedFor(tier: string | null | undefined): CorpusScope[] {
  const t = (tier || "").toLowerCase();
  if (t === "team" || t === "enterprise") {
    return ["legal_corpus", "org_kb", "both"];
  }
  return ["legal_corpus"];
}

export function useCorpusScope(
  tier: string | null | undefined,
  options?: { defaultScope?: CorpusScope }
): UseCorpusScopeReturn {
  const fallback: CorpusScope = options?.defaultScope ?? "legal_corpus";

  // Lazy initializer reads localStorage on first client render so we
  // never call setState from an effect for hydration. Returns the
  // fallback on the server, then again on the first client render
  // (this matches the SSR-rendered HTML); we then read localStorage
  // synchronously inside the same first client render via useState's
  // initializer pattern, but to keep SSR/CSR markup byte-identical
  // we defer the read into the initializer of a parallel ref.
  //
  // Why not setState-in-effect: Next 15's react-hooks/set-state-in-effect
  // rule (correctly) flags cascading re-renders. Reading once in the
  // useState initializer below gives us the same behavior in 1 render
  // instead of 2, with no rule violation.
  const [corpusScope, setScopeState] = useState<CorpusScope>(() => {
    if (typeof window === "undefined") return fallback;
    // Explicit defaultScope (typically from a ?scope= URL param the user
    // just clicked through) wins over the persisted choice — it represents
    // a fresh user-driven request, not a returning-visitor preference.
    // Without this precedence, hard-refresh on /chat?scope=org_kb would
    // re-fire the auto-send against the persisted Law Lens scope and
    // produce an Ask-Ben-style "no documents provided" response.
    if (options?.defaultScope) {
      try {
        // Sync the persisted store immediately so the rest of the app —
        // including auto-send fired before the next render — sees the
        // requested scope, and so the URL strip we do next render doesn't
        // revert us back to localStorage.
        window.localStorage.setItem(STORAGE_KEY, options.defaultScope);
      } catch {
        /* noop */
      }
      return options.defaultScope;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "legal_corpus" || stored === "org_kb" || stored === "both") {
        return stored as CorpusScope;
      }
    } catch {
      // localStorage unavailable (Safari private mode, etc) — keep fallback.
    }
    return fallback;
  });

  const allowedScopes = useMemo(() => scopesAllowedFor(tier), [tier]);

  // Tier-downgrade safety: if the persisted scope is no longer allowed
  // (e.g., org dropped from TEAM to FREE), snap back to legal_corpus
  // before the next request fires. We compute the effective scope each
  // render rather than setting state from an effect to satisfy the
  // react-hooks/set-state-in-effect rule.
  const effectiveScope: CorpusScope = allowedScopes.includes(corpusScope)
    ? corpusScope
    : "legal_corpus";

  // Persist the snap-back to localStorage in an effect — this is a
  // side effect, not a state mutation, so it doesn't trigger the rule.
  useEffect(() => {
    if (effectiveScope === corpusScope) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, effectiveScope);
    } catch {
      /* noop */
    }
  }, [effectiveScope, corpusScope]);

  const setCorpusScope = useCallback(
    (scope: CorpusScope) => {
      if (!allowedScopes.includes(scope)) return;
      setScopeState(scope);
      try {
        window.localStorage.setItem(STORAGE_KEY, scope);
      } catch {
        /* noop */
      }
    },
    [allowedScopes]
  );

  const isScopeAllowed = useCallback(
    (scope: CorpusScope) => allowedScopes.includes(scope),
    [allowedScopes]
  );

  // Hand back effectiveScope (not raw corpusScope) so consumers see the
  // tier-corrected value immediately without an extra render cycle.
  return {
    corpusScope: effectiveScope,
    setCorpusScope,
    isScopeAllowed,
    allowedScopes,
  };
}
