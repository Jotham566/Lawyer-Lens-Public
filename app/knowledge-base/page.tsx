"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Database,
  FileText,
  MessageSquare,
  Search,
  Upload,
  BarChart3,
  HardDrive,
  Settings,
  Lock,
  Plug,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Zap,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useRequireAuth } from "@/components/providers";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { PageLoading } from "@/components/common";
import { DocumentUpload } from "@/components/knowledge-base/document-upload";
import { DocumentList } from "@/components/knowledge-base/document-list";
import { SearchInternal } from "@/components/knowledge-base/search-internal";
import { KbChatPanel } from "@/components/knowledge-base/chat-internal";
import {
  getKnowledgeBaseStats,
  listConnectors,
  createConnector,
  updateConnector,
  deleteConnector,
  testConnector,
  formatFileSize,
  type KnowledgeBaseStats,
  type Connector,
} from "@/lib/api/knowledge-base";

/* ═══════════════════════════════════════════════════════════
   Knowledge Base Dashboard
   ═══════════════════════════════════════════════════════════ */

const tabs = [
  { id: "ask", label: "Ask", icon: MessageSquare },
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

const CONNECTOR_TYPES = [
  {
    value: "sharepoint",
    label: "Microsoft SharePoint",
    description:
      "Sync documents from your SharePoint document libraries",
  },
  {
    value: "s3",
    label: "Amazon S3",
    description: "Sync documents from an S3 bucket",
  },
  {
    value: "rest_api",
    label: "REST API",
    description: "Connect to a document management API",
  },
  {
    value: "file_system",
    label: "File System",
    description:
      "Sync from a network file share (requires on-prem connector agent)",
  },
  {
    value: "custom",
    label: "Custom Connector",
    description: "Configure a custom integration endpoint",
  },
] as const;

const SYNC_INTERVALS = [
  { label: "Every 15 min", value: 15 },
  { label: "Every 30 min", value: 30 },
  { label: "Every hour", value: 60 },
  { label: "Every 6 hours", value: 360 },
  { label: "Every 12 hours", value: 720 },
  { label: "Daily", value: 1440 },
] as const;

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"
      ? "bg-green-500"
      : status === "paused"
        ? "bg-yellow-500"
        : "bg-red-500";
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", color)}
      title={status}
    />
  );
}

