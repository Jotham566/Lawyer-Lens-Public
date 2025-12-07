"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  ChevronRight,
  Download,
  ExternalLink,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  createResearchSession,
  getResearchSession,
  submitClarifyingAnswers,
  approveResearchBrief,
  getResearchReport,
  streamResearchProgress,
  type ResearchSession,
  type ResearchReport,
  type ClarifyAnswers,
  type StreamProgress,
  type ApproveBriefRequest,
} from "@/lib/api";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

// Map backend status values to UI labels
const statusLabels: Record<string, { label: string; description: string }> = {
  clarifying: {
    label: "Clarification",
    description: "Help us understand your research needs",
  },
  brief_review: {
    label: "Review Brief",
    description: "Review and approve research plan",
  },
  researching: {
    label: "Researching",
    description: "Searching and analyzing legal sources",
  },
  writing: {
    label: "Writing",
    description: "Creating your comprehensive report",
  },
  complete: {
    label: "Complete",
    description: "Your research report is ready",
  },
  error: {
    label: "Failed",
    description: "An error occurred during research",
  },
};

function ResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q");
  const sessionIdParam = searchParams.get("session");

  const [session, setSession] = useState<ResearchSession | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [query, setQuery] = useState(initialQuery || "");
  const [clarifyAnswers, setClarifyAnswers] = useState<ClarifyAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StreamProgress | null>(null);

  // Load existing session if session ID provided
  useEffect(() => {
    if (sessionIdParam) {
      loadSession(sessionIdParam);
    }
  }, [sessionIdParam]);

  // Auto-start if query provided
  useEffect(() => {
    if (initialQuery && !sessionIdParam && !session) {
      handleStartResearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const sessionData = await getResearchSession(sessionId);
      setSession(sessionData);

      // Use status (not phase) to determine what to show
      if (sessionData.status === "complete") {
        // Report is included in session response when complete
        if (sessionData.report) {
          setReport(sessionData.report);
        } else {
          const reportData = await getResearchReport(sessionId);
          setReport(reportData);
        }
      } else if (["researching", "writing"].includes(sessionData.status)) {
        startProgressStream(sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartResearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const newSession = await createResearchSession({ query: query.trim() });
      setSession(newSession);
      router.replace(`/research?session=${newSession.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start research");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitClarifications = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedSession = await submitClarifyingAnswers(
        session.session_id,
        clarifyAnswers
      );
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveBrief = async () => {
    if (!session || !session.research_brief) return;

    setIsLoading(true);
    setError(null);

    try {
      // Construct the ApproveBriefRequest with full brief data
      const briefRequest: ApproveBriefRequest = {
        brief: {
          query: session.research_brief.original_query,
          clarifications: session.research_brief.clarifications || [],
          jurisdictions: session.research_brief.jurisdictions || ["Uganda"],
          document_types: session.research_brief.document_types || ["legislation", "judgment"],
          time_scope: session.research_brief.time_scope || "current",
          topics: session.research_brief.topics?.map((topic) => ({
            title: topic.title,
            description: topic.description || "",
            keywords: topic.keywords || [],
            priority: topic.priority || 1,
          })) || [],
          report_format: session.research_brief.report_format || "comprehensive",
          include_recommendations: session.research_brief.include_recommendations ?? true,
        },
      };

      const updatedSession = await approveResearchBrief(session.session_id, briefRequest);
      setSession(updatedSession);
      startProgressStream(session.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve brief");
    } finally {
      setIsLoading(false);
    }
  };

  const startProgressStream = useCallback((sessionId: string) => {
    const cleanup = streamResearchProgress(
      sessionId,
      (progressData) => {
        setProgress(progressData);
      },
      async () => {
        // On complete, fetch the report
        try {
          const reportData = await getResearchReport(sessionId);
          setReport(reportData);
          const sessionData = await getResearchSession(sessionId);
          setSession(sessionData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load report");
        }
      },
      (errorMsg) => {
        setError(errorMsg);
      }
    );

    return cleanup;
  }, []);

  const renderPhaseIndicator = () => {
    if (!session) return null;

    // Use status values from backend
    const statuses = ["clarifying", "brief_review", "researching", "writing", "complete"];
    const currentIndex = statuses.indexOf(session.status);

    return (
      <div className="flex items-center gap-2 mb-6">
        {statuses.slice(0, -1).map((status, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const info = statusLabels[status] || { label: status, description: "" };

          return (
            <div key={status} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      isComplete && "border-green-500 bg-green-500 text-white",
                      isCurrent && "border-primary bg-primary/10 text-primary",
                      !isComplete && !isCurrent && "border-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </TooltipContent>
              </Tooltip>
              {index < statuses.length - 2 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Initial query input
  if (!session && !sessionIdParam) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
            <Search className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Deep Legal Research</h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Get comprehensive research reports with citations from Uganda&apos;s legal framework.
            Our AI will analyze multiple sources and generate a detailed report.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="query">Research Topic</Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your legal research topic in detail..."
                  className="mt-2 min-h-[120px]"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleStartResearch}
                disabled={!query.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Research...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Research
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading && !session) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Clarification phase
  if (session?.status === "clarifying") {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>

          {renderPhaseIndicator()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Help Us Understand Your Research
              </CardTitle>
              <CardDescription>
                Answer these questions to help us tailor the research to your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Your Query</p>
                <p className="text-sm">{session.query}</p>
              </div>

              {session.clarifying_questions?.map((q) => (
                <div key={q.id} className="space-y-3">
                  <Label>{q.question}</Label>
                  {q.options ? (
                    <RadioGroup
                      value={clarifyAnswers[q.id] || ""}
                      onValueChange={(value) =>
                        setClarifyAnswers((prev) => ({ ...prev, [q.id]: value }))
                      }
                    >
                      {q.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                          <Label htmlFor={`${q.id}-${option}`} className="font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Input
                      value={clarifyAnswers[q.id] || ""}
                      onChange={(e) =>
                        setClarifyAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Type your answer..."
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmitClarifications}
                disabled={
                  isLoading ||
                  (session.clarifying_questions?.some((q) => !clarifyAnswers[q.id]) ?? true)
                }
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Brief approval phase
  if (session?.status === "brief_review" && session.research_brief) {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>

          {renderPhaseIndicator()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Research Brief
              </CardTitle>
              <CardDescription>
                Review and approve the research plan before we begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Research Query</p>
                <p className="text-sm">{session.research_brief.original_query}</p>
              </div>

              {session.research_brief.topics && session.research_brief.topics.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Research Topics</h4>
                  <ul className="space-y-2">
                    {session.research_brief.topics.map((topic) => (
                      <li key={topic.id} className="flex items-start gap-2 text-sm p-3 border rounded-lg">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium">{topic.title}</p>
                          {topic.description && (
                            <p className="text-muted-foreground text-xs mt-1">{topic.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Jurisdictions</h4>
                  <div className="flex flex-wrap gap-1">
                    {session.research_brief.jurisdictions.map((j) => (
                      <Badge key={j} variant="secondary">{j}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">Document Types</h4>
                  <div className="flex flex-wrap gap-1">
                    {session.research_brief.document_types.map((dt) => (
                      <Badge key={dt} variant="outline">{dt}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {session.research_brief.report_format} report
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">~2-5 minutes</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleApproveBrief}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Research...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Approve & Start Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Researching/Writing phase
  if (session?.status === "researching" || session?.status === "writing") {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>

          {renderPhaseIndicator()}

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                </div>

                <h3 className="mt-6 font-semibold text-lg">
                  {session.status === "researching"
                    ? "Researching..."
                    : "Writing Report..."}
                </h3>

                {progress && (
                  <div className="mt-4 space-y-2 max-w-md">
                    <p className="text-sm text-muted-foreground">{progress.message}</p>
                    {progress.progress !== undefined && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Complete phase - show report
  if (session?.status === "complete" && report) {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>

          <div className="space-y-6">
            {/* Report Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {report.citations?.length || 0} sources
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {report.total_tokens_used || 0} tokens
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={report.executive_summary} />
              </CardContent>
            </Card>

            {/* Report Sections */}
            {report.sections?.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer content={section.content} />
                </CardContent>
              </Card>
            ))}

            {/* Citations */}
            {report.citations && report.citations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sources & Citations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.citations.map((citation) => (
                      <div
                        key={citation.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <Badge variant="outline" className="shrink-0 mt-0.5">
                          {citation.source_type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{citation.title}</p>
                          {citation.legal_reference && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {citation.legal_reference}
                            </p>
                          )}
                          {citation.case_citation && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {citation.case_citation}
                            </p>
                          )}
                        </div>
                        {citation.external_url && (
                          <a href={citation.external_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Error state
  if (session?.status === "error" || error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Research Failed</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {session?.error || error || "An unexpected error occurred during research."}
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSession(null);
                  setError(null);
                  router.replace("/research");
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for unexpected states
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Chat
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Processing your request...
            </p>
            {session && (
              <p className="mt-2 text-xs text-muted-foreground">
                Status: {session.status} | Phase: {session.phase}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
