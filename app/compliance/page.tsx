"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// react-markdown is only rendered inside expanded Finding detail
// panels (see usage further down). Static import pulls it into the
// top-level compliance bundle on every visit. Dynamic import keeps
// the initial /compliance bundle lean — the parser lands only when
// a user opens a finding.
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => null,
});
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Bell,
  Radio,
  FileText,
  ChevronRight,
  ChevronDown,
  Clock,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Lock,
  Settings,
  RefreshCw,
  Wrench,
  AlertOctagon,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { APIError } from "@/lib/api/client";
import {
  complianceApi,
  type RegulatoryEventResponse,
  type FindingResponse,
  type ObligationResponse,
  type TaskResponse,
  type AlertResponse,
} from "@/lib/api/compliance";

/* ═══════════════════════════════════════════════════════════
   Compliance Dashboard
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "watch", label: "Regulatory Watch", icon: Radio },
  { id: "findings", label: "Findings", icon: AlertTriangle },
  { id: "obligations", label: "Obligations", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "alerts", label: "Alerts", icon: Bell },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CompliancePage() {
  const { canShowContent } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Dashboard summary for tab counts
  const { data: summary } = useQuery({
    queryKey: ["compliance-dashboard-summary"],
    queryFn: () => complianceApi.getDashboardSummary().catch(() => null),
    staleTime: 60_000,
    retry: false,
  });

  // Findings count for tab badge
  const findingsCount = summary
    ? Object.values(summary.findings_by_severity).reduce((a, b) => a + b, 0)
    : 0;

  // Alert unacknowledged count for tab badge
  const unreadAlerts = summary?.unread_alerts ?? 0;

  // Tasks count for tab badge
  const tasksCount = summary ? summary.pending_tasks + summary.overdue_tasks : 0;

  if (!canShowContent) return <PageLoading />;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="px-6 pt-6 pb-4 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
              <ShieldCheck className="h-6 w-6 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Regulatory Compliance
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Monitor regulatory developments, track obligations, and manage
                compliance workflows.
              </p>
            </div>
          </div>
          <Link
            href="/compliance/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border/40 px-6 lg:px-10">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const badgeCount =
              tab.id === "alerts"
                ? unreadAlerts
                : tab.id === "findings"
                  ? findingsCount
                  : tab.id === "tasks"
                    ? tasksCount
                    : 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {badgeCount > 0 && (
                  <span
                    className={cn(
                      "ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      tab.id === "alerts"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6 lg:px-10">
        {activeTab === "overview" && <OverviewTab onNavigate={setActiveTab} />}
        {activeTab === "watch" && <WatchTab />}
        {activeTab === "findings" && <FindingsTab />}
        {activeTab === "obligations" && <ObligationsTab />}
        {activeTab === "tasks" && <TasksTab />}
        {activeTab === "alerts" && <AlertsTab />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Shared Helpers
   ───────────────────────────────────────────────────── */

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  informational: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  identified: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  under_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  mitigated: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  acknowledged: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function Badge({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  const colors = colorMap[label] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", colors)}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function dueDateColor(dateStr: string | null | undefined): string {
  if (!dateStr) return "text-muted-foreground";
  const due = new Date(dateStr);
  const now = new Date();
  const daysAway = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysAway < 0) return "text-red-600 dark:text-red-400 font-semibold";
  if (daysAway < 7) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-green-600 dark:text-green-400";
}

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-transparent bg-card shadow-soft dark:border-glass", className)}>
      {children}
    </div>
  );
}

function LoadingSpinner({ label = "Loading…" }: { label?: string } = {}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 text-lg font-bold">Failed to load</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold/10">
        <Lock className="h-8 w-8 text-brand-gold" />
      </div>
      <h3 className="mt-4 text-lg font-bold">Enterprise Feature</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Compliance Intelligence is available on Team and Enterprise plans.
        Upgrade your plan to access regulatory monitoring, obligation tracking,
        and compliance workflows.
      </p>
    </div>
  );
}

