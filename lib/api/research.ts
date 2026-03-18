/**
 * Research API - Deep Legal Research
 *
 * Provides functions for the deep research workflow:
 * 1. Create research session with query
 * 2. Handle clarification flow
 * 3. Approve research brief
 * 4. Stream research progress
 * 5. Get final report
 */

import { apiPost, apiGet, apiFetch, getApiBaseUrl } from "./client";

// Backend uses these phases: triage, clarify, instruction, research, writing, complete
// And statuses: created, clarifying, brief_review, researching, writing, complete, error
export type ResearchStatus =
  | "created"
  | "clarifying"
  | "brief_review"
  | "researching"
  | "writing"
  | "complete"
  | "error"
  | "redirect_to_chat"
  | "redirect_to_contract";

export type ResearchPhase =
  | "triage"
  | "clarify"
  | "instruction"
  | "research"
  | "writing"
  | "complete";

export interface ClarifyingQuestion {
  id: string;
  question: string;
  options?: string[];
  answer?: string;
}

export interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
  status: string;
}

export interface ResearchBrief {
  id: string;
  original_query: string;
  clarifications: string[];
  jurisdictions: string[];
  document_types: string[];
  time_scope: string;
  topics: ResearchTopic[];
  report_format: string;
  include_recommendations: boolean;
  created_at: string;
}

export interface ResearchSession {
  session_id: string;
  query: string;
  status: ResearchStatus;
  phase: ResearchPhase;
  clarifying_questions: ClarifyingQuestion[] | null;
  research_brief?: ResearchBrief | null;
  report?: ResearchReport | null;
  graph_checkpoints?: ResearchGraphCheckpoint[] | null;
  execution_plan?: ResearchExecutionPlan | null;
  coverage_evaluation?: ResearchCoverageEvaluation | null;
  created_at: string;
  progress_percent?: number;
  current_step?: string;
  tokens_used?: number;
  error?: string | null;
}

export interface CreateResearchRequest {
  query: string;
  context?: string;
  /**
   * Force deep research even for simple queries.
   * Use when user explicitly selects "Deep Research" in the UI.
   */
  force_research?: boolean;
}

export interface ClarifyAnswers {
  [questionId: string]: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  executive_summary: string;
  executive_summary_rich?: string | null;
  sections: ResearchSection[];
  citations: ResearchCitation[];
  evidence_registry?: ResearchEvidenceObject[];
  claims?: ResearchReportClaim[];
  section_provenance?: ResearchSectionProvenance[];
  publisher_payload?: ResearchPublisherPayload | null;
  generated_at: string;
  total_tokens_used: number;
  research_audit?: ResearchAudit | null;
  execution_trace?: ResearchExecutionTraceEntry[] | null;
  execution_plan?: ResearchExecutionPlan | null;
  coverage_evaluation?: ResearchCoverageEvaluation | null;
}

export interface ResearchEvidenceTask {
  id: string;
  topic_id: string;
  title: string;
  agent_type: string;
  objective: string;
  query_hints: string[];
  document_types: string[];
  priority: number;
  status: string;
  last_error?: string | null;
  completed_at?: string | null;
}

export interface ResearchCoverageGap {
  id: string;
  description: string;
  severity: string;
  suggested_search: string;
  related_topic_ids: string[];
  resolved: boolean;
}

