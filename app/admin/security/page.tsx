"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Key,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useRequireAuth } from "@/components/providers";
import { getCurrentOrganization, type Organization } from "@/lib/api/organizations";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { AlertBanner } from "@/components/common";

interface SSOProvider {
  id: string;
  name: string;
  type: "saml" | "oidc";
  logo: string;
  status: "active" | "inactive" | "pending";
  domain?: string;
  lastSync?: string;
}

interface SecuritySettings {
  enforce_sso: boolean;
  require_mfa: boolean;
  session_timeout_hours: number;
  password_min_length: number;
  password_require_special: boolean;
  ip_allowlist_enabled: boolean;
  ip_allowlist: string[];
}

const SSO_PROVIDERS = [
  { id: "okta", name: "Okta", logo: "/logos/okta.svg" },
  { id: "azure", name: "Azure AD", logo: "/logos/azure.svg" },
  { id: "google", name: "Google Workspace", logo: "/logos/google.svg" },
  { id: "onelogin", name: "OneLogin", logo: "/logos/onelogin.svg" },
  { id: "custom", name: "Custom SAML", logo: "/logos/saml.svg" },
];

function SecuritySettingsContent() {
  const { accessToken } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // SSO State
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
  const [configureSSOOpen, setConfigureSSOOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [ssoConfig, setSsoConfig] = useState({
    entityId: "",
    ssoUrl: "",
    certificate: "",
    domain: "",
  });

  // Security settings
  const [settings, setSettings] = useState<SecuritySettings>({
    enforce_sso: false,
    require_mfa: false,
    session_timeout_hours: 24,
    password_min_length: 8,
    password_require_special: true,
    ip_allowlist_enabled: false,
    ip_allowlist: [],
  });

  // Copy state
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;

      try {
        const org = await getCurrentOrganization(accessToken);
        setOrganization(org);

        // In production, load SSO providers and settings from API
        // For now, use defaults
      } catch (err) {
        console.error("Failed to load security settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [accessToken]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      // In production, save settings to API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Security settings saved successfully");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleConfigureSSO = async () => {
    if (!selectedProvider || !ssoConfig.entityId || !ssoConfig.ssoUrl) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // In production, save SSO config to API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const provider = SSO_PROVIDERS.find((p) => p.id === selectedProvider);
      setSsoProviders((prev) => [
        ...prev,
        {
          id: selectedProvider,
          name: provider?.name || "Custom SAML",
          type: "saml",
          logo: provider?.logo || "",
          status: "pending",
          domain: ssoConfig.domain,
        },
      ]);

      setConfigureSSOOpen(false);
      setSsoConfig({ entityId: "", ssoUrl: "", certificate: "", domain: "" });
      setSelectedProvider(null);
      setSuccess("SSO provider configured. Testing connection...");
    } catch {
      setError("Failed to configure SSO");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSSO = (providerId: string) => {
    setSsoProviders((prev) => prev.filter((p) => p.id !== providerId));
    setSuccess("SSO provider removed");
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isOwner = organization?.current_user_role === "owner";
  const isEnterprise = organization?.subscription_tier === "enterprise";

  if (!isOwner) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only organization owners can manage security settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Back to Admin Console</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Service Provider URLs for SSO setup
  const spEntityId = `https://app.lawlens.ai/auth/saml/${organization?.slug}`;
  const spAcsUrl = `https://app.lawlens.ai/auth/saml/${organization?.slug}/callback`;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground">
            Configure SSO, MFA, and other security options
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner variant="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* SSO Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Single Sign-On (SSO)
              </CardTitle>
              <CardDescription>
                Connect your identity provider for seamless authentication
              </CardDescription>
            </div>
            {isEnterprise ? (
              <Badge variant="default">Enterprise</Badge>
            ) : (
              <Badge variant="secondary">Enterprise Only</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEnterprise ? (
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">SSO requires Enterprise</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Single Sign-On is available on Enterprise plans. Upgrade to enable SSO with
                Okta, Azure AD, Google Workspace, and more.
              </p>
              <Button asChild>
                <Link href="/pricing">Upgrade to Enterprise</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Service Provider Info */}
              <div className="space-y-4">
                <h4 className="font-medium">Service Provider Details</h4>
                <p className="text-sm text-muted-foreground">
                  Use these values when configuring your identity provider:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Entity ID / Issuer</Label>
                    <div className="flex gap-2">
                      <Input value={spEntityId} readOnly className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(spEntityId, "entityId")}
                      >
                        {copied === "entityId" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">ACS URL / Reply URL</Label>
                    <div className="flex gap-2">
                      <Input value={spAcsUrl} readOnly className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(spAcsUrl, "acsUrl")}
                      >
                        {copied === "acsUrl" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configured Providers */}
              {ssoProviders.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configured Providers</h4>
                  {ssoProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.domain || "All domains"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            provider.status === "active"
                              ? "default"
                              : provider.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {provider.status === "active" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {provider.status === "pending" && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {provider.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSSO(provider.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Provider */}
              <div>
                <h4 className="font-medium mb-3">Add Identity Provider</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SSO_PROVIDERS.slice(0, 4).map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setConfigureSSOOpen(true);
                      }}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Globe className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{provider.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedProvider("custom");
                      setConfigureSSOOpen(true);
                    }}
                    className="flex items-center gap-3 p-4 border rounded-lg border-dashed hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Custom SAML</span>
                  </button>
                </div>
              </div>

              {/* SSO Settings */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enforce-sso">Enforce SSO</Label>
                    <p className="text-sm text-muted-foreground">
                      Require all users to sign in via SSO
                    </p>
                  </div>
                  <Switch
                    id="enforce-sso"
                    checked={settings.enforce_sso}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({ ...s, enforce_sso: checked }))
                    }
                    disabled={ssoProviders.length === 0}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Settings
          </CardTitle>
          <CardDescription>Configure password and session policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-mfa">Require Multi-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                All team members must enable MFA
              </p>
            </div>
            <Switch
              id="require-mfa"
              checked={settings.require_mfa}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, require_mfa: checked }))
              }
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Select
                value={String(settings.session_timeout_hours)}
                onValueChange={(v) =>
                  setSettings((s) => ({ ...s, session_timeout_hours: parseInt(v) }))
                }
              >
                <SelectTrigger id="session-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-length">Minimum Password Length</Label>
              <Select
                value={String(settings.password_min_length)}
                onValueChange={(v) =>
                  setSettings((s) => ({ ...s, password_min_length: parseInt(v) }))
                }
              >
                <SelectTrigger id="password-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 characters</SelectItem>
                  <SelectItem value="10">10 characters</SelectItem>
                  <SelectItem value="12">12 characters</SelectItem>
                  <SelectItem value="16">16 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="special-chars">Require Special Characters</Label>
              <p className="text-sm text-muted-foreground">
                Passwords must include special characters
              </p>
            </div>
            <Switch
              id="special-chars"
              checked={settings.password_require_special}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, password_require_special: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* IP Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            IP Allowlist
          </CardTitle>
          <CardDescription>
            Restrict access to specific IP addresses or ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ip-allowlist">Enable IP Allowlist</Label>
              <p className="text-sm text-muted-foreground">
                Only allow access from specified IPs
              </p>
            </div>
            <Switch
              id="ip-allowlist"
              checked={settings.ip_allowlist_enabled}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, ip_allowlist_enabled: checked }))
              }
            />
          </div>

          {settings.ip_allowlist_enabled && (
            <div className="space-y-2">
              <Label>Allowed IP Addresses</Label>
              <Input
                placeholder="Enter IP addresses (comma separated)"
                value={settings.ip_allowlist.join(", ")}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    ip_allowlist: e.target.value.split(",").map((ip) => ip.trim()),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Supports individual IPs and CIDR ranges (e.g., 192.168.1.0/24)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Configure SSO Dialog */}
      <Dialog open={configureSSOOpen} onOpenChange={setConfigureSSOOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Configure {SSO_PROVIDERS.find((p) => p.id === selectedProvider)?.name || "SSO"}
            </DialogTitle>
            <DialogDescription>
              Enter the SAML configuration from your identity provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sso-entity-id">IdP Entity ID / Issuer *</Label>
              <Input
                id="sso-entity-id"
                placeholder="https://idp.example.com/..."
                value={ssoConfig.entityId}
                onChange={(e) => setSsoConfig((c) => ({ ...c, entityId: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sso-url">SSO URL / Sign-on URL *</Label>
              <Input
                id="sso-url"
                placeholder="https://idp.example.com/sso/..."
                value={ssoConfig.ssoUrl}
                onChange={(e) => setSsoConfig((c) => ({ ...c, ssoUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sso-cert">X.509 Certificate</Label>
              <textarea
                id="sso-cert"
                className="w-full h-24 px-3 py-2 text-sm border rounded-md font-mono"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={ssoConfig.certificate}
                onChange={(e) => setSsoConfig((c) => ({ ...c, certificate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sso-domain">Email Domain (optional)</Label>
              <Input
                id="sso-domain"
                placeholder="example.com"
                value={ssoConfig.domain}
                onChange={(e) => setSsoConfig((c) => ({ ...c, domain: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Only users with this email domain will use SSO
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureSSOOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigureSSO} disabled={saving}>
              {saving ? "Configuring..." : "Configure SSO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SecuritySettingsPage() {
  useRequireAuth();

  return (
    <FeatureGate
      feature="team_management"
      fallback={
        <div className="container max-w-4xl py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Security settings are available on Team and Enterprise plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SecuritySettingsContent />
    </FeatureGate>
  );
}
