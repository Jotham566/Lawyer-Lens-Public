"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquareText,
  FileText,
  Gavel,
  Scale,
  ScrollText,
  ArrowRight,
  Clock,
  Sparkles,
  TrendingUp,
  BookMarked,
  Activity,
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
import { useAuth, useRequireAuth } from "@/components/providers";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";
import { PageLoading } from "@/components/common";
import { useRecentResearchSessions } from "@/lib/stores";
import { formatDistanceToNow } from "date-fns";

const quickActions = [
  {
    title: "Search Documents",
    description: "Find legislation and case law",
    icon: Search,
    href: "/search",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    title: "Legal Assistant",
    description: "Ask legal questions",
    icon: MessageSquareText,
    href: "/chat",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    title: "Browse Acts",
    description: "Explore legislation",
    icon: FileText,
    href: "/legislation/acts",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    title: "Case Law",
    description: "Court judgments",
    icon: Gavel,
    href: "/judgments",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
  },
];

const recentActivity = [
  {
    type: "search",
    title: 'Searched "Employment Act"',
    timestamp: "2 hours ago",
    icon: Search,
  },
  {
    type: "chat",
    title: "Asked about tax regulations",
    timestamp: "Yesterday",
    icon: MessageSquareText,
  },
  {
    type: "view",
    title: "Viewed Land Act 1998",
    timestamp: "2 days ago",
    icon: FileText,
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const recentResearchSessions = useRecentResearchSessions(3);

  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (authLoading || loading) {
    return <PageLoading message="Loading dashboard..." />;
  }

  const firstName = user?.full_name?.split(" ")[0] || "there";

  // Helper to get count by type
  const getTypeCount = (type: string): number => {
    if (!stats) return 0;
    const found = stats.by_type.find((t) => t.document_type === type);
    return found?.count || 0;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Welcome back to Law Lens. What would you like to explore today?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/chat">
              <Sparkles className="mr-2 h-4 w-4" />
              Ask Legal Question
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? getTypeCount("act").toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Acts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <Gavel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? getTypeCount("judgment").toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Judgments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                <ScrollText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? getTypeCount("regulation").toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Regulations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? stats.total_documents.toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Total Docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump right into common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bgColor}`}
                    >
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {action.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your recent actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
              <Link href="/library">
                <BookMarked className="mr-2 h-4 w-4" />
                View Library
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Research Sessions */}
      {recentResearchSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Recent Research
            </CardTitle>
            <CardDescription>Your recent deep research sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResearchSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/research?session=${session.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant={session.status === "complete" ? "secondary" : "outline"}
                          className="h-5 px-1.5 text-[10px]"
                        >
                          {session.status === "complete"
                            ? "Complete"
                            : session.status === "error"
                            ? "Failed"
                            : "In Progress"}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
              <Link href="/research/history">
                View All Research
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Popular Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Categories</CardTitle>
          <CardDescription>
            Browse documents by subject area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "Employment Law",
              "Tax Law",
              "Land Law",
              "Criminal Law",
              "Family Law",
              "Corporate Law",
              "Constitutional Law",
              "Commercial Law",
            ].map((category) => (
              <Link
                key={category}
                href={`/search?q=${encodeURIComponent(category)}`}
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Tips - Show for newer users */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Getting Started Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Ask Questions</p>
                <p className="text-xs text-muted-foreground">
                  Use the Legal Assistant for natural language queries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Browse Documents</p>
                <p className="text-xs text-muted-foreground">
                  Explore acts, judgments, and regulations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Save to Library</p>
                <p className="text-xs text-muted-foreground">
                  Bookmark important documents for later
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
