"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  BookOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import type { ToolMode } from "./tools-dropdown";

// Tool execution phases
export type ToolPhase =
  | "starting"
  | "clarifying"
  | "researching"
  | "analyzing"
  | "writing"
  | "complete"
  | "error"
  | "redirected"; // For when triage says use normal chat

export interface ToolProgress {
  phase: ToolPhase;
  message: string;
  progress?: number;
  details?: Record<string, unknown>;
}

export interface ResearchResult {
  id: string;
  title: string;
  executive_summary: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
  citations: Array<{
    id: string;
    source_type: string;
    title: string;
    legal_reference?: string;
    case_citation?: string;
    external_url?: string;
    relevance_score: number;
  }>;
  generated_at: string;
  total_tokens_used: number;
}

export interface ContractResult {
  title: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  download_url?: string;
}

export interface ToolMessageProps {
  tool: ToolMode;
  query: string;
  status: "running" | "complete" | "error";
  progress?: ToolProgress;
  result?: ResearchResult | ContractResult | null;
  error?: string;
  onRetry?: () => void;
  // For redirected queries - fall back to normal chat
  redirectMessage?: string;
}

const toolConfig = {
  "deep-research": {
    icon: Search,
    label: "Deep Research",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  "draft-contract": {
    icon: FileText,
    label: "Contract Draft",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  chat: {
    icon: Search,
    label: "Chat",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
};

const phaseMessages: Record<ToolPhase, string> = {
  starting: "Starting...",
  clarifying: "Understanding your request...",
  researching: "Searching legal sources...",
  analyzing: "Analyzing findings...",
  writing: "Generating report...",
  complete: "Complete",
  error: "An error occurred",
  redirected: "Processing with standard search...",
};

export function ToolMessage({
  tool,
  query,
  status,
  progress,
  result,
  error,
  onRetry,
  redirectMessage,
}: ToolMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = toolConfig[tool] || toolConfig.chat;
  const Icon = config.icon;

  // Running state
  if (status === "running") {
    return (
      <Card className={cn("border", config.borderColor)}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{config.label}</span>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {query}
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn("font-medium", config.color)}>
                    {progress?.message || phaseMessages[progress?.phase || "starting"]}
                  </span>
                </div>
                {progress?.progress !== undefined && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500", config.bgColor.replace("/10", ""))}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{config.label} Failed</span>
              </div>
              <p className="text-sm text-destructive mt-1">
                {error || "An unexpected error occurred"}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="mt-3"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Redirected state (triage said use normal chat)
  if (progress?.phase === "redirected" || redirectMessage) {
    return (
      <Card className={cn("border", config.borderColor)}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {redirectMessage || "Your query has been processed using standard search for faster results."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Complete state with results
  if (status === "complete" && result) {
    const isResearch = tool === "deep-research";
    const researchResult = result as ResearchResult;
    const contractResult = result as ContractResult;

    return (
      <Card className={cn("border", config.borderColor)}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardContent className="pt-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{config.label}</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <p className="font-medium mt-1">
                  {isResearch ? researchResult.title : contractResult.title}
                </p>
                {isResearch && researchResult.citations && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {researchResult.citations.length} sources
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {researchResult.total_tokens_used || 0} tokens
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Content */}
            <CollapsibleContent>
              <div className="mt-4 space-y-4 border-t pt-4">
                {/* Executive Summary / Main Content */}
                {isResearch && researchResult.executive_summary && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Executive Summary</h4>
                    <div className="text-sm text-muted-foreground">
                      <MarkdownRenderer content={researchResult.executive_summary} />
                    </div>
                  </div>
                )}

                {!isResearch && contractResult.content && (
                  <div className="text-sm">
                    <MarkdownRenderer content={contractResult.content} />
                  </div>
                )}

                {/* Sections */}
                {(isResearch ? researchResult.sections : contractResult.sections)?.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="text-sm font-medium mb-2">{section.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      <MarkdownRenderer content={section.content} />
                    </div>
                  </div>
                ))}

                {/* Citations for Research */}
                {isResearch && researchResult.citations && researchResult.citations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sources</h4>
                    <div className="space-y-2">
                      {researchResult.citations.slice(0, 5).map((citation) => (
                        <div
                          key={citation.id}
                          className="flex items-start gap-2 p-2 rounded border bg-muted/30 text-sm"
                        >
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {citation.source_type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-1">{citation.title}</p>
                            {citation.legal_reference && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {citation.legal_reference}
                              </p>
                            )}
                          </div>
                          {citation.external_url && (
                            <a href={citation.external_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download for Contracts */}
                {!isResearch && contractResult.download_url && (
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <a href={contractResult.download_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Contract
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    );
  }

  // Default/empty state
  return null;
}