function EmptySection({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/** Check if an error is a 403 feature-gating error. */
function isFeatureGated(error: unknown): boolean {
  return error instanceof APIError && error.status === 403;
}

/* ─────────────────────────────────────────────────────
   Overview Tab — supporting components
   ───────────────────────────────────────────────────── */

/**
 * Returns the bucket for an obligation by its next_due_date relative
 * to now: "overdue" | "this_week" | "later" | "no_date".
 */
function bucketObligation(
  ob: ObligationResponse,
): "overdue" | "this_week" | "later" | "no_date" {
  if (!ob.next_due_date) return "no_date";
  const due = new Date(ob.next_due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() + 7);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() <= week.getTime()) return "this_week";
  return "later";
}

/**
 * P2: "Due this week" + "Overdue" obligation stacks on the Overview
 * tab. Pulls the same list ObligationsTab uses (active obligations,
 * limit 20) and partitions client-side. Renders compact cards with
 * a CTA to the Obligations tab.
 */
function UpcomingAndOverdueObligations({
  onNavigateObligations,
}: {
  onNavigateObligations: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ObligationResponse | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-obligations"],
    queryFn: () => complianceApi.listObligations({ is_active: true, limit: 20 }),
    staleTime: 60_000,
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => complianceApi.completeObligation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-obligations"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-dashboard-summary"] });
      setSelected(null);
    },
  });

  // Silently swallow 403 / errors on the Overview tab — the main
  // Obligations tab is the source of truth for error states. The
  // Overview callout is best-effort context.
  if (isLoading || error) return null;
  const obligations = data?.items ?? [];
  if (obligations.length === 0) return null;

  const overdue = obligations.filter((o) => bucketObligation(o) === "overdue");
  const thisWeek = obligations.filter(
    (o) => bucketObligation(o) === "this_week",
  );
  const thisMonth = obligations
    .filter((o) => obligationFilterBucket(o, new Date()) === "this_month")
    // Sort by next_due_date ascending so the most-urgent shows first.
    .sort((a, b) => {
      const ad = a.next_due_date ?? "";
      const bd = b.next_due_date ?? "";
      return ad.localeCompare(bd);
    });

  // Three render modes:
  //   1. Something Overdue OR Due-this-week → show both stacks (the
  //      "attention" view UDB legal would expect first thing).
  //   2. Nothing in either bucket but plenty within 30 days → show a
  //      single "Coming up this month" stack so the Overview tab
  //      still surfaces deadlines instead of going empty.
  //   3. Nothing in either bucket and nothing within 30 days → bail.
  const showUrgentView = overdue.length > 0 || thisWeek.length > 0;
  const showMonthView = !showUrgentView && thisMonth.length > 0;
  if (!showUrgentView && !showMonthView) return null;

  return (
    <>
      {showUrgentView && (
      <div className="grid gap-4 md:grid-cols-2">
        <ObligationStack
          title="Overdue"
          items={overdue}
          emptyLabel="Nothing slipped — keep it up."
          tone="overdue"
          onSeeAll={onNavigateObligations}
          onSelect={setSelected}
        />
        <ObligationStack
          title="Due this week"
          items={thisWeek}
          emptyLabel="No deadlines in the next 7 days."
          tone="upcoming"
          onSeeAll={onNavigateObligations}
          onSelect={setSelected}
        />
      </div>
      )}
      {showMonthView && (
        <ObligationStack
          title="Coming up this month"
          items={thisMonth}
          emptyLabel=""
          tone="upcoming"
          onSeeAll={onNavigateObligations}
          onSelect={setSelected}
        />
      )}
      <ObligationDetailDialog
        obligation={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onComplete={(id) => completeMutation.mutate(id)}
        completing={completeMutation.isPending}
      />
    </>
  );
}

