"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  Calendar,
  User,
  Shield,
  FileText,
  Settings,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  Edit,
  Trash,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth, useRequireAuth } from "@/components/providers";
import { getCurrentOrganization, type Organization } from "@/lib/api/organizations";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { formatRelativeTime, formatDateTime } from "@/lib/utils/date-formatter";

// Audit log event types
type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.password_change"
  | "auth.mfa_enable"
  | "auth.mfa_disable"
  | "member.invite"
  | "member.join"
  | "member.remove"
  | "member.role_change"
  | "member.suspend"
  | "member.reactivate"
  | "org.settings_update"
  | "org.billing_update"
  | "document.view"
  | "document.download"
  | "document.search"
  | "research.create"
  | "research.delete";

interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  user_id: string;
  user_email: string;
  user_name: string;
  ip_address: string;
  user_agent: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

const EVENT_CATEGORIES = {
  auth: { label: "Authentication", icon: Shield, color: "text-blue-600" },
  member: { label: "Team", icon: User, color: "text-green-600" },
  org: { label: "Organization", icon: Settings, color: "text-purple-600" },
  document: { label: "Documents", icon: FileText, color: "text-orange-600" },
  research: { label: "Research", icon: Eye, color: "text-cyan-600" },
};

const EVENT_LABELS: Record<AuditEventType, { label: string; icon: React.ElementType }> = {
  "auth.login": { label: "User logged in", icon: LogIn },
  "auth.logout": { label: "User logged out", icon: LogOut },
  "auth.password_change": { label: "Password changed", icon: Shield },
  "auth.mfa_enable": { label: "MFA enabled", icon: Shield },
  "auth.mfa_disable": { label: "MFA disabled", icon: Shield },
  "member.invite": { label: "Member invited", icon: UserPlus },
  "member.join": { label: "Member joined", icon: UserPlus },
  "member.remove": { label: "Member removed", icon: UserMinus },
  "member.role_change": { label: "Role changed", icon: Edit },
  "member.suspend": { label: "Member suspended", icon: UserMinus },
  "member.reactivate": { label: "Member reactivated", icon: UserPlus },
  "org.settings_update": { label: "Settings updated", icon: Settings },
  "org.billing_update": { label: "Billing updated", icon: Settings },
  "document.view": { label: "Document viewed", icon: Eye },
  "document.download": { label: "Document downloaded", icon: Download },
  "document.search": { label: "Search performed", icon: Search },
  "research.create": { label: "Research created", icon: FileText },
  "research.delete": { label: "Research deleted", icon: Trash },
};

function getEventCategory(eventType: AuditEventType): keyof typeof EVENT_CATEGORIES {
  return eventType.split(".")[0] as keyof typeof EVENT_CATEGORIES;
}

// Generate mock audit logs for demo
function generateMockAuditLogs(): AuditLogEntry[] {
  const events: AuditLogEntry[] = [];
  const users = [
    { id: "1", email: "admin@example.com", name: "Admin User" },
    { id: "2", email: "john@example.com", name: "John Doe" },
    { id: "3", email: "jane@example.com", name: "Jane Smith" },
  ];

  const eventTypes: AuditEventType[] = [
    "auth.login",
    "auth.logout",
    "member.invite",
    "member.role_change",
    "document.view",
    "document.search",
    "research.create",
    "org.settings_update",
  ];

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

    events.push({
      id: `audit-${i}`,
      event_type: eventType,
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      target_name: eventType.includes("document")
        ? "Employment Act 2006"
        : eventType.includes("member")
        ? "newuser@example.com"
        : undefined,
      created_at: timestamp.toISOString(),
    });
  }

  return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function AuditLogsContent() {
  const { accessToken } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7d");

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;

      try {
        const org = await getCurrentOrganization(accessToken);
        setOrganization(org);

        // In production, this would fetch from audit log API
        // For now, use mock data
        setLogs(generateMockAuditLogs());
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [accessToken]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || getEventCategory(log.event_type) === categoryFilter;

    // Date filter
    const logDate = new Date(log.created_at);
    const now = new Date();
    let matchesDate = true;
    if (dateFilter === "24h") {
      matchesDate = now.getTime() - logDate.getTime() < 24 * 60 * 60 * 1000;
    } else if (dateFilter === "7d") {
      matchesDate = now.getTime() - logDate.getTime() < 7 * 24 * 60 * 60 * 1000;
    } else if (dateFilter === "30d") {
      matchesDate = now.getTime() - logDate.getTime() < 30 * 24 * 60 * 60 * 1000;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Email", "Event", "Target", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          log.user_name,
          log.user_email,
          EVENT_LABELS[log.event_type]?.label || log.event_type,
          log.target_name || "",
          log.ip_address,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const isAdmin =
    organization?.current_user_role === "admin" || organization?.current_user_role === "owner";

  if (!isAdmin) {
    return (
      <div className="container max-w-6xl py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be an admin or owner to view audit logs.
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

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all activity in your organization
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(EVENT_CATEGORIES).map(([key, { label, icon: Icon, color }]) => {
          const count = logs.filter((l) => getEventCategory(l.event_type) === key).length;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${
                categoryFilter === key ? "border-primary" : ""
              }`}
              onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(EVENT_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.slice(0, 50).map((log) => {
                const eventInfo = EVENT_LABELS[log.event_type];
                const category = getEventCategory(log.event_type);
                const categoryInfo = EVENT_CATEGORIES[category];
                const Icon = eventInfo?.icon || FileText;

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded bg-muted`}>
                          <Icon className={`h-3.5 w-3.5 ${categoryInfo.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {eventInfo?.label || log.event_type}
                          </p>
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {categoryInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.user_name}</p>
                        <p className="text-xs text-muted-foreground">{log.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.target_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.ip_address}
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-sm text-muted-foreground hover:text-foreground">
                            {formatRelativeTime(log.created_at)}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <p className="text-sm">
                            {formatDateTime(log.created_at)}
                          </p>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredLogs.length > 50 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Showing 50 of {filteredLogs.length} events
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditLogsPage() {
  useRequireAuth();

  return (
    <FeatureGate
      feature="audit_logs"
      fallback={
        <div className="container max-w-6xl py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Audit logs are available on Team and Enterprise plans.
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
      <AuditLogsContent />
    </FeatureGate>
  );
}
