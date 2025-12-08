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

import { apiPost, apiGet, getApiBaseUrl } from "./client";

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
  created_at: string;
  progress_percent?: number;
  current_step?: string;
  tokens_used?: number;
  error?: string | null;
}

export interface CreateResearchRequest {
  query: string;
  context?: string;
}

export interface ClarifyAnswers {
  [questionId: string]: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  executive_summary: string;
  sections: ResearchSection[];
  citations: ResearchCitation[];
  generated_at: string;
  total_tokens_used: number;
}

export interface ResearchSection {
  id: string;
  title: string;
  content: string;
  citations: string[];
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

/**
 * Get final research report
 */
export async function getResearchReport(
  sessionId: string
): Promise<ResearchReport> {
  return apiGet<ResearchReport>(`/research/${sessionId}/report`);
}

/**
 * Stream research progress via SSE
 */
export function streamResearchProgress(
  sessionId: string,
  onProgress: (progress: StreamProgress) => void,
  onComplete: () => void,
  onError: (error: string) => void
): () => void {
  const url = `${getApiBaseUrl()}/research/${sessionId}/stream`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as StreamProgress;
      onProgress(data);
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
