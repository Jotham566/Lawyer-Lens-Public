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

  // Lazy-initialise from localStorage so SSR doesn't read window.
  const [corpusScope, setScopeState] = useState<CorpusScope>(fallback);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "legal_corpus" || stored === "org_kb" || stored === "both")) {
        setScopeState(stored as CorpusScope);
      }
    } catch {
      // localStorage unavailable (Safari private mode, etc) — keep default.
    }
  }, []);

  const allowedScopes = useMemo(() => scopesAllowedFor(tier), [tier]);

  // If the user's tier no longer permits their previously-chosen scope
  // (e.g., downgraded org), snap back to legal_corpus instead of sending
  // requests the backend will reject.
  useEffect(() => {
    if (!allowedScopes.includes(corpusScope)) {
      setScopeState("legal_corpus");
      try {
        window.localStorage.setItem(STORAGE_KEY, "legal_corpus");
      } catch {
        /* noop */
      }
    }
  }, [allowedScopes, corpusScope]);

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

  return { corpusScope, setCorpusScope, isScopeAllowed, allowedScopes };
}
