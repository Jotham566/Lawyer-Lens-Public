/**
 * Contracts API - Contract Drafting
 *
 * Provides functions for the contract drafting workflow:
 * 1. List available templates
 * 2. Create contract session
 * 3. Submit requirements
 * 4. Review and edit draft
 * 5. Download final contract
 */

import { apiPost, apiGet, getApiBaseUrl } from "./client";

export type ContractPhase =
  | "requirements"
  | "drafting"
  | "review"
  | "approval"
  | "complete"
  | "failed";

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
  preview_available: boolean;
}

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "date" | "number" | "select" | "textarea";
  required: boolean;
  options?: string[];
  placeholder?: string;
  default_value?: string;
}

export interface ContractQuestion {
  id: string;
  variable: string;
  question: string;
  question_type: "text" | "number" | "date" | "select" | "multiselect" | "boolean" | "textarea";
  options?: string[];
  required: boolean;
  group: string;
}

export interface ContractSession {
  session_id: string;
  template_id?: string;
  status: string;
  contract_type: string;
  description: string;
  title?: string;
  phase: ContractPhase;
  questions?: ContractQuestion[];
  requirements?: ContractRequirements;
  draft?: ContractDraft;
  created_at: string;
  updated_at?: string;
  progress_percent?: number;
  error?: string;
}

export interface ContractRequirements {
  parties: PartyInfo[];
  key_terms: Record<string, string>;
  variable_values?: Record<string, string>;
  special_clauses?: string[];
  jurisdiction: string;
  effective_date?: string;
  term_months?: number;
  contract_value?: number;
}

export interface PartyInfo {
  role: string;
  name: string;
  address?: string;
  registration_number?: string;
}

export interface ContractDraft {
  title: string;
  content: string;
  sections: ContractSection[];
  compliance_notes: string[];
  warnings: string[];
}

export interface ContractSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

export interface CreateContractRequest {
  contract_type: string; // employment, nda, service, sale, lease
  description: string;
  template_id?: string;
  source_contract_id?: string; // Clone from existing contract
  uploaded_file_id?: string; // Use uploaded file as template
  use_default_template?: boolean;
}

export interface SaveAsTemplateRequest {
  name: string;
  description?: string;
  make_public?: boolean;
}

export interface ContractListItem {
  session_id: string;
  title: string | null;
  contract_type: string;
  status: string;
  phase: string;
  created_at: string;
  updated_at?: string;
  parties: string[];
}

export interface EnhancedTemplate {
  id: string;
  name: string;
  description: string | null;
  contract_type: string;
  jurisdiction: string;
  source: "system" | "user" | "from_contract" | "uploaded";
  times_used: number;
  created_at: string;
  sections_count: number;
  variables_count: number;
}

export interface ContractReview {
  approved: boolean;
  edits?: SectionEdit[];
  notes?: string;
}

export interface SectionEdit {
  section_id: string;
  new_content: string;
}

/**
 * Get available contract templates
 */
export async function getContractTemplates(): Promise<ContractTemplate[]> {
  return apiGet<ContractTemplate[]>("/contracts/templates");
}

/**
 * Get a specific template by ID
 */
export async function getContractTemplate(
  templateId: string
): Promise<ContractTemplate> {
  return apiGet<ContractTemplate>(`/contracts/templates/${templateId}`);
}

/**
 * Create a new contract session
 */
export async function createContractSession(
  request: CreateContractRequest,
  accessToken?: string | null
): Promise<ContractSession> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiPost<ContractSession>("/contracts", request, headers);
}

/**
 * Get contract session status
 */
export async function getContractSession(
  sessionId: string,
  accessToken?: string | null
): Promise<ContractSession> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiGet<ContractSession>(`/contracts/${sessionId}`, headers);
}

/**
 * Submit contract requirements
 */
export async function submitContractRequirements(
  sessionId: string,
  requirements: ContractRequirements,
  accessToken?: string | null
): Promise<ContractSession> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiPost<ContractSession>(`/contracts/${sessionId}/requirements`, requirements, headers);
}

/**
 * Submit review and edits
 */
export async function submitContractReview(
  sessionId: string,
  review: ContractReview,
  accessToken?: string | null
): Promise<ContractSession> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiPost<ContractSession>(`/contracts/${sessionId}/review`, review, headers);
}

/**
 * Get download URL for contract
 */
export function getContractDownloadUrl(
  sessionId: string,
  format: "pdf" | "docx" = "pdf"
): string {
  return `${getApiBaseUrl()}/contracts/${sessionId}/download?format=${format}`;
}

/**
 * Stream contract generation progress via SSE
 */
export function streamContractProgress(
  sessionId: string,
  onProgress: (progress: { phase: string; message: string; progress?: number }) => void,
  onComplete: () => void,
  onError: (error: string) => void
): () => void {
  const url = `${getApiBaseUrl()}/contracts/${sessionId}/stream`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onProgress(data);
    } catch {
      console.error("Failed to parse SSE message:", event.data);
    }
  };

  eventSource.addEventListener("complete", () => {
    onComplete();
    eventSource.close();
  });

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      return;
    }
    onError("Contract stream connection error");
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * Get user's past contracts for cloning
 */
export async function getMyContracts(
  options?: {
    contract_type?: string;
    phase?: string;
    limit?: number;
    offset?: number;
  },
  accessToken?: string | null
): Promise<ContractListItem[]> {
  const params = new URLSearchParams();
  if (options?.contract_type) params.append("contract_type", options.contract_type);
  if (options?.phase) params.append("phase", options.phase);
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.offset) params.append("offset", options.offset.toString());

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const query = params.toString();
  return apiGet<ContractListItem[]>(`/contracts/my-contracts${query ? `?${query}` : ""}`, headers);
}

/**
 * Get enhanced templates with metadata
 */
export async function getEnhancedTemplates(
  options?: {
    contract_type?: string;
    source?: string;
    search?: string;
  },
  accessToken?: string | null
): Promise<EnhancedTemplate[]> {
  const params = new URLSearchParams();
  if (options?.contract_type) params.append("contract_type", options.contract_type);
  if (options?.source) params.append("source", options.source);
  if (options?.search) params.append("search", options.search);

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const query = params.toString();
  return apiGet<EnhancedTemplate[]>(`/contracts/templates/enhanced${query ? `?${query}` : ""}`, headers);
}

/**
 * Save a contract as a reusable template
 */
export async function saveContractAsTemplate(
  sessionId: string,
  request: SaveAsTemplateRequest,
  accessToken?: string | null
): Promise<ContractTemplate> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiPost<ContractTemplate>(`/contracts/${sessionId}/save-as-template`, request, headers);
}
