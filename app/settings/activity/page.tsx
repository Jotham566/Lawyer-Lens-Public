"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  MessageSquare,
  Search,
  FileText,
  HardDrive,
  Zap,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  getActivityHistory,
  formatUsageType,
  type ActivityRecord,
} from "@/lib/api/billing";

// Import reusable components
import {
  PageHeader,
  AlertBanner,
  PageLoading,
  EmptyState,
} from "@/components/common";
import { FeatureGate } from "@/components/entitlements/feature-gate";

const usageTypeIcons: Record<string, React.ElementType> = {
  ai_query: MessageSquare,
  deep_research: Search,
  contract_draft: FileText,
  contract_analysis: FileText,
  storage_gb: HardDrive,
  api_call: Zap,
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function ActivityContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { accessToken } = useAuth();

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [days, setDays] = useState<number>(30);

  // Load activity history
  useEffect(() => {
    async function loadActivity() {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getActivityHistory(accessToken, {
          usageType: filter === "all" ? undefined : filter,
          days,
        });
        setActivities(data);
      } catch {
        setError("Failed to load activity history");
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      loadActivity();
    }
  }, [accessToken, filter, days]);

  const handleRefresh = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getActivityHistory(accessToken, {
        usageType: filter === "all" ? undefined : filter,
        days,
      });
      setActivities(data);
    } catch {
      setError("Failed to load activity history");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading) {
    return <PageLoading message="Loading activity..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Activity Log"
        description="View your organization's recent activity and usage"
      />

      {/* Feedback Messages */}
      {error && (
        <AlertBanner
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Activity Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="ai_query">AI Queries</SelectItem>
                    <SelectItem value="deep_research">Deep Research</SelectItem>
                    <SelectItem value="contract_draft">Contract Drafts</SelectItem>
                    <SelectItem value="contract_analysis">Contract Analysis</SelectItem>
                    <SelectItem value="api_call">API Calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
            {!loading && (
              <Badge variant="secondary" className="ml-2">
                {activities.length} events
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Usage events from the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border animate-pulse">
                  <div className="h-10 w-10 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity found"
              description={
                filter === "all"
                  ? "No activity recorded in this time period"
                  : `No ${formatUsageType(filter)} activity found`
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => {
                const Icon = usageTypeIcons[activity.usage_type] || Activity;

                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {/* Activity Info */}
                      <div>
                        <p className="font-medium">
                          {formatUsageType(activity.usage_type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(activity.recorded_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity Badge */}
                      {activity.quantity > 1 && (
                        <Badge variant="secondary">
                          x{activity.quantity}
                        </Badge>
                      )}
                      {/* Type Badge */}
                      <Badge variant="outline" className="capitalize">
                        {activity.usage_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <FeatureGate
      feature="activity_logs"
      requiredTier="team"
      featureName="Activity Logs"
    >
      <ActivityContent />
    </FeatureGate>
  );
}
