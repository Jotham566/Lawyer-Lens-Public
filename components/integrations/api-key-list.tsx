"use client";

/**
 * API Key List Component.
 *
 * Enterprise feature: Displays and manages organization API keys.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Trash2,
  BarChart3,
  Copy,
  Check,
  Key,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { APIKey, revokeAPIKey, getAPIKeyUsage, UsageStats } from "@/lib/api/integrations";
import { formatDistanceToNow } from "date-fns";

interface APIKeyListProps {
  keys: APIKey[];
  loading: boolean;
  onRefresh: () => void;
}

export function APIKeyList({ keys, loading, onRefresh }: APIKeyListProps) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<APIKey | null>(null);
  const [copiedPrefix, setCopiedPrefix] = useState<string | null>(null);
  const [usageKey, setUsageKey] = useState<APIKey | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const handleCopyPrefix = async (prefix: string) => {
    await navigator.clipboard.writeText(prefix);
    setCopiedPrefix(prefix);
    setTimeout(() => setCopiedPrefix(null), 2000);
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;

    setRevoking(keyToRevoke.id);
    try {
      await revokeAPIKey(keyToRevoke.id);
      onRefresh();
    } catch (error) {
      console.error("Failed to revoke key:", error);
    } finally {
      setRevoking(null);
      setKeyToRevoke(null);
    }
  };

  const handleViewUsage = async (key: APIKey) => {
    setUsageKey(key);
    setLoadingUsage(true);
    try {
      const stats = await getAPIKeyUsage(key.id);
      setUsageStats(stats);
    } catch (error) {
      console.error("Failed to load usage:", error);
    } finally {
      setLoadingUsage(false);
    }
  };

  const getStatusBadge = (key: APIKey) => {
    if (!key.is_active) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Key className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No API Keys</h3>
        <p className="text-muted-foreground mt-1">
          Create an API key to enable programmatic access.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Scopes</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{key.name}</p>
                    {key.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {key.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {key.key_prefix}...
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyPrefix(key.key_prefix)}
                    >
                      {copiedPrefix === key.key_prefix ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {key.scopes.slice(0, 3).map((scope) => (
                      <Badge
                        key={scope}
                        variant="outline"
                        className="text-xs"
                      >
                        {scope.split(":")[0]}
                      </Badge>
                    ))}
                    {key.scopes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{key.scopes.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{key.requests_today.toLocaleString()} today</p>
                    <p className="text-xs text-muted-foreground">
                      {key.total_requests.toLocaleString()} total
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {key.last_used_at ? (
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(key.last_used_at), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(key)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewUsage(key)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Usage
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {key.is_active && (
                        <DropdownMenuItem
                          onClick={() => setKeyToRevoke(key)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revoke Key
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={!!keyToRevoke}
        onOpenChange={(open) => !open && setKeyToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke API Key
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{" "}
              <strong>{keyToRevoke?.name}</strong>? This action cannot be undone
              and will immediately invalidate the key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={!!revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Key"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Usage Stats Dialog */}
      <Dialog
        open={!!usageKey}
        onOpenChange={(open) => {
          if (!open) {
            setUsageKey(null);
            setUsageStats(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics
            </DialogTitle>
            <DialogDescription>
              Usage data for {usageKey?.name}
            </DialogDescription>
          </DialogHeader>

          {loadingUsage ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : usageStats ? (
            <div className="space-y-6 py-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {usageStats.requests_today.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    {usageStats.total_requests.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Avg Response Time */}
              {usageStats.avg_response_time_ms !== null && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Avg Response Time
                  </p>
                  <p className="text-lg font-medium">
                    {usageStats.avg_response_time_ms.toFixed(0)} ms
                  </p>
                </div>
              )}

              {/* Top Endpoints */}
              {usageStats.endpoint_breakdown.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Top Endpoints</h4>
                  <div className="space-y-2">
                    {usageStats.endpoint_breakdown.slice(0, 5).map((ep, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[250px]">
                          {ep.endpoint}
                        </code>
                        <span className="text-muted-foreground">
                          {ep.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Stats Chart (simple bar representation) */}
              {usageStats.daily_stats.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Last 7 Days</h4>
                  <div className="space-y-1">
                    {usageStats.daily_stats.slice(-7).map((day, i) => {
                      const maxCount = Math.max(
                        ...usageStats.daily_stats.map((d) => d.count)
                      );
                      const percentage =
                        maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-20 text-muted-foreground">
                            {new Date(day.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                            <div
                              className="h-full bg-primary rounded"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-right">
                            {day.count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No usage data available
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
