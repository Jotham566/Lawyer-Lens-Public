"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Activity,
  FileText,
  TrendingUp,
  ArrowRight,
  Building2,
  Shield,
  CreditCard,
  Clock,
  UserPlus,
  Settings,
  Database,
  Key,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers";
import {
  getCurrentOrganization,
  listMembers,
  type Organization,
  type OrganizationMember,
} from "@/lib/api/organizations";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { formatRelativeTime } from "@/lib/utils/date-formatter";

interface UsageStats {
  ai_queries_used: number;
  ai_queries_limit: number;
  storage_used_gb: number;
  storage_limit_gb: number;
  documents_accessed: number;
}

interface RecentActivity {
  id: string;
  user_name: string;
  action: string;
  target: string;
  timestamp: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={`h-3 w-3 ${
                trend.isPositive ? "text-green-500" : "text-red-500 rotate-180"
              }`}
            />
            <span
              className={`text-xs ${
                trend.isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = "default",
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "primary";
}) {
  return (
    <Link href={href}>
      <Card
        className={`hover:shadow-md transition-all cursor-pointer ${
          variant === "primary" ? "border-primary/50 bg-primary/5" : ""
        }`}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={`rounded-lg p-2 ${
              variant === "primary" ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                variant === "primary" ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

function AdminDashboardContent() {
  const { isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      try {
        // Load organization and members
        const [org, membersData] = await Promise.all([
          getCurrentOrganization(),
          listMembers(),
        ]);
        setOrganization(org);
        setMembers(membersData.items);

        // Try to load usage stats
        try {
          const usageRes = await fetch(`${API_BASE}/billing/usage`, {
            credentials: "include",
          });
          if (usageRes.ok) {
            const usage = await usageRes.json();
            setUsageStats({
              ai_queries_used: usage.ai_queries?.used || 0,
              ai_queries_limit: usage.ai_queries?.limit || 100,
              storage_used_gb: usage.storage?.used_gb || 0,
              storage_limit_gb: usage.storage?.limit_gb || 5,
              documents_accessed: usage.documents_accessed || 0,
            });
          }
        } catch {
          // Usage stats optional
        }

        // Mock recent activity for now (would come from audit log API)
        setRecentActivity([
          {
            id: "1",
            user_name: "John Doe",
            action: "logged in",
            target: "Dashboard",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: "2",
            user_name: "Jane Smith",
            action: "searched for",
            target: "Employment Act 2006",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: "3",
            user_name: "Admin User",
            action: "invited",
            target: "newuser@example.com",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
        ]);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  // Check if user is admin/owner
  const isAdmin =
    organization?.current_user_role === "admin" ||
    organization?.current_user_role === "owner";

  if (loading) {
    return (
      <div className="container max-w-7xl py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-7xl py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need to be an admin or owner to access the admin console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.is_active).length;

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization: {organization?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {organization?.subscription_tier} Plan
          </Badge>
          <Button asChild size="sm">
            <Link href="/settings/organization">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Members"
          value={activeMembers}
          description={`of ${organization?.max_seats || "unlimited"} seats`}
          icon={Users}
          href="/admin/team"
        />
        <StatCard
          title="AI Queries Used"
          value={usageStats ? `${usageStats.ai_queries_used}/${usageStats.ai_queries_limit}` : "—"}
          description="This billing period"
          icon={Activity}
          href="/settings/billing/usage"
        />
        <StatCard
          title="Documents Accessed"
          value={usageStats?.documents_accessed || 0}
          description="This month"
          icon={FileText}
        />
        <StatCard
          title="Subscription"
          value={organization?.subscription_tier || "Free"}
          description={organization?.subscription_status === "active" ? "Active" : organization?.subscription_status}
          icon={CreditCard}
          href="/settings/billing/subscription"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Invite Team Members"
            description="Add new members to your organization"
            icon={UserPlus}
            href="/settings/organization/invitations"
            variant="primary"
          />
          <QuickActionCard
            title="Manage Team"
            description="View and manage team members"
            icon={Users}
            href="/admin/team"
          />
          <QuickActionCard
            title="View Audit Logs"
            description="Track team activity and changes"
            icon={Clock}
            href="/admin/audit-logs"
          />
          <QuickActionCard
            title="Billing & Usage"
            description="View usage and manage billing"
            icon={DollarSign}
            href="/admin/billing"
          />
          <QuickActionCard
            title="Organization Settings"
            description="Update organization details"
            icon={Building2}
            href="/settings/organization"
          />
          <QuickActionCard
            title="Security Settings"
            description="Configure SSO and security"
            icon={Shield}
            href="/admin/security"
          />
          <QuickActionCard
            title="Knowledge Base"
            description="Upload and search internal docs"
            icon={Database}
            href="/knowledge-base"
          />
          <QuickActionCard
            title="API Integrations"
            description="Manage API keys for integrations"
            icon={Key}
            href="/admin/integrations"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions by team members</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {activity.user_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>{" "}
                        {activity.action}{" "}
                        <span className="text-muted-foreground">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/admin/audit-logs">
                    View all activity
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Overview</CardTitle>
            <CardDescription>Your organization members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {member.full_name?.charAt(0) || member.email.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.full_name || member.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
              {members.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{members.length - 5} more members
                </p>
              )}
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/admin/team">
                  Manage team
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <FeatureGate
      feature="team_management"
      fallback={
        <div className="container max-w-7xl py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Admin Console</CardTitle>
              <CardDescription>
                The admin console is available on Team and Enterprise plans.
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
      <AdminDashboardContent />
    </FeatureGate>
  );
}
