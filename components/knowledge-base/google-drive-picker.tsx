"use client";

/**
 * Google Drive Picker integration.
 *
 * Why this exists: the `drive.file` OAuth scope only grants access to
 * files/folders the user EXPLICITLY picks via Google's Picker UI (or
 * files our app creates). So after the OAuth callback creates a
 * Google Drive connection, the connection is dormant until the user
 * picks a folder via this component.
 *
 * Loading strategy:
 * - `gapi` and `google.picker` are loaded on-demand the first time
 *   `openPicker()` is called. We don't load them at app start because
 *   they're ~120KB of JS that 95% of users never touch.
 * - Loaded twice via two separate script tags:
 *     1. https://apis.google.com/js/api.js — provides window.gapi
 *     2. https://accounts.google.com/gsi/client — newer GIS (not used
 *        here because we already have an access token from our own
 *        OAuth flow). We only need (1).
 * - gapi.load("picker", cb) then loads the actual Picker module.
 *
 * Token handling:
 * - We fetch the OAuth access token from the backend via
 *   `getDataSourcePickerConfig`. The backend refreshes it if it's
 *   close to expiry. We never persist or expose it client-side
 *   beyond the lifetime of this component.
 *
 * After pick:
 * - User selects exactly one folder.
 * - We PATCH the data source connection with `folder_id` +
 *   `folder_path` so the syncer knows what to scan.
 * - We invalidate the data-sources query so the panel reflects the
 *   new folder.
 */

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderTree, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDataSourcePickerConfig,
  updateDataSource,
  type DataSourceItem,
} from "@/lib/api/knowledge-base";

type GapiLoad = (api: string, cb: () => void) => void;

interface PickerDoc {
  id: string;
  name: string;
  type: string;
  mimeType: string;
}

interface PickerResponse {
  action: string;
  docs?: PickerDoc[];
}

interface PickerBuilder {
  addView: (view: unknown) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setAppId: (id: string) => PickerBuilder;
  setCallback: (cb: (data: PickerResponse) => void) => PickerBuilder;
  setTitle: (title: string) => PickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}

interface GooglePickerNamespace {
  PickerBuilder: new () => PickerBuilder;
  DocsView: new (viewId?: string) => {
    setIncludeFolders: (v: boolean) => unknown;
    setSelectFolderEnabled: (v: boolean) => unknown;
    setMimeTypes: (mimes: string) => unknown;
  };
  ViewId: { FOLDERS: string; DOCS: string };
  Action: { PICKED: string; CANCEL: string };
}

declare global {
  interface Window {
    gapi?: { load: GapiLoad };
    google?: { picker?: GooglePickerNamespace };
  }
}

/**
 * Load gapi from the CDN if it isn't already on `window`.
 * Idempotent — concurrent calls share the same promise.
 */
let _gapiPromise: Promise<void> | null = null;
function loadGapi(): Promise<void> {
  if (_gapiPromise) return _gapiPromise;
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Picker must run client-side"));
  }
  if (window.gapi) return Promise.resolve();

  _gapiPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google API loader (api.js)"));
    document.head.appendChild(script);
  });
  return _gapiPromise;
}

/** gapi.load("picker") returns a Promise wrapping the callback. */
function loadPickerModule(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error("gapi not loaded"));
      return;
    }
    window.gapi.load("picker", () => {
      if (window.google?.picker) {
        resolve();
      } else {
        reject(new Error("google.picker namespace not populated"));
      }
    });
  });
}

interface SelectFolderButtonProps {
  connection: DataSourceItem;
  /** Visual variant — primary vs subdued. */
  variant?: "primary" | "secondary";
  /** Optional custom label. Defaults based on whether a folder is already set. */
  label?: string;
}

export function SelectFolderButton({
  connection,
  variant = "secondary",
  label,
}: SelectFolderButtonProps) {
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (payload: { folder_id: string; folder_path: string }) =>
      updateDataSource(connection.id, payload),
    onSuccess: (updated) => {
      toast.success("Folder selected", {
        description: `Will sync ${updated.folder_path ?? "the selected folder"} on the next run.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["kb-data-sources"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Couldn't save selection";
      toast.error("Save failed", { description: msg });
    },
  });

  const openPicker = useCallback(async () => {
    setOpening(true);
    try {
      // 1. Get a fresh access token + picker config from the backend.
      const cfg = await getDataSourcePickerConfig(connection.id);
      if (!cfg.api_key) {
        toast.error("Picker not configured", {
          description:
            "GOOGLE_PICKER_API_KEY isn't set on the server. See the OAuth integrations runbook.",
        });
        return;
      }

      // 2. Lazy-load gapi + the Picker module.
      await loadGapi();
      await loadPickerModule();
      const picker = window.google?.picker;
      if (!picker) {
        throw new Error("Picker module failed to load");
      }

      // 3. Build a folder-only view. Picker fires the callback when
      // the user picks or cancels.
      const view = new picker.DocsView(picker.ViewId.FOLDERS);
      view.setIncludeFolders(true);
      view.setSelectFolderEnabled(true);
      view.setMimeTypes("application/vnd.google-apps.folder");

      const builder = new picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(cfg.access_token)
        .setDeveloperKey(cfg.api_key)
        .setTitle("Select a Google Drive folder to sync")
        .setCallback((data) => {
          if (data.action === picker.Action.PICKED && data.docs?.length) {
            const folder = data.docs[0];
            updateMutation.mutate({
              folder_id: folder.id,
              folder_path: folder.name,
            });
          }
        });
      if (cfg.app_id) builder.setAppId(cfg.app_id);

      builder.build().setVisible(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Couldn't open Google Drive picker";
      toast.error("Picker failed", { description: msg });
    } finally {
      setOpening(false);
    }
  }, [connection.id, updateMutation]);

  const hasFolder = connection.folder_id !== null;
  const buttonLabel = label ?? (hasFolder ? "Change folder" : "Select folder");

  return (
    <button
      type="button"
      onClick={openPicker}
      disabled={opening || updateMutation.isPending}
      className={
        variant === "primary"
          ? "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          : "inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-50"
      }
      title={
        hasFolder
          ? "Pick a different Drive folder to sync"
          : "Pick a Drive folder so we can start syncing"
      }
    >
      {opening || updateMutation.isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {updateMutation.isPending ? "Saving…" : "Opening…"}
        </>
      ) : (
        <>
          <FolderTree className="h-3.5 w-3.5" />
          {buttonLabel}
        </>
      )}
    </button>
  );
}
