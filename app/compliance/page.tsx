"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Bell,
  Radio,
  FileText,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

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

  // Fetch summary counts for overview
  const { data: alertCount } = useQuery({
    queryKey: ["compliance-alert-count"],
    queryFn: () =>
      apiGet<{ count: number }>("/compliance/alerts/unacknowledged-count").catch(() => ({
        count: 0,
      })),
    staleTime: 60 * 1000,
    retry: false,
  });

  if (!canShowContent) return <PageLoading />;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="px-6 pt-6 pb-4 lg:px-10">
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
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border/40 px-6 lg:px-10">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
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
              {tab.id === "alerts" && (alertCount?.count ?? 0) > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {alertCount?.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6 lg:px-10">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "watch" && <EmptySection title="Regulatory Watch" description="Regulatory events and legislative developments will appear here once monitoring is active." icon={Radio} />}
        {activeTab === "findings" && <EmptySection title="Exposure Findings" description="Identified exposure from regulatory developments against your organization's documents and obligations." icon={AlertTriangle} />}
        {activeTab === "obligations" && <EmptySection title="Obligations & Deadlines" description="Track recurring statutory obligations, filing deadlines, and compliance requirements." icon={Calendar} />}
        {activeTab === "tasks" && <EmptySection title="Compliance Tasks" description="Review, remediate, and track compliance tasks assigned to your team." icon={ClipboardList} />}
        {activeTab === "alerts" && <EmptySection title="Alerts" description="Compliance alerts and notifications based on severity and your organization's preferences." icon={Bell} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Overview Tab
   ───────────────────────────────────────────────────── */
function OverviewTab() {
  const summaryCards = [
    { label: "Active Findings", value: "0", icon: AlertTriangle, color: "text-amber-500" },
    { label: "Pending Tasks", value: "0", icon: ClipboardList, color: "text-blue-500" },
    { label: "Upcoming Deadlines", value: "0", icon: Clock, color: "text-orange-500" },
    { label: "Unread Alerts", value: "0", icon: Bell, color: "text-red-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-transparent bg-card p-5 shadow-soft dark:border-glass"
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
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Configure Compliance Profile",
              description: "Set your organization's sectors, regulators, and monitoring preferences.",
              icon: ShieldCheck,
              href: "#",
            },
            {
              title: "Add Regulatory Obligation",
              description: "Track a recurring filing, reporting, or renewal deadline.",
              icon: Calendar,
              href: "#",
            },
            {
              title: "View Legislative Tracker",
              description: "Monitor active bills and their progress through Parliament.",
              icon: FileText,
              href: "#",
            },
          ].map((action) => (
            <button
              key={action.title}
              type="button"
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold/20 text-[10px] font-bold text-brand-gold">
              1
            </span>
            Configure your compliance profile
          </div>
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
   Empty Section (for tabs without data yet)
   ───────────────────────────────────────────────────── */
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
