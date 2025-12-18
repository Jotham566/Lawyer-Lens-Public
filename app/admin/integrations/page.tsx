"use client";

/**
 * Integrations Management Page.
 *
 * Enterprise feature: API key management for organization integrations.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { APIKeyForm } from "@/components/integrations/api-key-form";
import { APIKeyList } from "@/components/integrations/api-key-list";
import { listAPIKeys, APIKey } from "@/lib/api/integrations";
import {
  Plus,
  Key,
  Shield,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function IntegrationsPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAPIKeys(showRevoked);
      setKeys(response.items);
    } catch (err) {
      setError("Failed to load API keys");
      console.error("Error loading API keys:", err);
    } finally {
      setLoading(false);
    }
  }, [showRevoked]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadKeys();
  };

  return (
    <FeatureGate feature="api_access" requiredTier="team">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Key className="h-8 w-8" />
              API Integrations
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage API keys for programmatic access to your organization&apos;s
              data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadKeys}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </div>

        {/* Security Info */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Best Practices</AlertTitle>
          <AlertDescription className="mt-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Never share API keys or commit them to version control</li>
              <li>Use the minimum required scopes for each integration</li>
              <li>Rotate keys regularly and revoke unused keys</li>
              <li>Set appropriate rate limits to prevent abuse</li>
            </ul>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* API Keys Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  {keys.length} key{keys.length !== 1 ? "s" : ""} configured
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showRevoked"
                  checked={showRevoked}
                  onCheckedChange={(checked) =>
                    setShowRevoked(checked as boolean)
                  }
                />
                <label
                  htmlFor="showRevoked"
                  className="text-sm cursor-pointer"
                >
                  Show revoked keys
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <APIKeyList
              keys={keys}
              loading={loading}
              onRefresh={loadKeys}
            />
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h4>Authentication</h4>
              <p>
                Include your API key in the <code>Authorization</code> header:
              </p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>
                  {`curl -H "Authorization: Bearer ak_live_..." \\
     https://api.legalintel.co/api/v1/search`}
                </code>
              </pre>

              <h4>Available Endpoints</h4>
              <p>Depending on your key&apos;s scopes, you can access:</p>
              <ul>
                <li>
                  <code>POST /api/v1/search</code> - Search legal documents
                </li>
                <li>
                  <code>GET /api/v1/documents/:id</code> - Get document details
                </li>
                <li>
                  <code>POST /api/v1/chat</code> - Legal research chat
                </li>
                <li>
                  <code>POST /api/v1/knowledge-base/search</code> - Search
                  internal documents
                </li>
              </ul>

              <h4>Rate Limits</h4>
              <p>
                Each API key has configurable rate limits. When limits are
                exceeded, the API returns <code>429 Too Many Requests</code>{" "}
                with a <code>Retry-After</code> header.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create Form Dialog */}
        <APIKeyForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </FeatureGate>
  );
}
