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
  // Short-lived signed token for the SSE /stream endpoint. The browser
  // appends it as ?stream_token=<jwt>. Refreshed on every session GET;
  // if the EventSource errors mid-stream, callers should re-fetch the
  // session to pick up a fresh token and reconnect.
  stream_token?: string | null;
  /** Set when the user clicks Cancel on a running research session.
   * Supervisor checks between subagent invocations and rolls back to
   * brief_review or clarifying. UI uses non-null for "Cancelling…" state. */
  cancel_requested_at?: string | null;
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
  // Phase A/4 (2026-04-18): insufficient-info transparency. Topic IDs
  // for which the supervisor's coverage evaluation could not produce
  // useful results (zero hits, all rejected, or LLM evaluator crashed
  // and fell back). Frontend renders a yellow banner so users know
  // NOT to act on those sections without independent verification.
  weak_topics?: string[];
  // Section IDs derived from weak_topics by joining against each
  // section's topic_ids. Frontend renders an inline banner above
  // each section in this list.
  weak_sections?: string[];
  // Phase B/2 (2026-04-18) aggregate claim-level NLI verification
  // verdict. Frontend shows a "X% of claims verified" badge on the
  // report header when present. null means verifier didn't run.
  claim_verification?: ClaimVerificationSummary | null;
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
  // Phase A/5 (2026-04-18): topic IDs the section covers, preserved
  // from the planning stage. Lets the UI map weak_topics onto specific
  // sections for the inline banner.
  topic_ids?: string[];
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
  source_tier?: number;
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
  // Phase B/2 (2026-04-18) per-claim NLI verification verdict.
  // `entailment_label` is "entailment" | "contradiction" | "neutral"
  // | "unverified". "unverified" is the default when the verifier
  // didn't run against this specific claim (no LLM, rate limit,
  // beyond max_claims cap).
  entailment_label?: "entailment" | "contradiction" | "neutral" | "unverified";
  support_confidence?: number;
  verifying_evidence_id?: string | null;
  verification_reasoning?: string;
}

export interface ClaimVerificationSummary {
  total_claims: number;
  verified_claims: number;
  unsupported_claims: number;
  contradicted_claims: number;
  verification_rate: number;
  overall_confidence: number;
  skipped: boolean;
  skipped_reason: string;
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
  structured_blocks: ResearchPublisherStructuredBlock[];
}

export interface ResearchPublisherStructuredBlock {
  block_type: string;
  title: string;
  headers?: string[];
  rows?: string[][];
  items?: string[];
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
  source_tier?: number | null;
}

export interface ResearchPublisherKeyAuthority {
  citation_id: string;
  title: string;
  label: string;
  source_class?: string | null;
  source_tier?: number | null;
  url?: string | null;
}

export interface ResearchPublisherSourceGroup {
  source_class: string;
  label: string;
  citation_ids: string[];
  count: number;
}

export interface ResearchPublisherPayload {
  report_format: string;
  executive_summary_citation_ids: string[];
  sections: ResearchPublisherSection[];
  key_authorities: ResearchPublisherKeyAuthority[];
  source_groups: ResearchPublisherSourceGroup[];
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
 * Slim list-row for the /research/history view. Sized to what the
 * history surface needs (title, query, status, timestamps) without the
 * heavy nested report / brief payloads carried by ResearchSession.
 * Source of truth is the server (defense-in-depth: scoped by both
 * organization_id and user_id), so users keep their history across
 * browsers, devices, and localStorage clears.
 */
export interface ResearchSessionListItem {
  session_id: string;
  title: string | null;
  query: string;
  status: ResearchStatus;
  phase: ResearchPhase;
  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
  progress_percent: number;
  has_report: boolean;
}

/**
 * List the calling user's research sessions, newest first.
 *
 * Replaces the old localStorage-only history (lib/stores/research-store.ts)
 * which lost data on browser switch / cookie clear / second device.
 */
export async function getMyResearchSessions(
  options?: { status?: string; limit?: number; offset?: number }
): Promise<ResearchSessionListItem[]> {
  const params = new URLSearchParams();
  if (options?.status) params.append("status_filter", options.status);
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.offset) params.append("offset", options.offset.toString());

  const query = params.toString();
  return apiGet<ResearchSessionListItem[]>(
    `/research/my-sessions${query ? `?${query}` : ""}`
  );
}

/**
 * Delete a research session from the server (also removes it from the
 * /research/history view since the list is server-backed).
 */
export async function deleteResearchSession(sessionId: string): Promise<void> {
  await apiFetch(`/research/${sessionId}`, { method: "DELETE" });
}

/**
 * Get the server-rendered Word (.docx) export URL for a completed
 * research session. Mirrors getContractDownloadUrl. Replaces the old
 * client-side Office-flavoured .doc generator that opened with
 * unpredictable rendering in non-Word editors.
 */