function ObligationStack({
  title,
  items,
  emptyLabel,
  tone,
  onSeeAll,
  onSelect,
}: {
  title: string;
  items: ObligationResponse[];
  emptyLabel: string;
  tone: "overdue" | "upcoming";
  onSeeAll: () => void;
  onSelect: (ob: ObligationResponse) => void;
}) {
  const accent =
    tone === "overdue"
      ? "border-rose-500/30 bg-rose-500/5"
      : "border-amber-500/30 bg-amber-500/5";
  const iconColor =
    tone === "overdue" ? "text-rose-500" : "text-amber-500";
  const Icon = tone === "overdue" ? AlertTriangle : Clock;

  return (
    <CardShell className={cn("p-5", accent)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconColor)} />
          <h3 className="text-sm font-bold tracking-tight">{title}</h3>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold tabular-nums">
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            See all →
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.slice(0, 4).map((ob) => (
            <li key={ob.id}>
              <button
                type="button"
                onClick={() => onSelect(ob)}
                className="flex w-full items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3 text-left transition-colors hover:border-border hover:bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {ob.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {ob.recurrence_pattern?.replace(/_/g, " ") ?? "one-time"}
                    </span>
                    {ob.next_due_date && (
                      <>
                        <span>·</span>
                        <span>
                          {tone === "overdue" ? "Was due " : "Due "}
                          {new Date(ob.next_due_date).toLocaleDateString(
                            "en-UG",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </>
                    )}
                    {ob.assigned_owner_role && (
                      <>
                        <span>·</span>
                        <span className="capitalize">
                          {ob.assigned_owner_role.replace(/_/g, " ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              </button>
            </li>
          ))}
          {items.length > 4 && (
            <li className="pt-1">
              <button
                type="button"
                onClick={onSeeAll}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                + {items.length - 4} more
              </button>
            </li>
          )}
        </ul>
      )}
    </CardShell>
  );
}

/**
 * Full-detail dialog for an obligation. Opened from the Overview
 * tab's overdue/upcoming cards. Includes a "Mark complete" button
 * that calls the same endpoint the Obligations tab uses.
 */
function ObligationDetailDialog({
  obligation,
  onOpenChange,
  onComplete,
  completing,
}: {
  obligation: ObligationResponse | null;
  onOpenChange: (open: boolean) => void;
  onComplete: (id: string) => void;
  completing: boolean;
}) {
  const open = obligation !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {obligation && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{obligation.title}</DialogTitle>
              <DialogDescription className="capitalize">
                {obligation.obligation_type.replace(/_/g, " ")} ·{" "}
                {obligation.recurrence_pattern.replace(/_/g, " ")}
              </DialogDescription>
            </DialogHeader>

            {obligation.description && (
              <p className="text-sm text-muted-foreground">
                {obligation.description}
              </p>
            )}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Next due
                </dt>
                <dd className={cn("mt-1 font-semibold", dueDateColor(obligation.next_due_date))}>
                  {obligation.next_due_date
                    ? formatDate(obligation.next_due_date)
                    : "No due date set"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Advance warning
                </dt>
                <dd className="mt-1 font-semibold">
                  {obligation.advance_warning_days} day
                  {obligation.advance_warning_days === 1 ? "" : "s"}
                </dd>
              </div>
              {obligation.governing_regulator && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Regulator
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {obligation.governing_regulator}
                  </dd>
                </div>
              )}
              {obligation.assigned_owner_role && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Owner
                  </dt>
                  <dd className="mt-1 font-semibold capitalize">
                    {obligation.assigned_owner_role.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
              {obligation.legislation_reference && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Legislation
                  </dt>
                  <dd className="mt-1 text-sm">
                    {obligation.legislation_reference}
                  </dd>
                </div>
              )}
              {obligation.evidence_requirements?.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Evidence required
                  </dt>
                  <dd className="mt-1 text-sm">
                    <ul className="space-y-0.5">
                      {obligation.evidence_requirements.map((e, i) => (
                        <li key={`${obligation.id}-ev-${i}`} className="flex gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {obligation.last_completed_date && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Last completed
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(obligation.last_completed_date)}
                  </dd>
                </div>
              )}
            </dl>

            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-muted/40"
              >
                Close
              </button>
              <button
                type="button"
                disabled={completing}
                onClick={() => onComplete(obligation.id)}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Mark complete
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────
   Overview Tab
   ───────────────────────────────────────────────────── */
function OverviewTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["compliance-dashboard-summary"],
    queryFn: () => complianceApi.getDashboardSummary(),
    staleTime: 60_000,
    retry: false,
  });

  // P5: only show the "Getting Started" guide when the org doesn't
  // have a compliance profile yet. Once setup is done, the panel is
  // visual clutter on what should be an attention dashboard. Failure
  // path keeps showing it so first-time users see the right hint.
  const { data: profile } = useQuery({
    queryKey: ["compliance-profile"],
    queryFn: () => complianceApi.getProfile().catch(() => null),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const hasProfile = Boolean(profile);

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load dashboard summary. Please try again later." />;

  const totalFindings = summary
    ? Object.values(summary.findings_by_severity).reduce((a, b) => a + b, 0)
    : 0;

  const summaryCards = [
    {
      label: "Active Findings",
      value: String(totalFindings),
      icon: AlertTriangle,
      color: "text-amber-500",
      tab: "findings" as TabId,
    },
    {
      label: "Pending Tasks",
      value: String(summary?.pending_tasks ?? 0),
      icon: ClipboardList,
      color: "text-blue-500",
      tab: "tasks" as TabId,
    },
    {
      label: "Upcoming Deadlines",
      value: String(summary?.upcoming_deadlines ?? 0),
      icon: Clock,
      color: "text-orange-500",
      tab: "obligations" as TabId,
    },
    {
      label: "Unread Alerts",
      value: String(summary?.unread_alerts ?? 0),
      icon: Bell,
      color: "text-red-500",
      tab: "alerts" as TabId,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.tab)}
            className="rounded-xl border border-transparent bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-floating dark:border-glass text-left"
          >
            <div className="flex items-center justify-between">
              <card.icon className={cn("h-5 w-5", card.color)} />
              <span className="text-2xl font-extrabold tracking-tight">
                {card.value}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {card.label}
            </p>
          </button>
        ))}
      </div>

      {/* P2 (2026-05-13): Upcoming + Overdue obligations.
          Surfaces the two stacks legal teams check first thing in the
          morning — "what's due this week" + "what's slipped". Each
          card is a one-click drilldown to the Obligations tab. */}
      <UpcomingAndOverdueObligations
        onNavigateObligations={() => onNavigate("obligations")}
      />

      {/* At-a-glance severity strip + overdue callouts.
          Previously two separate card grids (5-card severity grid +
          3-card overdue stats). Collapsed into a single inline strip
          so the Overview tab stops looking like a dashboard-card
          mosaic. */}
      {summary && totalFindings > 0 && (
        <CardShell className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight">Findings by severity</h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span>
                Overdue tasks:{" "}
                <span className={cn("text-sm font-bold", summary.overdue_tasks > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                  {summary.overdue_tasks}
                </span>
              </span>
              <span>
                Overdue obligations:{" "}
                <span className={cn("text-sm font-bold", summary.overdue_obligations > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                  {summary.overdue_obligations}
                </span>
              </span>
              <span>
                Total assessments:{" "}
                <span className="text-sm font-bold text-foreground">{summary.total_assessments}</span>
              </span>
            </div>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            {(["critical", "high", "medium", "low", "informational"] as const).map(
              (sev) => (
                <li key={sev} className="flex items-center gap-2">
                  <Badge label={sev} colorMap={SEVERITY_COLORS} />
                  <span className="text-lg font-bold tabular-nums">
                    {summary.findings_by_severity[sev] ?? 0}
                  </span>
                </li>
              )
            )}
          </ul>
        </CardShell>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Review Findings",
              description:
                "View and triage exposure findings from automated assessments.",
              icon: AlertTriangle,
              onClick: () => onNavigate("findings"),
            },
            {
              title: "Track Obligations",
              description:
                "Monitor filing deadlines, recurring obligations, and compliance requirements.",
              icon: Calendar,
              onClick: () => onNavigate("obligations"),
            },
            {
              title: "View Regulatory Watch",
              description:
                "Monitor active regulatory events and legislative developments.",
              icon: Radio,
              onClick: () => onNavigate("watch"),
            },
          ].map((action) => (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="group flex items-start gap-4 rounded-xl border border-transparent bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-floating dark:border-glass"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold tracking-tight">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Getting Started — only when the org hasn't configured a
          compliance profile yet. Once setup is done, this panel is
          clutter; hide it. */}
      {!hasProfile && (
      <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-6">
        <h2 className="text-lg font-bold tracking-tight">
          Getting Started with Compliance Intelligence
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up your organization&apos;s compliance profile to start receiving
          relevant regulatory alerts, track obligations, and monitor legislative
          developments that affect your business.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/compliance/settings"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold/20 text-[10px] font-bold text-brand-gold">
              1
            </span>
            <span className="text-brand-gold hover:underline">
              Configure your compliance profile
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold/20 text-[10px] font-bold text-brand-gold">
              2
            </span>
            Add regulatory obligations
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold/20 text-[10px] font-bold text-brand-gold">
              3
            </span>
            Review automated alerts
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Regulatory Watch Tab
   ───────────────────────────────────────────────────── */

/**
 * P4 fallback: client-side substring + token overlap correlation
 * between a regulatory event and the user's tracked obligations.
 * Used only when the server endpoint
 * /compliance/events/{id}/linked-obligations is unavailable or fails
 * — primary path is the server-side
 * ObligationTrackingService.link_event_to_obligations() backing that
 * endpoint, which matches on sector tag overlap, governing
 * regulator, and legislation reference. The client-side path here
 * is kept as a safety net so the Watch tab still shows a count
 * during transient API issues.
 */
function linkedObligationsForEvent(
  evt: RegulatoryEventResponse,
  obligations: ObligationResponse[],
): ObligationResponse[] {
  const tags = [
    ...(evt.sector_tags ?? []),
    ...(evt.domain_tags ?? []),
  ]
    .map((t) => t.toLowerCase())
    .filter(Boolean);
  const eventTitleLower = evt.title.toLowerCase();
  return obligations.filter((ob) => {
    const haystack = [
      ob.title,
      ob.description ?? "",
      ob.governing_regulator ?? "",
      ob.legislation_reference ?? "",
    ]
      .join(" ")
      .toLowerCase();
    // Tag-based: any event tag substring-matches any obligation field.
    if (tags.some((tag) => haystack.includes(tag))) return true;
    // Regulator-based: obligation's regulator name appears in event title.
    const reg = (ob.governing_regulator ?? "").toLowerCase().trim();
    if (reg.length >= 3 && eventTitleLower.includes(reg)) return true;
    return false;
  });
}

/**
 * Renders the "Your obligations affected by this event" block inside
 * an expanded WatchTab card.
 *
 * Strategy:
 *   1. On mount (expand), call /compliance/events/{id}/linked-obligations
 *      — server-side ObligationTrackingService.link_event_to_obligations()
 *      gives us the authoritative match list.
 *   2. While loading or on error, fall back to the client-side
 *      heuristic the parent already computed (avoids a "no
 *      obligations" flash when the API is slow).
 *   3. If both server + fallback are empty, render nothing.
 */
function LinkedObligationsPanel({
  eventId,
  fallback,
}: {
  eventId: string;
  fallback: ObligationResponse[];
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["compliance-event-linked-obligations", eventId],
    queryFn: () => complianceApi.getLinkedObligationsForEvent(eventId),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const serverItems = data?.items ?? null;
  // Authoritative when the server returned something; otherwise use
  // the parent's client-side heuristic so the panel still shows
  // useful content.
  const items =
    serverItems !== null && !isError ? serverItems : fallback;
  const source = serverItems !== null && !isError ? "server" : "heuristic";

  if (items.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Your obligations affected by this event
        </span>
        {isLoading && source === "heuristic" && (
          <span className="text-[10px] text-muted-foreground italic">
            refining…
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 5).map((ob) => (
          <li
            key={ob.id}
            className="flex items-start gap-2 text-xs"
          >
            <span className="mt-0.5 text-amber-500">•</span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-foreground">
                {ob.title}
              </span>
              {(ob.governing_regulator || ob.next_due_date) && (
                <span className="ml-2 text-muted-foreground">
                  {[
                    ob.governing_regulator,
                    ob.next_due_date && `due ${formatDate(ob.next_due_date)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </div>
          </li>
        ))}
        {items.length > 5 && (
          <li className="text-[11px] text-muted-foreground">
            + {items.length - 5} more — see the Obligations tab.
          </li>
        )}
      </ul>
    </div>
  );
}

function WatchTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // P8 (2026-05-13): auto-refresh the events list every 5 minutes so
  // the Watch tab actually behaves like a monitoring surface. React
  // Query handles the polling — refetchInterval respects the browser
  // tab focus (RQ pauses when the tab is hidden), so no battery hit
  // when the user isn't looking. `dataUpdatedAt` powers the "last
  // updated …" label.
  const AUTO_REFRESH_MS = 5 * 60_000;
  const { data, isLoading, error, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["compliance-events"],
    queryFn: () => complianceApi.listEvents({ limit: 20, offset: 0 }),
    staleTime: 2 * 60_000,
    refetchInterval: AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
    retry: false,
  });

  // Pull obligations once for the correlation. The same key
  // ("compliance-obligations") is shared with ObligationsTab and the
  // Overview callout, so React Query dedupes the request.
  const { data: obligationsData } = useQuery({
    queryKey: ["compliance-obligations"],
    queryFn: () =>
      complianceApi.listObligations({ is_active: true, limit: 20 }),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load regulatory events." />;

  const events = data?.items ?? [];
  const obligations = obligationsData?.items ?? [];

  if (events.length === 0) {
    return (
      <EmptySection
        title="No Regulatory Events"
        description="Regulatory events and legislative developments will appear here once monitoring is active."
        icon={Radio}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Live-updates strip — confirms to the user that this is a
          real-time surface, not a stale list. Manual refresh button
          for impatient demos. */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live updates ·{" "}
          {dataUpdatedAt
            ? `last refreshed ${new Date(dataUpdatedAt).toLocaleTimeString("en-UG", { hour: "numeric", minute: "2-digit" })}`
            : "loading"}
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted/40 disabled:opacity-50"
          aria-label="Refresh events"
        >
          <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>
      {events.map((evt: RegulatoryEventResponse) => {
        const isExpanded = expandedId === evt.id;
        const linkedObligations = linkedObligationsForEvent(evt, obligations);
        return (
          <CardShell key={evt.id} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              className="flex w-full items-start gap-4 p-5 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={evt.event_type} colorMap={STATUS_COLORS} />
                  <span className="text-xs text-muted-foreground">
                    {evt.jurisdiction}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {evt.source_class.replace(/_/g, " ")}
                  </span>
                  {linkedObligations.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                      title="Number of your tracked obligations this event affects"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Affects {linkedObligations.length} of your obligations
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-bold leading-snug">
                  {evt.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {evt.publication_date && (
                    <span>Published {formatDate(evt.publication_date)}</span>
                  )}
                  <span>
                    Confidence: {(evt.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
            {isExpanded && (
              <div className="border-t border-border/40 bg-muted/30 px-5 py-4">
                {evt.summary ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {evt.summary}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">
                    No summary available.
                  </p>
                )}
                {evt.source_url && (
                  <a
                    href={evt.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <LinkedObligationsPanel
                  eventId={evt.id}
                  fallback={linkedObligations}
                />

                {(evt.sector_tags.length > 0 || evt.domain_tags.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {evt.sector_tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    {evt.domain_tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardShell>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Findings Tab
   ───────────────────────────────────────────────────── */
type FindingStatusOption = {
  value: string;
  label: string;
};

const FINDING_STATUSES: FindingStatusOption[] = [
  { value: "", label: "All" },
  { value: "identified", label: "Identified" },
  { value: "under_review", label: "Under Review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "mitigated", label: "Mitigated" },
  { value: "accepted", label: "Accepted" },
  { value: "dismissed", label: "Dismissed" },
];

// Visual treatment per severity. The accent strip on the left edge of
// each card is the primary "this is how bad it is" signal — Tailwind
// classes here drive both the strip color and the headline tone so
// they stay in sync.
const SEVERITY_TONE: Record<
  string,
  {
    strip: string;
    label: string;
    tile: string;
    tileText: string;
    headline: string;
    rank: number;
  }
> = {
  critical: {
    strip: "bg-red-500",
    label: "Critical",
    tile: "bg-red-500/10 border-red-500/30",
    tileText: "text-red-700 dark:text-red-300",
    headline: "text-red-700 dark:text-red-300",
    rank: 4,
  },
  high: {
    strip: "bg-orange-500",
    label: "High",
    tile: "bg-orange-500/10 border-orange-500/30",
    tileText: "text-orange-700 dark:text-orange-300",
    headline: "text-orange-700 dark:text-orange-300",
    rank: 3,
  },
  medium: {
    strip: "bg-amber-500",
    label: "Medium",
    tile: "bg-amber-500/10 border-amber-500/30",
    tileText: "text-amber-700 dark:text-amber-300",
    headline: "text-amber-700 dark:text-amber-300",
    rank: 2,
  },
  low: {
    strip: "bg-blue-500",
    label: "Low",
    tile: "bg-blue-500/10 border-blue-500/30",
    tileText: "text-blue-700 dark:text-blue-300",
    headline: "text-blue-700 dark:text-blue-300",
    rank: 1,
  },
  informational: {
    strip: "bg-slate-400",
    label: "Info",
    tile: "bg-slate-500/10 border-slate-500/30",
    tileText: "text-slate-700 dark:text-slate-300",
    headline: "text-foreground",
    rank: 0,
  },
};

function severityTone(sev: string | undefined) {
  return SEVERITY_TONE[(sev || "").toLowerCase()] ?? SEVERITY_TONE.informational;
}

/** Extract a tight headline from the explanation markdown body. */
function findingHeadline(text: string | null | undefined): string | null {
  if (!text) return null;
  // Prefer a leading `#`/`##`/`###` heading if the LLM gave us one.
  const headingMatch = text.match(/^\s*#{1,3}\s+(.+?)\s*$/m);
  if (headingMatch) return headingMatch[1].trim();
  // Otherwise grab the first non-empty line and strip markdown noise.
  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return null;
  // 110 chars is roughly two short lines at this column width — long
  // enough to be informative, short enough that the card title doesn't
  // become its own paragraph.
  const cleaned = firstLine
    .replace(/^[-*•]+\s*/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
  return cleaned.length > 110 ? `${cleaned.slice(0, 109).trimEnd()}…` : cleaned;
}

function FindingsTab() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-findings", statusFilter],
    queryFn: () =>
      complianceApi.listFindings({
        status: statusFilter || undefined,
        limit: 20,
      }),
    staleTime: 60_000,
    retry: false,
  });

  // Severity rollup ignores the status filter — operators expect the
  // top tiles to reflect the org's full exposure, not whatever they're
  // currently slicing on.
  const { data: rollupData } = useQuery({
    queryKey: ["compliance-findings", "rollup"],
    queryFn: () => complianceApi.listFindings({ limit: 200 }),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load findings." />;

  const findings = data?.items ?? [];
  const rollup = rollupData?.items ?? [];

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const f of rollup) {
    const key = (f.severity || "").toLowerCase();
    if (key in severityCounts) severityCounts[key] += 1;
  }
  const totalOpen = rollup.filter(
    (f) => !["mitigated", "dismissed", "accepted"].includes(f.status),
  ).length;

  // Sort the visible list by severity descending so the most-urgent
  // items land at the top of the card stack. Same created_at break.
  const sorted = [...findings].sort((a, b) => {
    const sevDiff = severityTone(b.severity).rank - severityTone(a.severity).rank;
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-5">
      {/* Severity rollup tiles */}
      {rollup.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["critical", "high", "medium", "low"] as const).map((sev) => {
            const tone = severityTone(sev);
            return (
              <div
                key={sev}
                className={cn(
                  "rounded-xl border p-4 transition-shadow",
                  tone.tile,
                  "hover:shadow-soft",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide",
                    tone.tileText,
                  )}
                >
                  {tone.label}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {severityCounts[sev]}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  finding{severityCounts[sev] === 1 ? "" : "s"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter chips + total count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter findings by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {FINDING_STATUSES.map((s) => {
            const active = statusFilter === s.value;
            return (
              <button
                key={s.value || "all"}
                type="button"
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {data ? (
            <>
              <span className="font-semibold text-foreground">
                {data.total}
              </span>{" "}
              showing
              {totalOpen > 0 && (
                <>
                  {" "}·{" "}
                  <span className="font-semibold text-foreground">
                    {totalOpen}
                  </span>{" "}
                  open
                </>
              )}
            </>
          ) : null}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptySection
          title={
            statusFilter
              ? "No findings match this filter"
              : "Nothing exposed right now"
          }
          description={
            statusFilter
              ? "Try the All filter — or your team has cleared this status bucket."
              : "Automated regulatory assessments will surface findings here as they detect exposure on your operations."
          }
          icon={CheckCircle2}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((f: FindingResponse) => {
            const tone = severityTone(f.severity);
            const headline = findingHeadline(f.explanation);
            // The body shouldn't repeat the headline. Strip the first
            // heading-or-line when we lifted it into the title.
            const body = (() => {
              if (!f.explanation) return null;
              if (!headline) return f.explanation;
              const lines = f.explanation.split("\n");
              const firstNonEmpty = lines.findIndex((l) => l.trim().length > 0);
              if (firstNonEmpty < 0) return f.explanation;
              return lines.slice(firstNonEmpty + 1).join("\n").trimStart();
            })();
            const evidenceCount =
              (f.evidence_passages?.length ?? 0) +
              (f.evidence_references?.length ?? 0);
            return (
              <article
                key={f.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft transition-shadow hover:shadow-floating"
              >
                {/* Severity accent strip — the primary visual signal */}
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    tone.strip,
                  )}
                />

                <div className="pl-5 pr-5 py-5">
                  {/* Top row: severity badge + status + impacted doc */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        tone.tile,
                        tone.tileText,
                      )}
                    >
                      <AlertOctagon className="h-3 w-3" />
                      {tone.label}
                    </span>
                    <Badge label={f.status} colorMap={STATUS_COLORS} />
                    {f.impacted_document_ref && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="max-w-[200px] truncate">
                          {f.impacted_document_ref}
                        </span>
                      </span>
                    )}
                    {evidenceCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <ClipboardList className="h-3 w-3" />
                        {evidenceCount} evidence
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  {headline && (
                    <h3
                      className={cn(
                        "mt-3 text-base font-semibold leading-snug",
                        tone.headline,
                      )}
                    >
                      {headline}
                    </h3>
                  )}

                  {/* Body explanation */}
                  {body && (
                    <div className="mt-2 prose prose-sm dark:prose-invert max-w-none text-foreground/85 [&_p]:leading-relaxed [&_p:first-child]:mt-0 [&_ul]:mt-1.5 [&_li]:mt-0.5 [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold">
                      <ReactMarkdown>{body}</ReactMarkdown>
                    </div>
                  )}

                  {/* Remediation block — action-forward, not a grey afterthought */}
                  {f.remediation_guidance && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 dark:bg-emerald-500/10">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <Wrench className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          What to do
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                          {f.remediation_guidance}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Footer: date + action */}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                    <p className="text-[11px] text-muted-foreground">
                      Surfaced {formatDate(f.created_at)}
                    </p>
                    {f.assigned_to_user_id ? (
                      <span className="text-[11px] text-muted-foreground">
                        Assigned
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Review
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Obligations Tab
   ───────────────────────────────────────────────────── */

type ObligationFilter = "all" | "overdue" | "this_week" | "this_month" | "later";

const OBLIGATION_FILTERS: Array<{ id: ObligationFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "later", label: "Later" },
];

/** Wider buckets than the Overview helper: includes "this_month". */
function obligationFilterBucket(
  ob: ObligationResponse,
  now: Date,
): "overdue" | "this_week" | "this_month" | "later" | "no_date" {
  if (!ob.next_due_date) return "no_date";
  const due = new Date(ob.next_due_date);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() + 7);
  const month = new Date(today);
  month.setDate(month.getDate() + 30);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() <= week.getTime()) return "this_week";
  if (due.getTime() <= month.getTime()) return "this_month";
  return "later";
}

function ObligationsTab() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Read initial filter from URL so a refresh / shared link preserves
  // the chosen view. Falls back to "all" when the param is missing or
  // unrecognised.
  const initialFilter = ((): ObligationFilter => {
    const f = searchParams.get("filter");
    const allowed: ObligationFilter[] = [
      "all", "overdue", "this_week", "this_month", "later",
    ];
    return allowed.includes(f as ObligationFilter)
      ? (f as ObligationFilter)
      : "all";
  })();
  const [filter, setFilter] = useState<ObligationFilter>(initialFilter);

  // Mirror filter changes into the URL so reload / share preserves
  // the state. Use `replace` so we don't pile up history entries.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    const next = params.toString();
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on filter change
  }, [filter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-obligations"],
    queryFn: () =>
      complianceApi.listObligations({ is_active: true, limit: 20 }),
    staleTime: 60_000,
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => complianceApi.completeObligation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-obligations"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-dashboard-summary"] });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load obligations." />;

  const allObligations = data?.items ?? [];
  const now = new Date();
  // Count per bucket so filter chips can show inline counts and the
  // user knows what they'd see before clicking. Cheap — runs once per
  // render against a list capped at 20.
  const bucketCounts = {
    all: allObligations.length,
    overdue: 0,
    this_week: 0,
    this_month: 0,
    later: 0,
  };
  for (const ob of allObligations) {
    const b = obligationFilterBucket(ob, now);
    if (b !== "no_date") bucketCounts[b] += 1;
  }
  const obligations =
    filter === "all"
      ? allObligations
      : allObligations.filter(
          (ob) => obligationFilterBucket(ob, now) === filter,
        );

  if (allObligations.length === 0) {
    return (
      <EmptySection
        title="No Active Obligations"
        description="Track recurring statutory obligations, filing deadlines, and compliance requirements."
        icon={Calendar}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* P3: filter chips */}
      <div className="flex flex-wrap gap-2">
        {OBLIGATION_FILTERS.map((f) => {
          const count = bucketCounts[f.id];
          const active = filter === f.id;
          const dim = !active && count === 0;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                active
                  ? "border-brand-gold/60 bg-brand-gold/15 text-brand-gold"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40",
                dim && "opacity-50",
              )}
              aria-pressed={active}
            >
              {f.label}
              <span
                className={cn(
                  "ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  active ? "bg-brand-gold/30" : "bg-foreground/10",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {obligations.length === 0 && (
        <CardShell className="p-6">
          <p className="text-sm text-muted-foreground">
            No obligations match this filter. Try widening the range.
          </p>
        </CardShell>
      )}

      {obligations.map((ob: ObligationResponse) => (
        <CardShell key={ob.id} className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={ob.obligation_type} colorMap={STATUS_COLORS} />
                <Badge label={ob.recurrence_pattern} colorMap={STATUS_COLORS} />
              </div>
              <h3 className="mt-2 text-sm font-bold leading-snug">{ob.title}</h3>
              {ob.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {ob.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {ob.governing_regulator && (
                  <span>Regulator: {ob.governing_regulator}</span>
                )}
                {ob.assigned_owner_role && (
                  <span>Owner: {ob.assigned_owner_role}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={cn("text-sm font-semibold", dueDateColor(ob.next_due_date))}>
                {ob.next_due_date ? (
                  <>Due {formatDate(ob.next_due_date)}</>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )}
              </div>
              <button
                type="button"
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate(ob.id)}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Complete
              </button>
              {ob.last_completed_date && (
                <span className="text-[10px] text-muted-foreground">
                  Last completed {formatDate(ob.last_completed_date)}
                </span>
              )}
            </div>
          </div>
        </CardShell>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Tasks Tab
   ───────────────────────────────────────────────────── */
const TASK_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

function TasksTab() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-tasks", statusFilter],
    queryFn: () =>
      complianceApi.listTasks({
        status: statusFilter || undefined,
        limit: 20,
      }),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load tasks." />;

  const tasks = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="task-status-filter" className="text-xs font-semibold text-muted-foreground">
          Status:
        </label>
        <select
          id="task-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {data && (
          <span className="text-xs text-muted-foreground">
            {data.total} total
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptySection
          title="No Tasks"
          description="Review, remediate, and track compliance tasks assigned to your team."
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((t: TaskResponse) => (
            <CardShell key={t.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge label={t.task_type} colorMap={STATUS_COLORS} />
                    <Badge label={t.status} colorMap={STATUS_COLORS} />
                    {t.priority > 5 && (
                      <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                        High Priority
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold leading-snug">{t.title}</h3>
                  {t.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {t.assigned_role && <span>Role: {t.assigned_role}</span>}
                    <span>Created {formatDate(t.created_at)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {t.due_date ? (
                    <span className={cn("text-sm font-semibold", dueDateColor(t.due_date))}>
                      Due {formatDate(t.due_date)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No due date</span>
                  )}
                </div>
              </div>
            </CardShell>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Alerts Tab
   ───────────────────────────────────────────────────── */
function AlertsTab() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-alerts"],
    queryFn: () => complianceApi.listAlerts({ limit: 20 }),
    staleTime: 30_000,
    retry: false,
  });

  const ackMutation = useMutation({
    mutationFn: (id: string) => complianceApi.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-alert-count"] });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load alerts." />;

  const alerts = data?.items ?? [];

  if (alerts.length === 0) {
    return (
      <EmptySection
        title="No Alerts"
        description="Compliance alerts and notifications based on severity and your organization's preferences."
        icon={Bell}
      />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((a: AlertResponse) => {
        const isUnread = !a.acknowledged_at;
        return (
          <CardShell
            key={a.id}
            className={cn("p-5", isUnread && "ring-1 ring-brand-gold/30")}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={a.severity} colorMap={SEVERITY_COLORS} />
                  <Badge label={a.delivery_status} colorMap={STATUS_COLORS} />
                  {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-brand-gold" />
                  )}
                </div>
                <h3 className="mt-2 text-sm font-bold leading-snug">
                  {a.title}
                </h3>
                {a.body && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {a.body}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(a.created_at)}</span>
                  <span className="capitalize">{a.delivery_channel}</span>
                </div>
              </div>
              {isUnread && (
                <button
                  type="button"
                  disabled={ackMutation.isPending}
                  onClick={() => ackMutation.mutate(a.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {ackMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Acknowledge
                </button>
              )}
            </div>
          </CardShell>
        );
      })}
    </div>
  );
}
