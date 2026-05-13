"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listDataSources,
  syncDataSource,
  type DataSourceItem,
  type DataSourceStatus,
  type DataSourceType,
} from "@/lib/api/knowledge-base";
import { toast } from "sonner";

/**
 * Connected integrations panel for the KB Settings tab.
 *
 * Surfaces rows in `data_source_connections` — OneDrive (live),
 * SharePoint and Google Drive (schema-supported, syncer pending).
 * Lets the operator see status, last-synced timestamp, file counts,
 * and trigger a manual "Sync now" against any active connection.
 *
 * Why this exists separately from the generic Source Connectors list
 * below it on the same tab: the generic Connector model is a config
 * blob (SharePoint URL + REST endpoint + custom JSON), while this one
 * uses real OAuth tokens persisted in `data_source_connections` and
 * runs through the Microsoft Graph Delta API. Different data model,
 * different lifecycle, deserves its own panel.
 */

type SourceMeta = {
  type: DataSourceType;
  label: string;
  blurb: string;
  status: "live" | "preview" | "soon";
};

const SOURCES: SourceMeta[] = [
  {
    type: "microsoft_onedrive",
    label: "Microsoft OneDrive",
    blurb:
      "Sync a folder from OneDrive — Files.Read.All scope, incremental via Graph Delta.",
    status: "live",
  },
  {
    type: "microsoft_sharepoint",
    label: "Microsoft SharePoint",
    blurb:
      "Sync from a SharePoint document library. Same Graph plumbing as OneDrive.",
    status: "preview",
  },
  {
    type: "google_drive",
    label: "Google Drive",
    blurb:
      "Sync a Drive folder via the Drive v3 API. OAuth consent + delta token.",
    status: "soon",
  },
];

const SOURCE_LABEL: Record<DataSourceType, string> = {
  microsoft_onedrive: "OneDrive",
  microsoft_sharepoint: "SharePoint",
  google_drive: "Google Drive",
};

const STATUS_TONE: Record<
  DataSourceStatus,
  { dot: string; label: string; text: string }
> = {
  active: {
    dot: "bg-emerald-500",
    label: "Active",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  paused: {
    dot: "bg-amber-500",
    label: "Paused",
    text: "text-amber-700 dark:text-amber-300",
  },
  error: {
    dot: "bg-red-500",
    label: "Error",
    text: "text-red-700 dark:text-red-300",
  },
  expired: {
    dot: "bg-slate-500",
    label: "Re-auth needed",
    text: "text-slate-700 dark:text-slate-300",
  },
};

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}

export function IntegrationsPanel() {
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["kb-data-sources"],
    queryFn: listDataSources,
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => syncDataSource(id),
    onSuccess: (result) => {
      const parts: string[] = [];
      if (result.synced > 0) parts.push(`${result.synced} synced`);
      if (result.skipped_duplicate > 0)
        parts.push(`${result.skipped_duplicate} unchanged`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);
      toast.success("Sync complete", {
        description: parts.length > 0 ? parts.join(" · ") : "Up to date.",
      });
      void queryClient.invalidateQueries({ queryKey: ["kb-data-sources"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-documents"] });
      setSyncingId(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Sync failed";
      toast.error("Sync failed", { description: msg });
      setSyncingId(null);
    },
  });

  // Group by source type — useful when the user has multiple OneDrive
  // accounts wired to the org (work + personal). Derives directly off
  // `data` so React Compiler can memoize without an extra useMemo on
  // an intermediate `items` array (which changes identity on every
  // render and would trigger the exhaustive-deps lint).
  const items: DataSourceItem[] = useMemo(
    () => data?.items ?? [],
    [data],
  );
  const grouped = useMemo(() => {
    const out: Record<DataSourceType, DataSourceItem[]> = {
      microsoft_onedrive: [],
      microsoft_sharepoint: [],
      google_drive: [],
    };
    for (const i of items) {
      if (i.source_type in out) out[i.source_type].push(i);
    }
    return out;
  }, [items]);

  return (
    <div className="rounded-xl border border-transparent bg-card p-6 shadow-soft dark:border-glass">
      {/* Header */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
          <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold tracking-tight">
            Connected integrations
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            First-party file-source connections. OneDrive is live today;
            SharePoint and Google Drive land next. Documents pulled from
            here flow through the same chunking + embedding pipeline as
            manual uploads.
          </p>
        </div>
      </div>

      {/* Active connections */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-5 text-center">
          <p className="text-sm font-medium">No integrations connected yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick an integration below to set one up. OneDrive currently
            requires an admin-side OAuth wizard — ask ops to run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              connect_onedrive.py
            </code>{" "}
            for your account.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((conn) => {
            const tone = STATUS_TONE[conn.status];
            const isSyncing = syncingId === conn.id;
            const canSync =
              conn.source_type === "microsoft_onedrive" &&
              conn.status !== "expired";
            return (
              <div
                key={conn.id}
                className="rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        aria-hidden
                        className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)}
                      />
                      <span className="text-sm font-semibold">
                        {SOURCE_LABEL[conn.source_type] ?? conn.source_type}
                      </span>
                      <span
                        className={cn(
                          "rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                          tone.text,
                        )}
                      >
                        {tone.label}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {conn.account_display_name ?? conn.account_email}
                      {conn.account_display_name && (
                        <span className="ml-1 text-muted-foreground/70">
                          ({conn.account_email})
                        </span>
                      )}
                    </p>

                    {conn.folder_path && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <HardDrive className="h-3 w-3" />
                        <span className="truncate">{conn.folder_path}</span>
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Synced {formatRelative(conn.last_synced_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {conn.files_synced_total} synced
                      </span>
                      {conn.files_failed_total > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {conn.files_failed_total} failed
                        </span>
                      )}
                    </div>

                    {conn.last_error && conn.status === "error" && (
                      <p className="mt-2 truncate rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-700 dark:text-red-300">
                        {conn.last_error}
                      </p>
                    )}

                    {conn.status === "expired" && (
                      <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-800 dark:text-amber-200">
                        Refresh token rejected — reconnect via the
                        ops-side OAuth wizard to resume sync.
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSyncingId(conn.id);
                        syncMutation.mutate(conn.id);
                      }}
                      disabled={!canSync || isSyncing || syncMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        canSync
                          ? "Run one sync cycle right now"
                          : "Sync not available for this source / status"
                      }
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Syncing…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Sync now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available sources catalog */}
      <div className="mt-6">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Available sources
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SOURCES.map((src) => {
            const connected = grouped[src.type]?.length ?? 0;
            return (
              <div
                key={src.type}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  src.status === "live"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/60 bg-muted/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{src.label}</span>
                  {src.status === "live" ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                      Live
                    </span>
                  ) : src.status === "preview" ? (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">
                      Preview
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {src.blurb}
                </p>
                {connected > 0 ? (
                  <p className="mt-2 text-[11px] font-medium text-foreground">
                    {connected} connection{connected === 1 ? "" : "s"}
                  </p>
                ) : src.status === "live" ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    Connect via ops OAuth wizard
                  </p>
                ) : src.status === "preview" ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CloudOff className="h-3 w-3" />
                    Schema ready, syncer landing next
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    On the roadmap
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
