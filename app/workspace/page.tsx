"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookMarked,
  FlaskConical,
  PenTool,
  Clock,
  MessageSquareText,
  FileText,
  Search,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Crown,
  Users,
  Zap,
  Activity,
  Loader2,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth, useRequireAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { PageLoading } from "@/components/common";
import { useSavedDocuments } from "@/lib/stores";
import { getMyResearchSessions, type ResearchSessionListItem } from "@/lib/api/research";
import { getMyContracts, type ContractListItem } from "@/lib/api/contracts";
import { surfaceClasses } from "@/lib/design-system";
import { formatDistanceToNow } from "date-fns";

type RecentRun =
  | { kind: "research"; id: string; title: string; subtitle: string; status: string; href: string; ts: string }
  | { kind: "contract"; id: string; title: string; subtitle: string; status: string; href: string; ts: string };

function toResearchRun(item: ResearchSessionListItem): RecentRun {
  const title = item.title?.trim() || item.query.slice(0, 80) || "Untitled research";
  return {
    kind: "research",
    id: item.session_id,
    title,
    subtitle: item.query,
    status: item.status,
    href: `/research?session=${item.session_id}`,
    ts: item.completed_at || item.updated_at || item.created_at,
  };
}

function toContractRun(item: ContractListItem): RecentRun {
  const title = item.title?.trim() || `Untitled ${item.contract_type || "contract"}`;
  const partySummary = item.parties.length
    ? item.parties.slice(0, 2).join(" · ") +
      (item.parties.length > 2 ? ` +${item.parties.length - 2}` : "")
    : item.contract_type;
  return {
    kind: "contract",
    id: item.session_id,
    title,
    subtitle: partySummary,
    status: item.phase,
    href: `/contracts?session=${item.session_id}`,
    ts: item.updated_at || item.created_at,
  };
}

/* ────────────────────────────────────────────────────────────
   Tier display configuration
   ──────────────────────────────────────────────────────────── */
const tierConfig: Record<
  string,
  { label: string; color: string; icon: typeof Zap }
> = {
  free: { label: "Free", color: "text-muted-foreground", icon: Zap },
  professional: { label: "Pro", color: "text-primary", icon: Crown },
  team: { label: "Team", color: "text-primary", icon: Users },
  enterprise: { label: "Enterprise", color: "text-primary", icon: Crown },
};

/* ────────────────────────────────────────────────────────────
   Quick-access tools
   ──────────────────────────────────────────────────────────── */
const tools = [
  {
    title: "My Library",
    description: "Saved documents & bookmarks",
    href: "/library",
    icon: BookMarked,
  },
  {
    title: "Deep Research",
    description: "AI-powered research sessions",
    href: "/research",
    icon: FlaskConical,
  },
  {
    title: "Contract Drafting",
    description: "Draft and manage contracts",
    href: "/contracts",
    icon: PenTool,
  },
  {
    title: "Activity Log",
    description: "Your recent actions & history",
    href: "/settings/activity",
    icon: Clock,
  },
];

