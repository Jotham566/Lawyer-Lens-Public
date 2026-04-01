"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Database,
  FileText,
  Search,
  Upload,
  BarChart3,
  HardDrive,
  Settings,
  Lock,
  Plug,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useRequireAuth } from "@/components/providers";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { PageLoading } from "@/components/common";
import { DocumentUpload } from "@/components/knowledge-base/document-upload";
import { DocumentList } from "@/components/knowledge-base/document-list";
import { SearchInternal } from "@/components/knowledge-base/search-internal";
import {
  getKnowledgeBaseStats,
  getConnectorStatus,
  formatFileSize,
  type KnowledgeBaseStats,
} from "@/lib/api/knowledge-base";

/* ═══════════════════════════════════════════════════════════
   Knowledge Base Dashboard
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { id: "documents", label: "Documents", icon: FileText },
  { id: "search", label: "Search", icon: Search },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

/* ─────────────────────────────────────────────────────
   Shared helpers
   ───────────────────────────────────────────────────── */

function CardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-transparent bg-card shadow-soft dark:border-glass",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Settings Tab
   ───────────────────────────────────────────────────── */

function SettingsTab() {
  const [connector, setConnector] = useState<{
    mode: string;
    connector: Record<string, unknown> | null;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConnectorStatus()
      .then(setConnector)
      .catch(() => setConnector(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Connector Status */}
      <CardShell className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
            <Plug className="h-4 w-4 text-brand-gold" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            Connector Status
          </h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : connector ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Mode
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                  connector.mode === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
                )}
              >
                {connector.mode}
              </span>
            </div>
            {connector.message && (
              <p className="text-sm text-muted-foreground">
                {connector.message}
              </p>
            )}
            {connector.connector && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Connector configured and active
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Unable to fetch connector status
          </div>
        )}
      </CardShell>

      {/* Compliance Profile Link */}
      <CardShell className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
            <Settings className="h-4 w-4 text-brand-gold" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            Compliance Profile
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your compliance profile to enable automatic document
          classification and regulatory mapping.
        </p>
        <Link
          href="/compliance/settings"
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Compliance Settings
        </Link>
      </CardShell>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main Content
   ───────────────────────────────────────────────────── */

function KnowledgeBaseContent() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("documents");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getKnowledgeBaseStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load KB stats:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStats();
  }, [isAuthenticated, refreshTrigger, loadStats]);

  const handleUploadComplete = () => {
    setRefreshTrigger((t) => t + 1);
  };

  const summaryCards = [
    {
      label: "Total Documents",
      value: String(stats?.total_documents ?? 0),
      icon: FileText,
      color: "text-brand-gold",
    },
    {
      label: "Ready for Search",
      value: String(stats?.ready_documents ?? 0),
      icon: Search,
      color: "text-green-500",
    },
    {
      label: "Total Chunks",
      value: String(stats?.total_chunks ?? 0),
      icon: BarChart3,
      color: "text-blue-500",
    },
    {
      label: "Storage Used",
      value: formatFileSize(stats?.total_storage_bytes ?? 0),
      icon: HardDrive,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="px-6 pt-6 pb-4 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
            <Database className="h-6 w-6 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Internal Knowledge Base
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload, manage, search, and analyze your organization&apos;s
              internal documents for compliance purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 pb-4 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-xl" />
              ))
            : summaryCards.map((card) => (
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
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "documents" && stats && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                  {stats.total_documents}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6 lg:px-10">
        {activeTab === "documents" && (
          <DocumentList
            refreshTrigger={refreshTrigger}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
        )}
        {activeTab === "search" && <SearchInternal />}
        {activeTab === "upload" && (
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        )}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Page Export
   ───────────────────────────────────────────────────── */

export default function KnowledgeBasePage() {
  const { canShowContent } = useRequireAuth();

  if (!canShowContent) return <PageLoading />;

  return (
    <FeatureGate
      feature="custom_integrations"
      fallback={
        <div className="min-h-screen">
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold/10">
              <Lock className="h-8 w-8 text-brand-gold" />
            </div>
            <h3 className="mt-4 text-lg font-bold">Enterprise Feature</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The Internal Knowledge Base is available on Enterprise plans.
              Upload, manage, and search your organization&apos;s internal
              documents with AI-powered semantic search and compliance
              classification.
            </p>
            <div className="mt-4 space-y-2 text-left max-w-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Features include
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-gold" />
                  Upload PDF, DOCX, and TXT documents
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-gold" />
                  Automatic text extraction and chunking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-gold" />
                  AI-powered semantic search
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-gold" />
                  Compliance classification and metadata
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-gold/90"
            >
              Upgrade to Enterprise
            </Link>
          </div>
        </div>
      }
    >
      <KnowledgeBaseContent />
    </FeatureGate>
  );
}
