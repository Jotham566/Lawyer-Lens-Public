"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageErrorBoundary } from "@/components/error-boundary";
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
  Pencil,
  Plus,
  Trash2,
  X,
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

  // Brief editing state
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editedTopics, setEditedTopics] = useState<Array<{
    id: string;
    title: string;
    description: string;
    keywords: string[];
    priority: number;
  }>>([]);
  const [editedJurisdictions, setEditedJurisdictions] = useState<string[]>([]);
  const [editedDocTypes, setEditedDocTypes] = useState<string[]>([]);
  const [editedTimeScope, setEditedTimeScope] = useState("current");
  const [editedReportFormat, setEditedReportFormat] = useState("comprehensive");

  // Initialize editing state when brief is available
  useEffect(() => {
    if (session?.research_brief && !isEditingBrief) {
      setEditedTopics(session.research_brief.topics?.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        keywords: t.keywords || [],
        priority: t.priority || 1,
      })) || []);
      setEditedJurisdictions(session.research_brief.jurisdictions || ["Uganda"]);
      // Filter out any invalid document types from backend response
      const validDocTypes = ["legislation", "judgment", "regulation", "schedule", "treaty", "web"];
      const backendDocTypes = session.research_brief.document_types || [];
      setEditedDocTypes(backendDocTypes.filter(dt => validDocTypes.includes(dt)).length > 0
        ? backendDocTypes.filter(dt => validDocTypes.includes(dt))
        : ["legislation", "judgment"]);
      setEditedTimeScope(session.research_brief.time_scope || "current");
      setEditedReportFormat(session.research_brief.report_format || "comprehensive");
    }
  }, [session?.research_brief, isEditingBrief]);

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
      // Use edited values if in edit mode, otherwise use original brief
      const briefRequest: ApproveBriefRequest = {
        brief: {
          query: session.research_brief.original_query,
          clarifications: session.research_brief.clarifications || [],
          jurisdictions: editedJurisdictions.length > 0 ? editedJurisdictions : ["Uganda"],
          document_types: editedDocTypes.length > 0 ? editedDocTypes : ["legislation", "judgment"],
          time_scope: editedTimeScope || "current",
          topics: editedTopics.length > 0 ? editedTopics.map((topic) => ({
            title: topic.title,
            description: topic.description || "",
            keywords: topic.keywords || [],
            priority: topic.priority || 1,
          })) : session.research_brief.topics?.map((topic) => ({
            title: topic.title,
            description: topic.description || "",
            keywords: topic.keywords || [],
            priority: topic.priority || 1,
          })) || [],
          report_format: editedReportFormat || "comprehensive",
          include_recommendations: session.research_brief.include_recommendations ?? true,
        },
      };

      const updatedSession = await approveResearchBrief(session.session_id, briefRequest);
      setSession(updatedSession);
      setIsEditingBrief(false);
      startProgressStream(session.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve brief");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for brief editing
  const addTopic = () => {
    setEditedTopics([...editedTopics, {
      id: `topic-${Date.now()}`,
      title: "",
      description: "",
      keywords: [],
      priority: editedTopics.length + 1,
    }]);
  };

  const removeTopic = (id: string) => {
    setEditedTopics(editedTopics.filter(t => t.id !== id));
  };

  const updateTopic = (id: string, field: string, value: string | string[] | number) => {
    setEditedTopics(editedTopics.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const toggleDocType = (docType: string) => {
    if (editedDocTypes.includes(docType)) {
      setEditedDocTypes(editedDocTypes.filter(dt => dt !== docType));
    } else {
      setEditedDocTypes([...editedDocTypes, docType]);
    }
  };

  // Handle PDF export
  const handleExportPdf = useCallback(() => {
    if (!report) return;

    // Create a print-friendly HTML document
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            h1 {
              font-size: 24px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              font-size: 18px;
              margin-top: 30px;
              margin-bottom: 15px;
              color: #333;
            }
            h3 {
              font-size: 16px;
              margin-top: 20px;
              color: #444;
            }
            p {
              margin-bottom: 12px;
              text-align: justify;
            }
            .metadata {
              color: #666;
              font-size: 12px;
              margin-bottom: 30px;
            }
            .executive-summary {
              background: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #333;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .citation {
              padding: 10px;
              margin-bottom: 10px;
              border: 1px solid #ddd;
              background: #fafafa;
              font-size: 14px;
            }
            .citation-type {
              display: inline-block;
              background: #333;
              color: white;
              padding: 2px 8px;
              font-size: 11px;
              border-radius: 3px;
              margin-right: 8px;
            }
            .citation-title {
              font-weight: bold;
            }
            .citation-reference {
              color: #666;
              font-style: italic;
            }
            .citations-section {
              page-break-before: always;
            }
            @media print {
              body { padding: 20px; }
              .citation { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${report.title}</h1>
          <div class="metadata">
            Generated: ${new Date(report.generated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} | ${report.citations?.length || 0} citations
          </div>

          <div class="executive-summary">
            <h2>Executive Summary</h2>
            ${report.executive_summary.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
          </div>

          ${report.sections?.map((section) => `
            <div class="section">
              <h2>${section.title}</h2>
              ${section.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
            </div>
          `).join('') || ''}

          ${report.citations && report.citations.length > 0 ? `
            <div class="citations-section">
              <h2>Sources & Citations</h2>
              ${report.citations.map((citation) => `
                <div class="citation">
                  <span class="citation-type">${citation.source_type}</span>
                  <span class="citation-title">${citation.title}</span>
                  ${citation.legal_reference ? `<div class="citation-reference">${citation.legal_reference}</div>` : ''}
                  ${citation.case_citation ? `<div class="citation-reference">${citation.case_citation}${citation.court ? ` (${citation.court})` : ''}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    // Open a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };
      // Fallback for browsers that don't trigger onload
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback: use the current window
      alert('Please allow popups to export PDF. Alternatively, use Ctrl/Cmd+P to print this page.');
    }
  }, [report]);

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
    const availableDocTypes = ["legislation", "judgment", "regulation", "schedule", "treaty", "web"];
    const availableJurisdictions = ["Uganda", "East Africa", "Commonwealth", "International"];
    const availableTimeScopes = [
      { value: "current", label: "Current law only" },
      { value: "historical", label: "Include historical versions" },
      { value: "all", label: "All time periods" },
    ];
    const availableFormats = [
      { value: "comprehensive", label: "Comprehensive (detailed analysis)" },
      { value: "summary", label: "Summary (key points only)" },
      { value: "brief", label: "Brief (quick overview)" },
    ];

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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Research Brief
                  </CardTitle>
                  <CardDescription>
                    {isEditingBrief
                      ? "Customize the research plan to your needs."
                      : "Review and approve the research plan before we begin."
                    }
                  </CardDescription>
                </div>
                <Button
                  variant={isEditingBrief ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsEditingBrief(!isEditingBrief)}
                >
                  {isEditingBrief ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel Edit
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Brief
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Research Query</p>
                <p className="text-sm">{session.research_brief.original_query}</p>
              </div>

              {/* Research Topics - Editable or Read-only */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Research Topics</h4>
                  {isEditingBrief && (
                    <Button variant="outline" size="sm" onClick={addTopic}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Topic
                    </Button>
                  )}
                </div>

                {isEditingBrief ? (
                  <div className="space-y-3">
                    {editedTopics.map((topic, index) => (
                      <div key={topic.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                          <Input
                            value={topic.title}
                            onChange={(e) => updateTopic(topic.id, "title", e.target.value)}
                            placeholder="Topic title..."
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTopic(topic.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={topic.description}
                          onChange={(e) => updateTopic(topic.id, "description", e.target.value)}
                          placeholder="Description (optional)..."
                          className="min-h-[60px] text-sm"
                        />
                        <div>
                          <Label className="text-xs text-muted-foreground">Keywords (comma-separated)</Label>
                          <Input
                            value={topic.keywords.join(", ")}
                            onChange={(e) => updateTopic(topic.id, "keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
                            placeholder="keyword1, keyword2, ..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                    {editedTopics.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No topics added. Click &quot;Add Topic&quot; to get started.
                      </p>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(editedTopics.length > 0 ? editedTopics : session.research_brief.topics || []).map((topic) => (
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
                )}
              </div>

              {/* Jurisdictions and Document Types */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Jurisdictions</h4>
                  {isEditingBrief ? (
                    <div className="flex flex-wrap gap-2">
                      {availableJurisdictions.map((j) => (
                        <Badge
                          key={j}
                          variant={editedJurisdictions.includes(j) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (editedJurisdictions.includes(j)) {
                              setEditedJurisdictions(editedJurisdictions.filter(jur => jur !== j));
                            } else {
                              setEditedJurisdictions([...editedJurisdictions, j]);
                            }
                          }}
                        >
                          {j}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {editedJurisdictions.map((j) => (
                        <Badge key={j} variant="secondary">{j}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">Document Types</h4>
                  {isEditingBrief ? (
                    <div className="flex flex-wrap gap-2">
                      {availableDocTypes.map((dt) => (
                        <Badge
                          key={dt}
                          variant={editedDocTypes.includes(dt) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleDocType(dt)}
                        >
                          {dt}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {editedDocTypes.map((dt) => (
                        <Badge key={dt} variant="outline">{dt}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Scope and Report Format */}
              {isEditingBrief ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Time Scope</h4>
                    <RadioGroup value={editedTimeScope} onValueChange={setEditedTimeScope}>
                      {availableTimeScopes.map((scope) => (
                        <div key={scope.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={scope.value} id={`scope-${scope.value}`} />
                          <Label htmlFor={`scope-${scope.value}`} className="font-normal text-sm">
                            {scope.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Report Format</h4>
                    <RadioGroup value={editedReportFormat} onValueChange={setEditedReportFormat}>
                      {availableFormats.map((format) => (
                        <div key={format.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={format.value} id={`format-${format.value}`} />
                          <Label htmlFor={`format-${format.value}`} className="font-normal text-sm">
                            {format.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {editedReportFormat} report
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">~2-5 minutes</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                {isEditingBrief && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset to original values
                      setEditedTopics(session.research_brief?.topics?.map(t => ({
                        id: t.id,
                        title: t.title,
                        description: t.description || "",
                        keywords: t.keywords || [],
                        priority: t.priority || 1,
                      })) || []);
                      setEditedJurisdictions(session.research_brief?.jurisdictions || ["Uganda"]);
                      const validTypes = ["legislation", "judgment", "regulation", "schedule", "treaty", "web"];
                      const originalTypes = session.research_brief?.document_types || [];
                      setEditedDocTypes(originalTypes.filter(dt => validTypes.includes(dt)).length > 0
                        ? originalTypes.filter(dt => validTypes.includes(dt))
                        : ["legislation", "judgment"]);
                      setEditedTimeScope(session.research_brief?.time_scope || "current");
                      setEditedReportFormat(session.research_brief?.report_format || "comprehensive");
                      setIsEditingBrief(false);
                    }}
                    className="flex-1"
                  >
                    Reset to Original
                  </Button>
                )}
                <Button
                  onClick={handleApproveBrief}
                  disabled={isLoading || (isEditingBrief && editedTopics.length === 0)}
                  className={isEditingBrief ? "flex-1" : "w-full"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Research...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isEditingBrief ? "Save & Start Research" : "Approve & Start Research"}
                    </>
                  )}
                </Button>
              </div>
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
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
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
                          {/* Make title clickable if document_url exists */}
                          {citation.document_url ? (
                            <Link
                              href={citation.document_url}
                              className="font-medium text-primary hover:underline"
                            >
                              {citation.title}
                            </Link>
                          ) : (
                            <p className="font-medium">{citation.title}</p>
                          )}
                          {citation.legal_reference && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {citation.legal_reference}
                            </p>
                          )}
                          {citation.case_citation && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {citation.case_citation}
                              {citation.court && ` (${citation.court})`}
                            </p>
                          )}
                          {/* Show excerpt if available */}
                          {citation.quoted_text && (
                            <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
                              &ldquo;{citation.quoted_text}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Internal document link */}
                          {citation.document_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={citation.document_url}>
                                  <Button variant="ghost" size="icon">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>View source document</TooltipContent>
                            </Tooltip>
                          )}
                          {/* External URL link */}
                          {citation.external_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={citation.external_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>Open external source</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
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
    <PageErrorBoundary fallback="generic">
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
    </PageErrorBoundary>
  );
}
