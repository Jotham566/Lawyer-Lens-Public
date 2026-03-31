"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
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

      {/* Findings Breakdown by Severity */}
      {summary && totalFindings > 0 && (
        <CardShell className="p-6">
          <h2 className="text-lg font-bold tracking-tight">Findings by Severity</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(["critical", "high", "medium", "low", "informational"] as const).map(
              (sev) => (
                <div key={sev} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <Badge label={sev} colorMap={SEVERITY_COLORS} />
                  <span className="text-lg font-bold">
                    {summary.findings_by_severity[sev] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </CardShell>
      )}

      {/* Quick Stats Row */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <CardShell className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Overdue Tasks
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-600 dark:text-red-400">
              {summary.overdue_tasks}
            </p>
          </CardShell>
          <CardShell className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Overdue Obligations
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-600 dark:text-red-400">
              {summary.overdue_obligations}
            </p>
          </CardShell>
          <CardShell className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Total Assessments
            </p>
            <p className="mt-1 text-2xl font-extrabold">
              {summary.total_assessments}
            </p>
          </CardShell>
        </div>
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

      {/* Getting Started */}
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
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Regulatory Watch Tab
   ───────────────────────────────────────────────────── */
function WatchTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance-events"],
    queryFn: () => complianceApi.listEvents({ limit: 20, offset: 0 }),
    staleTime: 2 * 60_000,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load regulatory events." />;

  const events = data?.items ?? [];

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
      {events.map((evt: RegulatoryEventResponse) => {
        const isExpanded = expandedId === evt.id;
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
const FINDING_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "identified", label: "Identified" },
  { value: "under_review", label: "Under Review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "mitigated", label: "Mitigated" },
  { value: "accepted", label: "Accepted" },
  { value: "dismissed", label: "Dismissed" },
];

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

  if (isLoading) return <LoadingSpinner />;
  if (error && isFeatureGated(error)) return <UpgradePrompt />;
  if (error) return <ErrorState message="Could not load findings." />;

  const findings = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="finding-status-filter" className="text-xs font-semibold text-muted-foreground">
          Status:
        </label>
        <select
          id="finding-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {FINDING_STATUSES.map((s) => (
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

      {findings.length === 0 ? (
        <EmptySection
          title="No Findings"
          description="No exposure findings match the current filter. Findings are generated from automated regulatory assessments."
          icon={AlertTriangle}
        />
      ) : (
        <div className="space-y-3">
          {findings.map((f: FindingResponse) => (
            <CardShell key={f.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={f.severity} colorMap={SEVERITY_COLORS} />
                <Badge label={f.status} colorMap={STATUS_COLORS} />
                {f.impacted_document_ref && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {f.impacted_document_ref}
                  </span>
                )}
              </div>
              {f.explanation && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {f.explanation}
                </p>
              )}
              {f.remediation_guidance && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Remediation Guidance
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {f.remediation_guidance}
                  </p>
                </div>
              )}
              <div className="mt-3 text-xs text-muted-foreground">
                Created {formatDate(f.created_at)}
              </div>
            </CardShell>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Obligations Tab
   ───────────────────────────────────────────────────── */
function ObligationsTab() {
  const queryClient = useQueryClient();

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

  const obligations = data?.items ?? [];

  if (obligations.length === 0) {
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