export function getResearchDownloadUrl(
  sessionId: string,
  format: "docx" = "docx"
): string {
  return `${getApiBaseUrl()}/research/${sessionId}/export?format=${format}`;
}

/**
 * Reset a session backwards to an earlier stage (clarifying or
 * brief_review). Backend enforces the state-machine guards: only
 * allowed from BRIEF_REVIEW / COMPLETE / ERROR, and never while a
 * worker is actively touching the session (RESEARCHING / WRITING).
 *
 * Use this to power the clickable stepper — clicking a previous
 * stage on a completed report drops the user back into that
 * stage's view so they can refine and re-run instead of
 * starting from scratch.
 */
export async function resetResearchToStage(
  sessionId: string,
  targetStage: "clarifying" | "brief_review",
): Promise<ResearchSession> {
  return apiPost<ResearchSession>(`/research/${sessionId}/reset-to-stage`, {
    target_stage: targetStage,
  });
}

/**
 * Cancel an in-flight research session.
 *
 * Sets cancel_requested_at on the session. The supervisor checks this
 * between subagent invocations (cooperative cancellation) and aborts
 * within ~10-30s depending on which subagent is mid-run. Phase rolls
 * back to BRIEF_REVIEW (if a brief exists) or CLARIFYING with a
 * "Cancelled by user" status. Idempotent — calling twice is fine.
 */
export async function cancelResearchSession(
  sessionId: string,
): Promise<ResearchSession> {
  return apiPost<ResearchSession>(`/research/${sessionId}/cancel`, {});
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
 * Stream research progress via SSE.
 *
 * Backend sends named events: "progress", "complete", "error".
 * EventSource cannot send Authorization headers, so a short-lived
 * audience-scoped token is passed as `?stream_token=<jwt>`. The token
 * is obtained from the session GET response.
 *
 * Reconnection: on EventSource error this function closes the stream
 * and re-fetches the session ONCE to pick up a fresh token, then
 * reopens. If the second attempt also errors, `onError` is invoked.
 * The worker keeps running on the server regardless of stream state.
 */
export function streamResearchProgress(
  sessionId: string,
  streamToken: string,
  onProgress: (progress: StreamProgress) => void,
  onComplete: () => void,
  onError: (error: string) => void
): () => void {
  let activeSource: EventSource | null = null;
  let cancelled = false;
  let retried = false;

  const open = (token: string) => {
    if (cancelled) return;
    const url = `${getApiBaseUrl()}/research/${sessionId}/stream?stream_token=${encodeURIComponent(token)}`;
    const es = new EventSource(url, { withCredentials: true });
    activeSource = es;
    wireEvents(es);
  };

  const reconnectWithFreshToken = async () => {
    if (cancelled || retried) {
      onError("Research stream connection error");
      return;
    }
    retried = true;
    try {
      const fresh = await getResearchSession(sessionId);
      if (!fresh.stream_token) {
        onError("Research stream connection error");
        return;
      }
      open(fresh.stream_token);
    } catch {
      onError("Research stream connection error");
    }
  };

  function wireEvents(es: EventSource) {
    es.addEventListener("progress", (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        const progress: StreamProgress = {
          phase: data.phase || "researching",
          message: data.message || "Processing...",
          progress: data.progress_percent || 0,
          details: data.data,
        };
        onProgress(progress);
      } catch (err) {
        // Never log the raw event — its currentTarget is the EventSource
        // whose `url` contains `?stream_token=<jwt>`. Sentry's default
        // consoleIntegration captures console.* args as breadcrumbs and
        // would exfiltrate the token in any errored session uploaded
        // via Replay. Log only the parse-error context.
        const messageEvent = event as MessageEvent;
        const dataLength =
          typeof messageEvent.data === "string" ? messageEvent.data.length : -1;
        console.error("Failed to parse SSE progress message", {
          dataLength,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    });

    es.onmessage = (event) => {
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
        // Same reasoning as above: don't pass the raw event payload to
        // console; only the length is useful for triage.
        const dataLength =
          typeof event.data === "string" ? event.data.length : -1;
        console.error("Failed to parse SSE message", { dataLength });
      }
    };

    es.addEventListener("complete", () => {
      onComplete();
      es.close();
    });

    const handleError = () => {
      if (es.readyState === EventSource.CLOSED) return;
      es.close();
      // Token may have expired or session ownership shifted. Re-fetch
      // session once to pick up a fresh token, then reopen. If the
      // second attempt also fails, surface to the caller.
      void reconnectWithFreshToken();
    };
    es.addEventListener("error", handleError);
    es.onerror = handleError;
  }

  open(streamToken);

  return () => {
    cancelled = true;
    if (activeSource) activeSource.close();
  };
}
