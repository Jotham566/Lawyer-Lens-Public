"use client";

/**
 * API Key Creation Form.
 *
 * Enterprise feature: Create new API keys with scope selection.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Check, Key, AlertTriangle, Loader2 } from "lucide-react";
import {
  getAvailableScopes,
  createAPIKey,
  APIKeyScope,
  APIKeyCreateResponse,
} from "@/lib/api/integrations";

interface APIKeyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function APIKeyForm({ open, onOpenChange, onSuccess }: APIKeyFormProps) {
  const [scopes, setScopes] = useState<APIKeyScope[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingScopes, setLoadingScopes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<APIKeyCreateResponse | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rateLimit, setRateLimit] = useState("60");
  const [dailyLimit, setDailyLimit] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("");

  // Load available scopes
  useEffect(() => {
    if (open && scopes.length === 0) {
      loadScopes();
    }
  }, [open, scopes.length]);

  const loadScopes = async () => {
    setLoadingScopes(true);
    try {
      const response = await getAvailableScopes();
      setScopes(response.scopes);
    } catch (err) {
      console.error("Failed to load available scopes:", err);
      setError("Failed to load available scopes");
    } finally {
      setLoadingScopes(false);
    }
  };

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await createAPIKey({
        name: name.trim(),
        description: description.trim() || undefined,
        scopes: selectedScopes,
        rate_limit_per_minute: parseInt(rateLimit, 10) || 60,
        daily_limit: dailyLimit ? parseInt(dailyLimit, 10) : undefined,
        expires_in_days: expiresIn ? parseInt(expiresIn, 10) : undefined,
      });

      setCreatedKey(response);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create API key";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (createdKey?.full_key) {
      await navigator.clipboard.writeText(createdKey.full_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (createdKey) {
      onSuccess();
    }
    // Reset form
    setName("");
    setDescription("");
    setSelectedScopes([]);
    setRateLimit("60");
    setDailyLimit("");
    setExpiresIn("");
    setCreatedKey(null);
    setError(null);
    onOpenChange(false);
  };

  // Group scopes by category
  const scopesByCategory = scopes.reduce(
    (acc, scope) => {
      const category = scope.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(scope);
      return acc;
    },
    {} as Record<string, APIKeyScope[]>
  );

  // Success state - show key
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Save this key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive" className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Important</AlertTitle>
              <AlertDescription className="text-amber-700">
                Copy your API key now. For security, it will not be shown again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={createdKey.full_key}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{createdKey.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Key Prefix:</span>
                <p className="font-mono">{createdKey.key_prefix}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Rate Limit:</span>
                <p>{createdKey.rate_limit_per_minute}/min</p>
              </div>
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <p>
                  {createdKey.expires_at
                    ? new Date(createdKey.expires_at).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access to your organization&apos;s
            data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production API Key"
                required
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name to identify this key
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this key is used for"
                rows={2}
                maxLength={1000}
              />
            </div>
          </div>

          {/* Scopes */}
          <div className="space-y-4">
            <Label>Permissions *</Label>
            {loadingScopes ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available scopes...
              </div>
            ) : (
              <div className="grid gap-4 rounded-lg border p-4">
                {Object.entries(scopesByCategory).map(
                  ([category, categoryScopes]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm">{category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryScopes.map((scope) => (
                          <div
                            key={scope.scope}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={scope.scope}
                              checked={selectedScopes.includes(scope.scope)}
                              onCheckedChange={() =>
                                handleScopeToggle(scope.scope)
                              }
                            />
                            <label
                              htmlFor={scope.scope}
                              className="text-sm cursor-pointer"
                            >
                              <span className="font-mono text-xs">
                                {scope.scope}
                              </span>
                              <p className="text-muted-foreground text-xs">
                                {scope.description}
                              </p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
            {selectedScopes.length === 0 && (
              <p className="text-xs text-destructive">
                Select at least one permission
              </p>
            )}
          </div>

          {/* Rate Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateLimit">Rate Limit (req/min)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground">
                Max requests per minute (1-1000)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Limit (optional)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                min={1}
                placeholder="Unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Max requests per day
              </p>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiresIn">Expiration</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger>
                <SelectValue placeholder="Never expires" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Never expires</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedScopes.length === 0 || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create API Key"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
