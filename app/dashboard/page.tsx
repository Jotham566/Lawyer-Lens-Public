"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquareText,
  FileText,
  Gavel,
  ScrollText,
  ArrowRight,
  Clock,
  Sparkles,
  BookMarked,
  Activity,
  Zap,
  Crown,
  Users,
  ChevronRight,
  X,
  ExternalLink,
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
import { Progress } from "@/components/ui/progress";
import { useAuth, useRequireAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";
import { PageLoading } from "@/components/common";
import { useRecentResearchSessions, useSavedDocuments } from "@/lib/stores";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Tier display configuration
const tierConfig: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  free: { label: "Free", color: "text-slate-600 border-slate-300", icon: Zap },
  professional: { label: "Pro", color: "text-blue-600 border-blue-300", icon: Crown },
  team: { label: "Team", color: "text-purple-600 border-purple-300", icon: Users },
  enterprise: { label: "Enterprise", color: "text-amber-600 border-amber-300", icon: Crown },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { canShowContent } = useRequireAuth();
  const { user } = useAuth();
  const { entitlements, loading: entitlementsLoading, getUsage, refresh: refreshEntitlements } = useEntitlements();
  const recentResearchSessions = useRecentResearchSessions(5);
  const savedDocuments = useSavedDocuments();

  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Refresh entitlements when dashboard mounts to get latest usage
  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  // Check localStorage for onboarding dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem("dashboard_onboarding_dismissed");
    if (dismissed === "true") {
      setShowOnboarding(false);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const repoStats = await getRepositoryStats();
        setStats(repoStats);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("dashboard_onboarding_dismissed", "true");
  };

  if (!canShowContent || loading || entitlementsLoading) {
    return <PageLoading message="Loading dashboard..." />;
  }

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const currentTier = entitlements?.tier || "free";
  const tierInfo = tierConfig[currentTier] || tierConfig.free;
  const TierIcon = tierInfo.icon;

  // Helper to get count by type
  const getTypeCount = (type: string): number => {
    if (!stats) return 0;
    const found = stats.by_type.find((t) => t.document_type === type);
    return found?.count || 0;
  };

  // Get usage data (keys match backend UsageType enum values)
  const aiQueriesUsage = getUsage("ai_query");
  const deepResearchUsage = getUsage("deep_research");
  const contractDraftUsage = getUsage("contract_draft");

  const queriesRemaining = aiQueriesUsage?.is_unlimited
    ? null
    : (aiQueriesUsage?.limit || 0) - (aiQueriesUsage?.current || 0);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your legal research workspace
          </p>
        </div>
        <Badge variant="outline" className={cn("gap-1.5 px-3 py-1", tierInfo.color)}>
          <TierIcon className="h-3.5 w-3.5" />
          {tierInfo.label}
        </Badge>
      </div>

      {/* Primary CTA - Legal Assistant */}
      <Card className="overflow-hidden border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-purple-500/5 dark:from-primary/10 dark:via-background dark:to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-lg">Ask a Legal Question</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Get instant answers with citations from Ugandan legislation and case law.
              </p>
              {queriesRemaining !== null && (
                <p className="text-xs text-muted-foreground/70">
                  {queriesRemaining > 0
                    ? `${queriesRemaining} free queries remaining this month`
                    : "Monthly limit reached — upgrade for more"
                  }
                </p>
              )}
            </div>
            <Button size="lg" asChild className="shrink-0 shadow-sm">
              <Link href="/chat">
                Start Asking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Browse Sections - Main navigation */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">BROWSE</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/legislation/acts" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="font-medium">Acts of Parliament</p>
                  <p className="text-2xl font-bold mt-1">
                    {getTypeCount("act").toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Primary legislation</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/judgments" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                    <Gavel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="font-medium">Case Law</p>
                  <p className="text-2xl font-bold mt-1">
                    {getTypeCount("judgment").toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Court judgments</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/legislation/regulations" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-green-200 dark:hover:border-green-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/50">
                    <ScrollText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="font-medium">Regulations</p>
                  <p className="text-2xl font-bold mt-1">
                    {getTypeCount("regulation").toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Statutory instruments</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/search" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                    <Search className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="font-medium">Search All</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats?.total_documents.toLocaleString() || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total documents</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes more space */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <Link href="/library">
                    View Library
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentResearchSessions.length > 0 ? (
                <div className="space-y-1">
                  {recentResearchSessions.slice(0, 5).map((session, i) => (
                    <Link
                      key={session.id}
                      href={`/research?session=${session.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Start by asking a question or searching documents
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/chat">
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Ask a Question
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Account & Quick Links */}
        <div className="space-y-4">
          {/* Usage Summary - Clear metrics display */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Usage This Month
                </CardTitle>
                <Badge variant="outline" className={cn("text-xs gap-1", tierInfo.color)}>
                  <TierIcon className="h-3 w-3" />
                  {tierInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Queries - Primary metric, always show */}
              {aiQueriesUsage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">AI Queries</span>
                  </div>
                  {aiQueriesUsage.is_unlimited ? (
                    <p className="text-sm text-muted-foreground">Unlimited</p>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-bold">{aiQueriesUsage.current}</span>
                          <span className="text-muted-foreground text-sm ml-1">
                            / {aiQueriesUsage.limit} used
                          </span>
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          aiQueriesUsage.is_at_limit ? "text-red-500" : "text-green-600 dark:text-green-400"
                        )}>
                          {aiQueriesUsage.remaining} left
                        </span>
                      </div>
                      <Progress
                        value={aiQueriesUsage.percentage || 0}
                        className={cn(
                          "h-2",
                          (aiQueriesUsage.percentage || 0) > 80 && "[&>div]:bg-amber-500",
                          aiQueriesUsage.is_at_limit && "[&>div]:bg-red-500"
                        )}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Other usage types - compact display */}
              {(deepResearchUsage || contractDraftUsage) && (
                <div className="pt-3 border-t space-y-2">
                  {deepResearchUsage && !deepResearchUsage.is_unlimited && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5" />
                        Deep Research
                      </span>
                      <span className="font-medium">
                        {deepResearchUsage.current} / {deepResearchUsage.limit}
                        <span className="text-muted-foreground ml-1">
                          ({deepResearchUsage.remaining} left)
                        </span>
                      </span>
                    </div>
                  )}
                  {contractDraftUsage && !contractDraftUsage.is_unlimited && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Contract Drafts
                      </span>
                      <span className="font-medium">
                        {contractDraftUsage.current} / {contractDraftUsage.limit}
                        <span className="text-muted-foreground ml-1">
                          ({contractDraftUsage.remaining} left)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* No usage data fallback */}
              {!aiQueriesUsage && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">Loading usage data...</p>
                </div>
              )}

              {/* Upgrade CTA for free tier */}
              {currentTier === "free" && (
                <div className="pt-3 border-t">
                  <Link
                    href="/pricing"
                    className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400 hover:underline group"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Upgrade for more
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Documents */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-muted-foreground" />
                  Saved Documents
                </CardTitle>
                {savedDocuments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {savedDocuments.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {savedDocuments.length > 0 ? (
                <div className="space-y-1">
                  {savedDocuments.slice(0, 4).map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/document/${doc.id}`}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-sm group"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1 group-hover:text-primary transition-colors">
                        {doc.title}
                      </span>
                    </Link>
                  ))}
                  {savedDocuments.length > 4 && (
                    <Link
                      href="/library"
                      className="flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      View all {savedDocuments.length} documents
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookMarked className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No saved documents</p>
                  <Button variant="link" size="sm" asChild className="mt-1 h-auto p-0 text-xs">
                    <Link href="/search">Browse documents</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              <Link
                href="/library"
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-sm"
              >
                <BookMarked className="h-4 w-4 text-muted-foreground" />
                <span>My Library</span>
              </Link>
              <Link
                href="/legislation/constitution"
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Constitution</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-sm"
              >
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onboarding Tips - Only for new users, dismissible */}
      {showOnboarding && recentResearchSessions.length === 0 && (
        <Card className="border-dashed relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={dismissOnboarding}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Make the most of Law Lens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Ask questions</p>
                  <p className="text-xs text-muted-foreground">
                    Use plain language to ask about Ugandan law
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Browse documents</p>
                  <p className="text-xs text-muted-foreground">
                    Explore acts, judgments, and regulations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Save to library</p>
                  <p className="text-xs text-muted-foreground">
                    Bookmark documents for quick access
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
