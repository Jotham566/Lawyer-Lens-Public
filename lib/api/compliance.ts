/**
 * Compliance Intelligence API Client
 *
 * Provides typed API calls for the compliance module:
 * dashboard summary, regulatory events, findings, obligations,
 * tasks, alerts, and compliance actions.
 */

import { apiGet, apiPost } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface ComplianceDashboardSummary {
  findings_by_severity: Record<string, number>;
  pending_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines: number;
  overdue_obligations: number;
  unread_alerts: number;
  total_assessments: number;
  high_relevance_assessments: number;
}

export interface RegulatoryEventResponse {
  id: string;
  event_type: string;
  title: string;
  summary: string | null;
  jurisdiction: string;
  sector_tags: string[];
  domain_tags: string[];
  publication_date: string | null;
  effective_date: string | null;
  source_class: string;
  source_url: string | null;
  source_name: string | null;
  confidence: number;
  is_processed: boolean;
  created_at: string;
}

export interface RegulatoryEventListResponse {
  items: RegulatoryEventResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface FindingResponse {
  id: string;
  organization_id: string;
  assessment_id: string;
  regulatory_event_id: string;
  severity: string;
  status: string;
  explanation: string | null;
  impacted_document_ref: string | null;
  remediation_guidance: string | null;
  evidence_references: Record<string, unknown>[];
  evidence_passages: Record<string, unknown>[];
  assigned_to_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface FindingListResponse {
  items: FindingResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ObligationResponse {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  governing_regulator: string | null;
  legislation_reference: string | null;
  obligation_type: string;
  recurrence_pattern: string;
  recurrence_config: Record<string, unknown>;
  next_due_date: string | null;
  advance_warning_days: number;
  assigned_owner_role: string | null;
  assigned_user_id: string | null;
  evidence_requirements: string[];
  is_active: boolean;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObligationListResponse {
  items: ObligationResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaskResponse {
  id: string;
  organization_id: string;
  finding_id: string | null;
  action_id: string | null;
  obligation_id: string | null;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: number;
  assigned_user_id: string | null;
  assigned_role: string | null;
  due_date: string | null;
  evidence_attachments: Record<string, unknown>[];
  approval_status: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  comments: Record<string, unknown>[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: TaskResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AlertResponse {
  id: string;
  organization_id: string;
  severity: string;
  title: string;
  body: string | null;
  delivery_channel: string;
  delivery_status: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by_user_id: string | null;
  escalation_level: number;
  source_event_ids: string[];
  source_finding_ids: string[];
  created_at: string;
}

export interface AlertListResponse {
  items: AlertResponse[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// API Functions
// =============================================================================

export const complianceApi = {
  /** Get aggregated dashboard statistics. */
  getDashboardSummary: () =>
    apiGet<ComplianceDashboardSummary>("/compliance/dashboard/summary"),

  /** List regulatory events with optional filters. */
  listEvents: (params?: {
    event_type?: string;
    jurisdiction?: string;
    source_class?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiGet<RegulatoryEventListResponse>("/compliance/events", params as Record<string, string | number | boolean | undefined>),

  /** List exposure findings with optional filters. */
  listFindings: (params?: {
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiGet<FindingListResponse>("/compliance/findings", params as Record<string, string | number | boolean | undefined>),

  /** List regulatory obligations. */
  listObligations: (params?: {
    obligation_type?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) =>
    apiGet<ObligationListResponse>("/compliance/obligations", params as Record<string, string | number | boolean | undefined>),

  /** Get overdue obligations. */
  getOverdueObligations: () =>
    apiGet<ObligationListResponse>("/compliance/obligations/overdue"),

  /** Mark an obligation as completed. */
  completeObligation: (id: string, evidence?: Record<string, unknown>[]) =>
    apiPost<ObligationResponse>(`/compliance/obligations/${id}/complete`, { evidence: evidence ?? [] }),

  /** List compliance tasks with optional filters. */
  listTasks: (params?: {
    status?: string;
    task_type?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiGet<TaskListResponse>("/compliance/tasks", params as Record<string, string | number | boolean | undefined>),

  /** List alerts with optional filters. */
  listAlerts: (params?: {
    severity?: string;
    delivery_status?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiGet<AlertListResponse>("/compliance/alerts", params as Record<string, string | number | boolean | undefined>),

  /** Acknowledge an alert. */
  acknowledgeAlert: (id: string) =>
    apiPost<AlertResponse>(`/compliance/alerts/${id}/acknowledge`, {}),

  /** Get count of unacknowledged alerts. */
  getUnacknowledgedCount: () =>
    apiGet<{ count: number }>("/compliance/alerts/unacknowledged-count"),
};