function SettingsTab() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    healthy: boolean;
    message: string;
  } | null>(null);

  // Form state
  const [formType, setFormType] = useState("sharepoint");
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formInterval, setFormInterval] = useState(60);
  const [formConfig, setFormConfig] = useState("{}");

  const loadConnectors = useCallback(async () => {
    try {
      const data = await listConnectors();
      setConnectors(data.connectors);
    } catch {
      console.error("Failed to load connectors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnectors();
  }, [loadConnectors]);

  const resetForm = () => {
    setFormType("sharepoint");
    setFormName("");
    setFormUrl("");
    setFormInterval(60);
    setFormConfig("{}");
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (c: Connector) => {
    setFormType(c.connector_type);
    setFormName(c.source_name);
    setFormUrl(c.source_url);
    setFormInterval(c.fetch_interval_minutes);
    setFormConfig(JSON.stringify(c.config || {}, null, 2));
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    setSubmitting(true);
    try {
      let parsedConfig: Record<string, unknown> = {};
      try {
        parsedConfig = JSON.parse(formConfig);
      } catch {
        // keep empty
      }
      if (editingId) {
        await updateConnector(editingId, {
          source_name: formName,
          source_url: formUrl,
          config: parsedConfig,
          fetch_interval_minutes: formInterval,
        });
      } else {
        await createConnector({
          connector_type: formType,
          source_name: formName,
          source_url: formUrl,
          config: parsedConfig,
          fetch_interval_minutes: formInterval,
        });
      }
      resetForm();
      await loadConnectors();
    } catch (err) {
      console.error("Failed to save connector:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConnector(id);
      await loadConnectors();
    } catch (err) {
      console.error("Failed to delete connector:", err);
    }
  };

  const handleTogglePause = async (c: Connector) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    try {
      await updateConnector(c.id, { status: newStatus });
      await loadConnectors();
    } catch (err) {
      console.error("Failed to update connector:", err);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await testConnector(id);
      setTestResult({
        id,
        healthy: result.healthy,
        message: result.healthy
          ? `Connected (HTTP ${result.status_code})`
          : result.error || "Connection failed",
      });
      await loadConnectors();
    } catch {
      setTestResult({ id, healthy: false, message: "Test request failed" });
    } finally {
      setTestingId(null);
    }
  };

  const formatInterval = (minutes: number) => {
    const match = SYNC_INTERVALS.find((s) => s.value === minutes);
    if (match) return match.label;
    if (minutes < 60) return `Every ${minutes} min`;
    if (minutes < 1440) return `Every ${Math.round(minutes / 60)}h`;
    return `Every ${Math.round(minutes / 1440)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Connector List Header */}
      <CardShell className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
              <Plug className="h-4 w-4 text-brand-gold" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              Source Connectors
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Connector
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : connectors.length === 0 ? (
          <div className="py-8 text-center">
            <Plug className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No connectors configured
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Add a connector to automatically sync documents from external
              sources.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusDot status={c.status} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">
                        {c.source_name}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {c.connector_type}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="truncate max-w-[240px]">
                        {c.source_url}
                      </span>
                      <span>{formatInterval(c.fetch_interval_minutes)}</span>
                      {c.last_fetch_at && (
                        <span>
                          Last sync:{" "}
                          {new Date(c.last_fetch_at).toLocaleDateString()}
                        </span>
                      )}
                      {c.error_count > 0 && (
                        <span className="text-red-500">
                          {c.error_count} error
                          {c.error_count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {testResult && testResult.id === c.id && (
                      <div
                        className={cn(
                          "mt-1 text-xs font-medium",
                          testResult.healthy
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {testResult.healthy ? (
                          <CheckCircle2 className="mr-1 inline h-3 w-3" />
                        ) : (
                          <AlertTriangle className="mr-1 inline h-3 w-3" />
                        )}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <button
                    type="button"
                    onClick={() => handleTest(c.id)}
                    disabled={testingId === c.id}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    title="Test connectivity"
                  >
                    {testingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePause(c)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={c.status === "active" ? "Pause" : "Resume"}
                  >
                    {c.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditForm(c)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      {/* Add / Edit Connector Form */}
      {showForm && (
        <CardShell className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
                <Plus className="h-4 w-4 text-brand-gold" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                {editingId ? "Edit Connector" : "Add Connector"}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Connector Type */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Connector Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                disabled={!!editingId}
                className="mt-1 block w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
              >
                {CONNECTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {CONNECTOR_TYPES.find((t) => t.value === formType)?.description}
              </p>
            </div>

            {/* Source Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Source Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Company Policy Docs"
                className="mt-1 block w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Source URL
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 block w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            {/* Sync Interval */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Sync Interval
              </label>
              <select
                value={formInterval}
                onChange={(e) => setFormInterval(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                {SYNC_INTERVALS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Config JSON */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Configuration (JSON)
              </label>
              <textarea
                value={formConfig}
                onChange={(e) => setFormConfig(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-border/60 bg-background px-3 py-2 font-mono text-xs transition-colors focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !formName.trim() || !formUrl.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Connector"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border/60 px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </CardShell>
      )}

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

function KnowledgeBaseContent({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
        {activeTab === "ask" && <KbChatPanel />}
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
  const [activeTab, setActiveTab] = useState<TabId>("ask");

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
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
            >
              Upgrade to Enterprise
            </Link>
          </div>
        </div>
      }
    >
      <KnowledgeBaseContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </FeatureGate>
  );
}