export interface ResearchExecutionPlan {
  id: string;
  query: string;
  jurisdictions: string[];
  report_format: string;
  tasks: ResearchEvidenceTask[];
  coverage_gaps: ResearchCoverageGap[];
  planning_notes: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearchCoverageEvaluation {
  coverage_score: number;
  sufficient: boolean;
  reasoning: string;
  gaps: ResearchCoverageGap[];
  evaluated_at: string;
}

export interface ResearchAudit {
  topics: number;
  agents: number;
  findings: number;
  evidence_objects: number;
  documents: number;
  chunks: number;
  legal_references: number;
  citations: number;
}

export interface ResearchExecutionTraceEntry {
  node: string;
  phase?: string;
  route_decision?: string | null;
  finding_count?: number;
  has_brief?: boolean;
  has_report?: boolean;
}

export interface ResearchGraphCheckpoint {
  kind?: "graph_checkpoint";
  node: string;
  phase?: string;
  route_decision?: string | null;
  finding_count?: number;
  has_brief?: boolean;
  has_report?: boolean;
  recorded_at?: string;
}

export interface ResearchSection {
  id: string;
  title: string;
  content: string;
  rich_content?: string | null;
  citations: string[];
  evidence_ids?: string[];
  claim_ids?: string[];
  order: number;
}

export interface ResearchCitation {
  id: string;
  source_type: string;
  title: string;
  legal_reference?: string;
  case_citation?: string;
  external_url?: string;
  relevance_score: number;
  // Enhanced fields for document linking
  document_id?: string;
  akn_eid?: string;
  document_url?: string;
  court?: string;
  quoted_text?: string;
  retrieval_provider?: string;
  source_domain?: string;
  source_quality_score?: number;
  source_quality_label?: string;
  source_class?: string;
}

export interface ResearchEvidenceObject {
  id: string;
  finding_id: string;
  topic_id: string;
  agent_type: string;
  evidence_type: string;
  text: string;
  citation_ids: string[];
  source_document_ids: string[];
  source_chunk_ids: string[];
  legal_references: string[];
  support_score?: number | null;
}

export interface ResearchReportClaim {
  id: string;
  section_id: string;
  text: string;
  evidence_ids: string[];
  citation_ids: string[];
}

export interface ResearchSectionProvenance {
  section_id: string;
  evidence_ids: string[];
  claim_ids: string[];
  citation_ids: string[];
  source_document_ids: string[];
  source_chunk_ids: string[];
}

export interface ResearchPublisherSection {
  section_id: string;
  title: string;
  order: number;
  citation_ids: string[];
  claim_ids: string[];
  evidence_ids: string[];
}

export interface ResearchPublisherEndnote {
  citation_id: string;
  number: number;
  title: string;
  label: string;
  url?: string | null;
  quoted_text?: string | null;
  source_quality_label?: string | null;
  source_class?: string | null;
}

export interface ResearchPublisherPayload {
  report_format: string;
  executive_summary_citation_ids: string[];
  sections: ResearchPublisherSection[];
  endnotes: ResearchPublisherEndnote[];
  methodology_note: string;
  generated_at: string;
}

export interface StreamProgress {
  phase: string;
  message: string;
  progress?: number;
  details?: Record<string, unknown>;
}

export interface ResearchTopicRequest {
  title: string;
  description?: string;
  keywords?: string[];
  priority?: number;
}

export interface ApproveBriefRequest {
  brief: {
    query: string;
    clarifications?: string[];
    jurisdictions?: string[];
    document_types?: string[];
    time_scope?: string;
    topics?: ResearchTopicRequest[];
    report_format?: string;
    include_recommendations?: boolean;
  };
  modifications?: string;
}

export interface SaveResearchBriefRequest {
  brief: ApproveBriefRequest["brief"];
}

export interface SaveResearchReportRequest {
  title: string;
  executive_summary: string;
  executive_summary_rich?: string | null;
  sections: ResearchSection[];
}

/**
 * Create a new research session
 */
export async function createResearchSession(
  request: CreateResearchRequest
): Promise<ResearchSession> {
  return apiPost<ResearchSession>("/research", request);
}

/**
 * Get research session status
 */
export async function getResearchSession(
  sessionId: string
): Promise<ResearchSession> {
  return apiGet<ResearchSession>(`/research/${sessionId}`);
}

/**
 * Submit answers to clarifying questions
 */
export async function submitClarifyingAnswers(
  sessionId: string,
  answers: ClarifyAnswers
): Promise<ResearchSession> {
  // Backend expects responses as a list of strings
  const responses = Object.values(answers);
  return apiPost<ResearchSession>(`/research/${sessionId}/clarify`, { responses });
}

/**
 * Approve research brief and start research
 */
export async function approveResearchBrief(
  sessionId: string,
  request: ApproveBriefRequest
): Promise<ResearchSession> {
  return apiPost<ResearchSession>(`/research/${sessionId}/approve`, request);
}

export async function saveResearchBrief(
  sessionId: string,
  request: SaveResearchBriefRequest
): Promise<ResearchSession> {
  return apiFetch<ResearchSession>(`/research/${sessionId}/brief`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

/**
 * Resume a failed research session from the latest persisted checkpoint
 */
export async function resumeResearchSession(
  sessionId: string
): Promise<ResearchSession> {
  return apiPost<ResearchSession>(`/research/${sessionId}/resume`, {});
}

/**
 * Get final research report
 */
export async function getResearchReport(
  sessionId: string
): Promise<ResearchReport> {
  return apiGet<ResearchReport>(`/research/${sessionId}/report`);
}

export async function saveResearchReport(
  sessionId: string,
  request: SaveResearchReportRequest
): Promise<ResearchReport> {
  return apiFetch<ResearchReport>(`/research/${sessionId}/report`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

/**
 * Stream research progress via SSE
 *
 * Backend sends named events: "progress", "complete", "error"
 * We need to use addEventListener for named events, not onmessage
 */
export function streamResearchProgress(
  sessionId: string,
  onProgress: (progress: StreamProgress) => void,
  onComplete: () => void,
  onError: (error: string) => void
): () => void {
  const url = `${getApiBaseUrl()}/research/${sessionId}/stream`;
  const eventSource = new EventSource(url, { withCredentials: true });

  // Listen for named "progress" events from backend
  // Backend sends: event: progress\ndata: {...}
  eventSource.addEventListener("progress", (event) => {
    try {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      // Transform backend format to frontend StreamProgress format
      const progress: StreamProgress = {
        phase: data.phase || "researching",
        message: data.message || "Processing...",
        progress: data.progress_percent || 0,
        details: data.data,
      };
      onProgress(progress);
    } catch (err) {
      console.error("Failed to parse SSE progress message:", event, err);
    }
  });

  // Also handle unnamed events as fallback
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const progress: StreamProgress = {
        phase: data.phase || "researching",
        message: data.message || "Processing...",
        progress: data.progress_percent || 0,
        details: data.data,
      };
      onProgress(progress);
    } catch {
      console.error("Failed to parse SSE message:", event.data);
    }
  };

  eventSource.addEventListener("complete", () => {
    onComplete();
    eventSource.close();
  });

  eventSource.addEventListener("error", () => {
    // Check if it's a real error or just the connection closing
    if (eventSource.readyState === EventSource.CLOSED) {
      return;
    }
    onError("Research stream connection error");
    eventSource.close();
  });

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      return;
    }
    onError("Research stream connection error");
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}
