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

export interface ContractSession {
  session_id: string;
  template_id?: string;
  description: string;
  phase: ContractPhase;
  requirements?: ContractRequirements;
  draft?: ContractDraft;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface ContractRequirements {
  parties: PartyInfo[];
  key_terms: Record<string, string>;
  special_clauses?: string[];
  jurisdiction: string;
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
  use_default_template?: boolean;
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
  request: CreateContractRequest
): Promise<ContractSession> {
  return apiPost<ContractSession>("/contracts", request);
}

/**
 * Get contract session status
 */
export async function getContractSession(
  sessionId: string
): Promise<ContractSession> {
  return apiGet<ContractSession>(`/contracts/${sessionId}`);
}

/**
 * Submit contract requirements
 */
export async function submitContractRequirements(
  sessionId: string,
  requirements: ContractRequirements
): Promise<ContractSession> {
  return apiPost<ContractSession>(`/contracts/${sessionId}/requirements`, requirements);
}

/**
 * Submit review and edits
 */
export async function submitContractReview(
  sessionId: string,
  review: ContractReview
): Promise<ContractSession> {
  return apiPost<ContractSession>(`/contracts/${sessionId}/review`, review);
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