/* ════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function WorkspacePage() {
  const { canShowContent } = useRequireAuth();
  useAuth(); // ensure auth context is initialized
  const {
    entitlements,
    loading: entitlementsLoading,
    getUsage,
    refresh: refreshEntitlements,
  } = useEntitlements();
  const savedDocuments = useSavedDocuments();
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  // Server-backed recent runs across BOTH tools (research + contracts).
  // Replaces the prior research-only localStorage view that left a
  // blank "Recent Activity" panel for any user who'd only used contracts.
  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    Promise.allSettled([
      getMyResearchSessions({ limit: 8 }),
      getMyContracts({ limit: 8 }),
    ])
      .then(([researchResult, contractResult]) => {
        if (cancelled) return;
        const research =
          researchResult.status === "fulfilled" ? researchResult.value.map(toResearchRun) : [];
        const contracts =
          contractResult.status === "fulfilled" ? contractResult.value.map(toContractRun) : [];
        const merged = [...research, ...contracts]
          .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
          .slice(0, 8);
        setRecentRuns(merged);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!canShowContent || entitlementsLoading) return <PageLoading />;

  const currentTier = entitlements?.tier || "free";
  const tierInfo = tierConfig[currentTier] || tierConfig.free;
  const TierIcon = tierInfo.icon;

  // Usage metrics
  const aiUsage = getUsage("ai_query");
  const researchUsage = getUsage("deep_research");
  const contractUsage = getUsage("contract_draft");

  return (
    <div className="min-h-screen px-6 py-8 lg:px-12">
      {/* ── Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="ll-heading-xl">My Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your research, documents, and usage — all in one place.
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("gap-1.5 border-glass px-3 py-1", tierInfo.color)}
        >
          <TierIcon className="h-3.5 w-3.5" />
          {tierInfo.label}
        </Badge>
      </div>

      {/* ── Quick Tools Grid ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <div
              className={cn(
                "flex items-start gap-4 rounded-xl border border-transparent bg-card p-5 shadow-soft ll-transition hover:-translate-y-0.5 hover:shadow-floating dark:border-glass",
                "hover:border-brand-gold/30"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                <tool.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{tool.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground/40 ll-transition group-hover:text-brand-gold" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Activity — 2 cols */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-transparent bg-card p-6 shadow-soft dark:border-glass">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </h2>
              <Link
                href="/library"
                className="ll-transition text-xs font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-soft dark:hover:text-brand-gold"
              >
                View Library
              </Link>
            </div>

            {recentLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading recent runs…
              </div>
            ) : recentRuns.length > 0 ? (
              <div className="space-y-1">
                {recentRuns.map((run) => {
                  const Icon = run.kind === "research" ? FlaskConical : Scale;
                  const kindLabel = run.kind === "research" ? "Research" : "Contract";
                  return (
                    <Link
                      key={`${run.kind}:${run.id}`}
                      href={run.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg p-3",
                        surfaceClasses.rowInteractive
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] uppercase tracking-wide">
                            {kindLabel}
                          </Badge>
                          <p className="truncate text-sm font-medium">{run.title}</p>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatDistanceToNow(new Date(run.ts), { addSuffix: true })}
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{run.status.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 opacity-0 ll-transition group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  No activity yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Start a deep research run, draft a contract, or ask a question.
                </p>
                <Button size="sm" variant="brand" asChild className="mt-4">
                  <Link href="/chat">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Ask Ben
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar — 1 col */}
        <div className="space-y-6">
          {/* Usage Summary */}
          <div className="rounded-xl border border-transparent bg-card p-5 shadow-soft dark:border-glass">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Usage This Month</h3>
              <Badge
                variant="outline"
                className={cn("gap-1 border-glass text-xs", tierInfo.color)}
              >
                <TierIcon className="h-3 w-3" />
                {tierInfo.label}
              </Badge>
            </div>

            {/* AI Queries — primary metric */}
            {aiUsage && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Queries</span>
                </div>
                {aiUsage.is_unlimited ? (
                  <p className="text-sm text-muted-foreground">Unlimited</p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold">
                          {aiUsage.current}
                        </span>
                        <span className="ml-1 text-sm text-muted-foreground">
                          / {aiUsage.limit} used
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          aiUsage.is_at_limit
                            ? "text-destructive"
                            : "text-primary"
                        )}
                      >
                        {aiUsage.remaining} left
                      </span>
                    </div>
                    <Progress
                      value={aiUsage.percentage || 0}
                      className={cn(
                        "h-2",
                        (aiUsage.percentage || 0) > 80 &&
                          "[&>div]:bg-primary/70",
                        aiUsage.is_at_limit && "[&>div]:bg-destructive"
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {/* Other usage — compact */}
            {(researchUsage || contractUsage) && (
              <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
                {researchUsage && !researchUsage.is_unlimited && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <FlaskConical className="h-3.5 w-3.5" />
                      Deep Research
                    </span>
                    <span className="font-medium">
                      {researchUsage.current} / {researchUsage.limit}
                      <span className="ml-1 text-muted-foreground">
                        ({researchUsage.remaining} left)
                      </span>
                    </span>
                  </div>
                )}
                {contractUsage && !contractUsage.is_unlimited && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <PenTool className="h-3.5 w-3.5" />
                      Contract Drafts
                    </span>
                    <span className="font-medium">
                      {contractUsage.current} / {contractUsage.limit}
                      <span className="ml-1 text-muted-foreground">
                        ({contractUsage.remaining} left)
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Upgrade CTA for free tier */}
            {currentTier === "free" && (
              <div className="mt-4 border-t border-border/40 pt-3">
                <Link
                  href="/pricing"
                  className="group flex items-center justify-between text-sm text-primary"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Upgrade for more
                  </span>
                  <ArrowRight className="h-4 w-4 ll-transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Saved Documents */}
          <div className="rounded-xl border border-transparent bg-card p-5 shadow-soft dark:border-glass">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BookMarked className="h-4 w-4 text-muted-foreground" />
                Saved Documents
              </h3>
              {savedDocuments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {savedDocuments.length}
                </Badge>
              )}
            </div>

            {savedDocuments.length > 0 ? (
              <div className="space-y-1">
                {savedDocuments.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/document/${doc.id}`}
                    className={cn(
                      "group flex items-center gap-2 rounded-md p-2 text-sm",
                      surfaceClasses.rowInteractive
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{doc.title}</span>
                  </Link>
                ))}
                {savedDocuments.length > 5 && (
                  <Link
                    href="/library"
                    className="flex items-center justify-center gap-1 p-2 text-xs text-brand-gold ll-transition hover:text-brand-gold-soft"
                  >
                    View all {savedDocuments.length} documents
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-6 text-center">
                <BookMarked className="mx-auto h-6 w-6 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">
                  No saved documents
                </p>
                <Link
                  href="/legislation"
                  className="mt-1 inline-block text-xs text-brand-gold ll-transition hover:text-brand-gold-soft"
                >
                  Browse documents
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
