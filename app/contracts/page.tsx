"use client";

import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  BookOpen,
  Trash2,
  Building2,
  User,
  Sparkles,
  Shield,
  Scale,
  Save,
  WifiOff,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { surfaceClasses } from "@/lib/design-system";
import { APIError } from "@/lib/api/client";
import {
  createContractSession,
  getContractSession,
  submitContractRequirements,
  submitContractReview,
  saveContractDraft,
  getContractDownloadUrl,
  type ContractSession,
  type ContractRequirements,
  type ContractQuestion,
  type PartyInfo,
  type EnhancedTemplate,
  type ContractListItem,
} from "@/lib/api";
import { useProgressAnnouncement } from "@/components/a11y/progress-announcer";
import { EditableDocumentCanvas } from "@/components/canvas/editable-document-canvas";
import { DocumentPanel, DocumentWorkspaceShell } from "@/components/canvas/document-workspace-shell";
import { RichTextToolbar } from "@/components/canvas/rich-text-toolbar";
import {
  TemplateBrowser,
  ContractBrowser,
  SaveAsTemplateDialog,
  type SourceType,
} from "@/components/contracts";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { useAuth, useRequireAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { useOnlineStatus } from "@/lib/hooks";
import { ensureRichHtml, richHtmlToPlainText, sanitizeRichHtml } from "@/lib/utils/rich-text";
import {
  clearActiveContractSessionId,
  clearContractSessionIdForPrompt,
  clearLegacyActiveContractSessionId,
  getActiveContractSessionId,
  getContractSessionIdForPrompt,
  setContractSessionIdForPrompt,
  setActiveContractSessionId,
} from "@/lib/utils/contract-session-storage";

const defaultParty: PartyInfo = {
  role: "",
  name: "",
  address: "",
  registration_number: "",
};
const CONTRACT_AUTOSAVE_DEBOUNCE_MS = 2500;
const CONTRACT_RATE_LIMIT_BACKOFF_MS = 10000;

function buildContractDocumentHtml(
  session: ContractSession,
  draftTitle: string,
  sectionTitles: Record<string, string>,
  sectionEditsRich: Record<string, string>,
): string {
  return sanitizeRichHtml(`
    <header data-contract-part="header">
      <h1>${draftTitle || session.draft?.title || "Contract Draft"}</h1>
      <p>Generated ${formatDateOnly(session.created_at)}</p>
    </header>
    ${(session.draft?.sections || [])
      .map((section, index) => {
        const sectionId = section.id || `section-${index}`;
        const richHtml = ensureRichHtml(section.content, sectionEditsRich[sectionId] ?? section.rich_content);
        return `
          <section id="${sectionId}" data-section-anchor="${sectionId}" data-contract-part="section" data-section-id="${sectionId}">
            <h2>${index + 1}. ${sectionTitles[sectionId] || section.title || `Section ${index + 1}`}</h2>
            <div data-contract-body="true">${richHtml}</div>
          </section>
        `;
      })
      .join("")}
    <section data-contract-part="signature-block" contenteditable="false">
      <h2>Signatures</h2>
      <div class="grid gap-12 sm:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Party</p>
          <div class="mt-12 border-b border-border"></div>
          <p class="mt-3 text-sm italic text-muted-foreground">Signature</p>
          <div class="mt-8 border-b border-border"></div>
          <p class="mt-3 text-sm italic text-muted-foreground">Date</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Second Party</p>
          <div class="mt-12 border-b border-border"></div>
          <p class="mt-3 text-sm italic text-muted-foreground">Signature</p>
          <div class="mt-8 border-b border-border"></div>
          <p class="mt-3 text-sm italic text-muted-foreground">Date</p>
        </div>
      </div>
    </section>
  `);
}

function parseContractDocumentHtml(
  html: string,
  session: ContractSession,
): {
  title: string;
  sectionTitles: Record<string, string>;
  sectionPlain: Record<string, string>;
  sectionRich: Record<string, string>;
} {
  if (typeof window === "undefined" || !session.draft) {
    return {
      title: session.draft?.title || "Contract Draft",
      sectionTitles: Object.fromEntries((session.draft?.sections || []).map((section, index) => [section.id || `section-${index}`, section.title || `Section ${index + 1}`])),
      sectionPlain: Object.fromEntries((session.draft?.sections || []).map((section, index) => [section.id || `section-${index}`, section.content])),
      sectionRich: Object.fromEntries((session.draft?.sections || []).map((section, index) => [section.id || `section-${index}`, ensureRichHtml(section.content, section.rich_content)])),
    };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.querySelector("header h1")?.textContent?.trim() || session.draft.title || "Contract Draft";
  const sectionTitles: Record<string, string> = {};
  const sectionPlain: Record<string, string> = {};
  const sectionRich: Record<string, string> = {};

  session.draft.sections.forEach((section, index) => {
    const sectionId = section.id || `section-${index}`;
    const sectionNode = doc.querySelector<HTMLElement>(`[data-contract-part='section'][data-section-id='${sectionId}']`);
    const heading = sectionNode?.querySelector("h2")?.textContent?.trim();
    const bodyHtml = sanitizeRichHtml(
      sectionNode?.querySelector<HTMLElement>("[data-contract-body]")?.innerHTML ||
      ensureRichHtml(section.content, section.rich_content)
    );
    sectionTitles[sectionId] = heading?.replace(/^\d+\.\s*/, "").trim() || section.title || `Section ${index + 1}`;
    sectionRich[sectionId] = bodyHtml;
    sectionPlain[sectionId] = richHtmlToPlainText(bodyHtml);
  });

  return { title, sectionTitles, sectionPlain, sectionRich };
}

function buildContractKickoffDocumentHtml(description: string): string {
  return sanitizeRichHtml(`
    <header data-contract-part="header">
      <h1>Contract Brief</h1>
      <p>Draft the commercial instruction for the contract you want generated.</p>
    </header>
    <section id="contract-objective" data-section-anchor="contract-objective" data-contract-part="section" data-section-id="contract-objective">
      <h2>Instruction</h2>
      <div data-contract-body="true">${ensureRichHtml(
        description || "Describe the contract type, the parties, the commercial deal, and any clauses or risks that must be addressed."
      )}</div>
    </section>
    <section id="contract-notes" data-section-anchor="contract-notes" data-contract-part="section" data-section-id="contract-notes" contenteditable="false">
      <h2>What happens next</h2>
      <p>The system will gather the key requirements, draft the contract in the document canvas, then let you revise and approve the full draft.</p>
    </section>
  `);
}

function parseContractKickoffDocumentHtml(html: string, fallbackDescription: string): string {
  if (typeof window === "undefined") return fallbackDescription;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const instructionNode = doc.querySelector<HTMLElement>("[data-section-id='contract-objective'] [data-contract-body]");
  const instructionHtml = sanitizeRichHtml(instructionNode?.innerHTML || ensureRichHtml(fallbackDescription || ""));
  return richHtmlToPlainText(instructionHtml).trim();
}

function buildContractRequirementsDocumentHtml(
  session: ContractSession,
  description: string,
  parties: PartyInfo[],
  jurisdiction: string,
  keyTerms: Record<string, string>,
  variableValues: Record<string, string>,
): string {
  const activeParties = parties.filter((party) => party.name.trim() || party.role.trim() || party.address?.trim());
  const partyHtml = activeParties.length
    ? activeParties
        .map(
          (party, index) => `
            <div class="workspace-note-surface px-4 py-3">
              <h3>${party.role || `Party ${index + 1}`}</h3>
              <p>${party.name || "Legal name pending"}</p>
              ${party.address ? `<p>${party.address}</p>` : ""}
            </div>
          `
        )
        .join("")
    : `<p>Add party information from the left rail to build the requirements memo.</p>`;

  const questionRows = (session.questions || [])
    .map((question) => {
      const answer = variableValues[question.variable] || keyTerms[question.variable] || "";
      return `
        <tr>
          <td>${question.variable.replace(/_/g, " ")}</td>
          <td>${answer || "Pending input"}</td>
        </tr>
      `;
    })
    .join("");

  return sanitizeRichHtml(`
    <header data-contract-part="header">
      <h1>Contract Requirements</h1>
      <p>Refine the drafting memo while the left rail captures structured variables.</p>
    </header>
    <section id="contract-instruction" data-section-anchor="contract-instruction" data-contract-part="section" data-section-id="contract-instruction">
      <h2>Drafting Instruction</h2>
      <div data-contract-body="true">${ensureRichHtml(description || session.description || "")}</div>
    </section>
    <section id="contract-parties" data-section-anchor="contract-parties" data-contract-part="section" data-section-id="contract-parties" contenteditable="false">
      <h2>Parties</h2>
      <div class="grid gap-4">${partyHtml}</div>
    </section>
    <section id="contract-scope" data-section-anchor="contract-scope" data-contract-part="section" data-section-id="contract-scope" contenteditable="false">
      <h2>Scope and Terms</h2>
      <p><strong>Jurisdiction:</strong> ${jurisdiction}</p>
      ${keyTerms.effective_date ? `<p><strong>Effective date:</strong> ${keyTerms.effective_date}</p>` : ""}
      ${keyTerms.duration ? `<p><strong>Duration:</strong> ${keyTerms.duration}</p>` : ""}
      ${keyTerms.value ? `<p><strong>Consideration:</strong> ${keyTerms.value}</p>` : ""}
    </section>
    <section id="contract-open-items" data-section-anchor="contract-open-items" data-contract-part="section" data-section-id="contract-open-items" contenteditable="false">
      <h2>Open Variables</h2>
      ${
        questionRows
          ? `<table><thead><tr><th>Variable</th><th>Current input</th></tr></thead><tbody>${questionRows}</tbody></table>`
          : "<p>The contract is ready for generation.</p>"
      }
    </section>
  `);
}

function parseContractRequirementsDocumentHtml(html: string, fallbackDescription: string): string {
  if (typeof window === "undefined") return fallbackDescription;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const instructionNode = doc.querySelector<HTMLElement>("[data-section-id='contract-instruction'] [data-contract-body]");
  const instructionHtml = sanitizeRichHtml(instructionNode?.innerHTML || ensureRichHtml(fallbackDescription || ""));
  return richHtmlToPlainText(instructionHtml).trim();
}

function ContractsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { refresh: refreshEntitlements } = useEntitlements();
  const initialDescription = searchParams.get("q");
  const sessionIdParam = searchParams.get("session");

  const [session, setSession] = useState<ContractSession | null>(null);
  const [description, setDescription] = useState(initialDescription || "");
  const [kickoffEditor, setKickoffEditor] = useState<HTMLElement | null>(null);
  const [contractKickoffHtml, setContractKickoffHtml] = useState(() => buildContractKickoffDocumentHtml(initialDescription || ""));

  // Source selection state
  const [selectedSource, setSelectedSource] = useState<SourceType>("fresh");
  const [selectedTemplateData, setSelectedTemplateData] = useState<EnhancedTemplate | null>(null);
  const [selectedContractData, setSelectedContractData] = useState<ContractListItem | null>(null);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showContractBrowser, setShowContractBrowser] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [parties, setParties] = useState<PartyInfo[]>([
    { ...defaultParty, role: "First Party" },
    { ...defaultParty, role: "Second Party" },
  ]);
  const [keyTerms, setKeyTerms] = useState<Record<string, string>>({});
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [jurisdiction, setJurisdiction] = useState("Uganda");
  const [draftTitle, setDraftTitle] = useState("");
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({});
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
  const [sectionEditsRich, setSectionEditsRich] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [requirementsEditor, setRequirementsEditor] = useState<HTMLElement | null>(null);
  const [contractEditor, setContractEditor] = useState<HTMLElement | null>(null);
  const [draftSaveState, setDraftSaveState] = useState<"idle" | "saving" | "saved" | "error" | "rate_limited">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sr-only live regions for screen-reader users. Phase channel is
  // unthrottled (drafting → review → complete); progress is bucketed
  // to 5%. Hook mounts at body level so it survives this component's
  // many conditional return paths.
  useProgressAnnouncement({
    phase: session?.phase ?? session?.status,
    message: error ?? null,
    percent: session?.progress_percent ?? null,
    completionMessage:
      session?.phase === "complete"
        ? "Contract draft complete. Ready to download."
        : null,
    errorMessage:
      session?.phase === "failed"
        ? error || session?.error || "Contract drafting failed."
        : null,
  });

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftingResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoResumedSessionIdRef = useRef<string | null>(null);
  const draftRetryAtRef = useRef(0);
  const hydratedDraftRef = useRef(false);
  const lastSavedDraftRef = useRef<string | null>(null);
  const { isOnline, wasOffline, isHydrated } = useOnlineStatus();
  const activeOrganizationId = (typeof window !== "undefined"
    ? window.localStorage.getItem("selected_organization_id")
    : null) || user?.default_organization_id;
  const requirementsDocumentHtml = useMemo(
    () =>
      session?.phase === "requirements"
        ? buildContractRequirementsDocumentHtml(session, description, parties, jurisdiction, keyTerms, variableValues)
        : "",
    [description, jurisdiction, keyTerms, parties, session, variableValues]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    clearLegacyActiveContractSessionId(window.localStorage);
    if (sessionIdParam) return;
    if (initialDescription?.trim()) {
      const matchedSessionId = getContractSessionIdForPrompt(
        window.localStorage,
        user?.id,
        activeOrganizationId,
        initialDescription,
      );
      if (matchedSessionId) {
        autoResumedSessionIdRef.current = matchedSessionId;
        router.replace(`/contracts?session=${matchedSessionId}`);
      }
      return;
    }
    const activeSessionId = getActiveContractSessionId(window.localStorage, user?.id, activeOrganizationId);
    if (activeSessionId) {
      autoResumedSessionIdRef.current = activeSessionId;
      router.replace(`/contracts?session=${activeSessionId}`);
    }
  }, [activeOrganizationId, initialDescription, router, sessionIdParam, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session && !["complete", "failed", "approval"].includes(session.phase)) {
      setActiveContractSessionId(window.localStorage, user?.id, activeOrganizationId, session.session_id);
    } else if (session?.phase === "complete" || session?.phase === "failed" || session?.phase === "approval") {
      clearActiveContractSessionId(window.localStorage, user?.id, activeOrganizationId);
    }

    const promptToRemember = initialDescription?.trim() || session?.description?.trim();
    if (session?.session_id && promptToRemember) {
      setContractSessionIdForPrompt(
        window.localStorage,
        user?.id,
        activeOrganizationId,
        promptToRemember,
        session.session_id,
      );
    }
  }, [activeOrganizationId, initialDescription, session, user?.id]);

  useEffect(() => {
    if (!session?.draft) return;
    setDraftTitle(session.draft.title || "");
    setSectionTitles(
      Object.fromEntries(
        session.draft.sections.map((section, index) => [
          section.id || `section-${index}`,
          section.title || `Section ${index + 1}`,
        ])
      )
    );
    setSectionEdits(
      Object.fromEntries(
        session.draft.sections.map((section, index) => [
          section.id || `section-${index}`,
          section.content,
        ])
      )
    );
    setSectionEditsRich(
      Object.fromEntries(
        session.draft.sections.map((section, index) => [
          section.id || `section-${index}`,
          ensureRichHtml(section.content, section.rich_content),
        ])
      )
    );
  }, [session?.draft]);

  useEffect(() => {
    if (session?.phase !== "review" || !session.draft) return;
    const currentDraft = session.draft;
    if (!hydratedDraftRef.current) {
      hydratedDraftRef.current = true;
      return;
    }

    const draftToSave = {
      title: draftTitle || currentDraft.title || "Contract Draft",
      sections: currentDraft.sections.map((section, index) => {
        const sectionId = section.id || `section-${index}`;
        return {
          ...section,
          id: sectionId,
          title: sectionTitles[sectionId] ?? section.title,
          content: sectionEdits[sectionId] ?? section.content,
          rich_content: sectionEditsRich[sectionId] ?? section.rich_content,
        };
      }),
    };

    const currentDraftHash = JSON.stringify(draftToSave);
    if (lastSavedDraftRef.current === currentDraftHash) return;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    const delay = Math.max(CONTRACT_AUTOSAVE_DEBOUNCE_MS, draftRetryAtRef.current - Date.now(), 0);
    draftSaveTimerRef.current = setTimeout(async () => {
      setDraftSaveState("saving");
      try {
        lastSavedDraftRef.current = currentDraftHash;
        const updatedSession = await saveContractDraft(session.session_id, draftToSave);
        setSession(updatedSession);
        setDraftSaveState("saved");
      } catch (error) {
        lastSavedDraftRef.current = null;
        if (error instanceof APIError && error.status === 429) {
          draftRetryAtRef.current = Date.now() + CONTRACT_RATE_LIMIT_BACKOFF_MS;
          setDraftSaveState("rate_limited");
          return;
        }
        setDraftSaveState("error");
      }
    }, delay);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [draftTitle, sectionEdits, sectionEditsRich, sectionTitles, session?.session_id, session?.phase, session?.draft]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionData = await getContractSession(sessionId);
      autoResumedSessionIdRef.current = null;
      setSession(sessionData);
    } catch (err) {
      const isMissingOrForbidden = err instanceof APIError && (err.status === 404 || err.status === 403);
      if (typeof window !== "undefined" && isMissingOrForbidden) {
        const storedSessionId = getActiveContractSessionId(window.localStorage, user?.id, activeOrganizationId);
        const shouldResetRoute = sessionId === autoResumedSessionIdRef.current || sessionId === storedSessionId;
        if (storedSessionId === sessionId) {
          clearActiveContractSessionId(window.localStorage, user?.id, activeOrganizationId);
        }
        if (initialDescription?.trim()) {
          clearContractSessionIdForPrompt(
            window.localStorage,
            user?.id,
            activeOrganizationId,
            initialDescription,
          );
        }
        autoResumedSessionIdRef.current = null;
        if (shouldResetRoute) {
          setSession(null);
          setError(null);
          router.replace(initialDescription?.trim() ? `/contracts?q=${encodeURIComponent(initialDescription)}` : "/contracts");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganizationId, initialDescription, router, user?.id]);

  // Load existing session if session ID provided
  useEffect(() => {
    if (sessionIdParam) {
      loadSession(sessionIdParam);
    }
  }, [sessionIdParam, loadSession]);

  // Note: Auto-start behavior removed - user must click "Start Drafting" explicitly
  // The initialDescription from ?q= param is pre-filled in the textarea for convenience

  // Poll for updates while in drafting phase
  useEffect(() => {
    if (!session || session.phase !== "drafting") return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedSession = await getContractSession(session.session_id);
        if (updatedSession.phase !== "drafting") {
          setSession(updatedSession);
          clearInterval(pollInterval);
          // Refresh entitlements to update usage counts after drafting completes
          refreshEntitlements();
        } else {
          // Update session with progress during drafting
          setSession(updatedSession);
        }
      } catch (err) {
        if (err instanceof APIError && err.status === 429) {
          clearInterval(pollInterval);
          draftingResumeTimerRef.current = setTimeout(() => {
            void loadSession(session.session_id);
          }, CONTRACT_RATE_LIMIT_BACKOFF_MS);
          return;
        }
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
      if (draftingResumeTimerRef.current) {
        clearTimeout(draftingResumeTimerRef.current);
        draftingResumeTimerRef.current = null;
      }
    };
  }, [loadSession, refreshEntitlements, session?.session_id, session?.phase, session]);

  // Infer contract type from description
  const inferContractType = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes("employ") || lower.includes("job") || lower.includes("work")) {
      return "employment";
    }
    if (lower.includes("nda") || lower.includes("non-disclosure") || lower.includes("confidential")) {
      return "nda";
    }
    if (lower.includes("service") || lower.includes("consult")) {
      return "service";
    }
    if (lower.includes("sale") || lower.includes("purchase") || lower.includes("buy")) {
      return "sale";
    }
    if (lower.includes("lease") || lower.includes("rent") || lower.includes("tenancy")) {
      return "lease";
    }
    return "general"; // Default to general contract
  };

  const handleStartContract = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const contractType = inferContractType(description);

      // Build request with source selection
      const request: Parameters<typeof createContractSession>[0] = {
        contract_type: contractType,
        description: description.trim(),
      };

      // Add template or source contract based on selection
      if (selectedSource === "template" && selectedTemplateData) {
        request.template_id = selectedTemplateData.id;
      } else if (selectedSource === "clone" && selectedContractData) {
        request.source_contract_id = selectedContractData.session_id;
      }

      const newSession = await createContractSession(request);
      setSession(newSession);
      router.replace(`/contracts?session=${newSession.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start contract");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSelect = (source: SourceType) => {
    setSelectedSource(source);
    if (source === "fresh") {
      setSelectedTemplateData(null);
      setSelectedContractData(null);
    }
  };

  const handleTemplateSelect = (template: EnhancedTemplate) => {
    setSelectedSource("template");
    setSelectedTemplateData(template);
    setSelectedContractData(null);
  };

  const handleContractSelect = (contract: ContractListItem) => {
    setSelectedSource("clone");
    setSelectedContractData(contract);
    setSelectedTemplateData(null);
  };

  const handleSubmitRequirements = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const requirements: ContractRequirements = {
        parties: parties.filter((p) => p.name.trim()),
        key_terms: keyTerms,
        variable_values: variableValues,
        jurisdiction,
        effective_date: keyTerms.effective_date,
      };

      const updatedSession = await submitContractRequirements(
        session.session_id,
        requirements
      );
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit requirements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveContract = async () => {
    if (!session?.draft) return;

    setIsLoading(true);
    setError(null);

    try {
      const edits = session.draft.sections
        .map((section, index) => {
          const sectionId = section.id || `section-${index}`;
          const content = sectionEdits[sectionId];
          if (content === undefined || content === section.content) {
            return null;
          }
          return {
          section_id: sectionId,
          new_content: content,
          };
        })
        .filter((edit): edit is { section_id: string; new_content: string } => Boolean(edit));

      const updatedSession = await submitContractReview(
        session.session_id,
        {
          approved: true,
          edits: edits.length > 0 ? edits : undefined,
        }
      );
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve contract");
    } finally {
      setIsLoading(false);
    }
  };
  const addParty = () => {
    setParties([...parties, { ...defaultParty, role: `Party ${parties.length + 1}` }]);
  };

  const removeParty = (index: number) => {
    if (parties.length > 2) {
      setParties(parties.filter((_, i) => i !== index));
    }
  };

  const updateParty = (index: number, field: keyof PartyInfo, value: string) => {
    const updated = [...parties];
    updated[index] = { ...updated[index], [field]: value };
    setParties(updated);
  };

  const renderQuestionInput = (question: ContractQuestion) => {
    const value = variableValues[question.variable] || "";
    const updateValue = (newValue: string) => {
      setVariableValues((prev) => ({ ...prev, [question.variable]: newValue }));
    };

    switch (question.question_type) {
      case "select":
        return (
          <Select value={value} onValueChange={updateValue}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            className="mt-1 min-h-[100px]"
            placeholder="Enter your response..."
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            className="mt-1"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            className="mt-1"
            placeholder="Enter a number"
          />
        );
      case "boolean":
        return (
          <Select value={value} onValueChange={updateValue}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select yes or no" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        );
      default: // text
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            className="mt-1"
            placeholder="Enter your response..."
          />
        );
    }
  };



  // Initial description input
  if (!session && !sessionIdParam) {
    return (
      <TooltipProvider>
        <DocumentWorkspaceShell
          title="Contract Workspace"
          titleIcon={<FileText className="h-4 w-4 text-primary" />}
          headerActions={
            <Button
              onClick={handleStartContract}
              disabled={!description.trim() || isLoading}
              variant="brand"
              className="rounded-full px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Drafting
                </>
              )}
            </Button>
          }
          sidebarClassName="workspace-sidebar-surface w-80"
          sidebar={
            <div className="space-y-8 p-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start Mode</h3>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSourceSelect("fresh")}
                      className={cn(
                        surfaceClasses.optionCard,
                        selectedSource === "fresh" && surfaceClasses.optionCardActive
                      )}
                    >
                      <div className="font-medium">Start fresh</div>
                      <div className="mt-1 text-muted-foreground">Generate a new contract from the brief in the canvas.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTemplateBrowser(true)}
                      className={cn(
                        surfaceClasses.optionCard,
                        (selectedSource === "template" || selectedTemplateData) &&
                          surfaceClasses.optionCardActive
                      )}
                    >
                      <div className="font-medium">Use template</div>
                      <div className="mt-1 text-muted-foreground">{selectedTemplateData?.name || "Start from an existing clause structure."}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContractBrowser(true)}
                      className={cn(
                        surfaceClasses.optionCard,
                        (selectedSource === "clone" || selectedContractData) &&
                          surfaceClasses.optionCardActive
                      )}
                    >
                      <div className="font-medium">Clone past contract</div>
                      <div className="mt-1 text-muted-foreground">{selectedContractData?.title || "Reuse a prior contract as the starting point."}</div>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workflow</h3>
                  <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <li className="text-foreground">1. Refine the drafting instruction</li>
                    <li>2. Confirm variables and parties</li>
                    <li>3. Edit and approve the full draft</li>
                  </ol>
                </div>

                <div className="workspace-note-surface">
                  Write the commercial instruction like a briefing note. The draft will open in the full contract canvas after generation.
                </div>
            </div>
          }
          mainClassName="workspace-main-surface p-5 md:p-8 lg:p-10"
        >
          <div className="mx-auto max-w-6xl pb-24">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <DocumentPanel
              title="Contract Drafting"
              titleIcon={<Scale className="h-4 w-4 text-primary" />}
              badge={<Badge variant="secondary" className="rounded-full">Editable brief</Badge>}
              toolbar={<RichTextToolbar editor={kickoffEditor} disabled={!kickoffEditor} />}
            >
              <EditableDocumentCanvas
                html={contractKickoffHtml}
                onEditorReady={setKickoffEditor}
                surfaceClassName="rounded-none border-0 bg-transparent px-14 py-8 shadow-none"
                onChange={(html) => {
                  setContractKickoffHtml(html);
                  setDescription(parseContractKickoffDocumentHtml(html, description));
                }}
              />
            </DocumentPanel>
          </div>

          <TemplateBrowser
            open={showTemplateBrowser}
            onClose={() => setShowTemplateBrowser(false)}
            onSelect={handleTemplateSelect}
            selectedId={selectedTemplateData?.id}
          />
          <ContractBrowser
            open={showContractBrowser}
            onClose={() => setShowContractBrowser(false)}
            onSelect={handleContractSelect}
            selectedId={selectedContractData?.session_id}
          />
        </DocumentWorkspaceShell>
      </TooltipProvider>
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

  // Requirements phase
  if (session?.phase === "requirements") {
    return (
      <TooltipProvider>
        <DocumentWorkspaceShell
          title="Contract Requirements"
          titleIcon={<FileText className="h-4 w-4 text-primary" />}
          headerActions={
            <Button
              onClick={handleSubmitRequirements}
              disabled={isLoading || !parties.some((p) => p.name.trim())}
              size="sm"
              variant="brand"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Draft
                </>
              )}
            </Button>
          }
          sidebarClassName="workspace-sidebar-surface w-80"
          sidebar={
            <div className="space-y-8 p-4">
                {/* Parties Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parties</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={addParty} className="h-7 px-2 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {parties.map((party, index) => (
                      <div key={index} className="bg-background rounded-xl p-3 border shadow-sm space-y-3 relative group">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {index === 0 ? <User className="h-4 w-4 text-muted-foreground" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                          Party {index + 1}
                          {parties.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeParty(index)}
                              className="ll-icon-button ll-icon-button-danger absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={party.role}
                            onChange={(e) => updateParty(index, "role", e.target.value)}
                            placeholder="Role (e.g. Employer)"
                            className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
                          />
                          <Input
                            value={party.name}
                            onChange={(e) => updateParty(index, "name", e.target.value)}
                            placeholder="Full legal name"
                            className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
                          />
                          <Input
                            value={party.address}
                            onChange={(e) => updateParty(index, "address", e.target.value)}
                            placeholder="Address (Optional)"
                            className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Scope & Terms */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Scope & Terms</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">Jurisdiction</Label>
                      <Select value={jurisdiction} onValueChange={setJurisdiction}>
                        <SelectTrigger className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Uganda">Uganda</SelectItem>
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="Tanzania">Tanzania</SelectItem>
                          <SelectItem value="Rwanda">Rwanda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Key Terms - shown when no dynamic questions */}
                    {(!session.questions || session.questions.length === 0) && (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground font-medium">Effective Date</Label>
                          <Input
                            type="date"
                            value={keyTerms.effective_date || ""}
                            onChange={(e) => setKeyTerms({ ...keyTerms, effective_date: e.target.value })}
                            className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground font-medium">Duration/Term</Label>
                          <Input
                            value={keyTerms.duration || ""}
                            onChange={(e) => setKeyTerms({ ...keyTerms, duration: e.target.value })}
                            placeholder="E.g. 2 years, indefinite"
                            className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground font-medium">Value/Consideration</Label>
                          <Input
                            value={keyTerms.value || ""}
                            onChange={(e) => setKeyTerms({ ...keyTerms, value: e.target.value })}
                            placeholder="E.g. UGX 5,000,000"
                            className="h-8 text-xs bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Questions */}
                {session.questions && session.questions.length > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Contract Details</h3>
                      
                      {(() => {
                        const groups = session.questions.reduce((acc, q) => {
                          const group = q.group || "general";
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(q);
                          return acc;
                        }, {} as Record<string, ContractQuestion[]>);

                        return Object.entries(groups).map(([groupName, questions]) => (
                          <div key={groupName} className="space-y-4 mb-6 last:mb-0">
                            {Object.keys(groups).length > 1 && (
                              <Label className="text-xs font-semibold text-muted-foreground capitalize">
                                {groupName.replace(/_/g, " ")}
                              </Label>
                            )}
                            <div className="space-y-4">
                              {questions.map((question) => (
                                <div key={question.id} className="space-y-1.5">
                                  <Label className="text-xs font-medium text-foreground">
                                    {question.question}
                                    {question.required && <span className="text-destructive ml-1">*</span>}
                                  </Label>
                                  {renderQuestionInput(question)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}
            </div>
          }
          mainClassName="workspace-main-surface p-5 md:p-8 lg:p-10"
        >
          <div className="mx-auto max-w-6xl pb-24">
            {!isOnline && isHydrated && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-border/60 bg-primary/10 p-4 text-sm text-foreground">
                <WifiOff className="h-5 w-5 shrink-0 mt-0.5" />
                <div>You are offline. Contract drafting continues in the background and this session will reconnect automatically.</div>
              </div>
            )}
            
            {wasOffline && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-border/60 bg-primary/10 p-4 text-sm text-foreground">
                <RefreshCcw className="h-5 w-5 shrink-0 mt-0.5" />
                <div>Connection restored. Re-syncing contract generation progress.</div>
              </div>
            )}
            <DocumentPanel
              title="Contract Requirements"
              titleIcon={<FileText className="h-4 w-4 text-primary" />}
              badge={<Badge variant="secondary" className="rounded-full">Live memo</Badge>}
              toolbar={<RichTextToolbar editor={requirementsEditor} disabled={!requirementsEditor} />}
            >
              <EditableDocumentCanvas
                html={requirementsDocumentHtml}
                onEditorReady={setRequirementsEditor}
                surfaceClassName="rounded-none border-0 bg-transparent px-14 py-8 shadow-none"
                onChange={(html) => {
                  setDescription(parseContractRequirementsDocumentHtml(html, description));
                }}
              />
            </DocumentPanel>
          </div>
        </DocumentWorkspaceShell>
      </TooltipProvider>
    );
  }

  // Drafting phase - Enhanced with progress display
  if (session?.phase === "drafting") {
    const progress = session.progress_percent || 0;
    const getProgressStep = (percent: number): string => {
      if (percent < 20) return "Initializing contract generation...";
      if (percent < 40) return "Analyzing template structure...";
      if (percent < 60) return "Generating contract sections...";
      if (percent < 80) return "Reviewing and refining clauses...";
      if (percent < 95) return "Finalizing contract draft...";
      return "Almost complete...";
    };
    const draftingStages = [
      {
        id: "intake",
        title: "Validate requirements and parties",
        description: "Checks the drafting memo, parties, jurisdiction, and variable inputs before clause generation starts.",
        threshold: 0,
        completeAt: 20,
      },
      {
        id: "structure",
        title: "Structure obligations and clauses",
        description: "Builds the clause order, definitions, commercial terms, and the primary legal obligations in the draft.",
        threshold: 20,
        completeAt: 55,
      },
      {
        id: "jurisdiction",
        title: "Apply jurisdiction and compliance logic",
        description: "Adjusts clauses for governing law, compliance requirements, and drafting consistency across the full document.",
        threshold: 55,
        completeAt: 85,
      },
      {
        id: "finish",
        title: "Finalize the draft for review",
        description: "Polishes layout, reconciles variables, and prepares the contract canvas for line editing and approval.",
        threshold: 85,
        completeAt: 100,
      },
    ].map((stage, index, stages) => {
      const nextThreshold = stages[index + 1]?.threshold ?? 100;
      const status =
        progress >= stage.completeAt
          ? "completed"
          : progress >= stage.threshold && progress < nextThreshold
            ? "in_progress"
            : "pending";
      return { ...stage, status };
    });

    return (
      <TooltipProvider>
        <DocumentWorkspaceShell
          title="Drafting Contract..."
          titleIcon={<FileText className="h-4 w-4 text-primary" />}
          sidebarClassName="workspace-sidebar-surface w-80"
          sidebar={
            <div className="space-y-6 p-6">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Generating Draft
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getProgressStep(progress)}
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Drafting Stages</h3>
                  <div className="space-y-2">
                    {draftingStages.map((stage, index) => (
                      <div
                        key={stage.id}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm transition-colors",
                          stage.status === "completed" && "border-primary/20 bg-primary/10",
                          stage.status === "in_progress" && "border-primary/30 bg-primary/10",
                          stage.status === "pending" && "surface-inset"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">{index + 1}</div>
                            <div className="font-medium text-foreground">{stage.title}</div>
                          </div>
                          {stage.status === "completed" && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                          {stage.status === "in_progress" && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          }
          mainClassName="workspace-main-surface p-5 md:p-8 lg:p-10"
        >
          <div className="mx-auto max-w-6xl pb-24">
            <DocumentPanel
              title="Contract Draft Workspace"
              titleIcon={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
              badge={<Badge variant="secondary" className="rounded-full">Live drafting</Badge>}
              bodyClassName="px-10 py-8 md:px-14"
            >
                    <div className="mb-10">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Working Draft</div>
                      <h1 className="font-serif text-[2.2rem] font-semibold tracking-tight text-foreground">
                        {description || "Contract instruction"}
                      </h1>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                        The drafting engine is turning your approved memo into a full contract. The workspace stays document-shaped so the transition into review feels continuous.
                      </p>
                    </div>

                    <section className="workspace-section-surface mb-10">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current Activity</div>
                          <p className="mt-2 text-sm font-medium text-foreground">{getProgressStep(progress)}</p>
                        </div>
                        <div className="min-w-[140px]">
                          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                            <span>Overall progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${Math.max(progress, 5)}%` }} />
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="space-y-8">
                      {draftingStages.map((stage, index) => (
                        <section key={stage.id} className="border-b border-border/50 pb-8 last:border-b-0">
                          <div className="mb-3 flex items-center gap-3">
                            <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-semibold tracking-tight text-foreground">{stage.title}</h2>
                              {stage.status === "in_progress" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                              {stage.status === "completed" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                          <p className="max-w-4xl text-sm leading-7 text-muted-foreground">{stage.description}</p>
                          <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <div className="surface-inset px-4 py-4 text-sm">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                              <div className="mt-2 font-medium text-foreground">{stage.status.replace("_", " ")}</div>
                            </div>
                            <div className="surface-inset px-4 py-4 text-sm">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Input basis</div>
                              <div className="mt-2 font-medium text-foreground">Brief + requirements memo</div>
                            </div>
                            <div className="surface-inset px-4 py-4 text-sm">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Output state</div>
                              <div className="mt-2 font-medium text-foreground">
                                {stage.status === "completed" ? "Ready for review" : stage.status === "in_progress" ? "Drafting in progress" : "Waiting for prior stage"}
                              </div>
                            </div>
                          </div>
                        </section>
                      ))}
                    </div>
            </DocumentPanel>
          </div>
        </DocumentWorkspaceShell>
      </TooltipProvider>
    );
  }

  // Review and Complete phases - contract canvas
  if ((session?.phase === "review" || session?.phase === "complete" || session?.phase === "approval") && session?.draft) {
    const isComplete = session.phase === "complete" || session.phase === "approval";
    const scrollToSection = (sectionId: string) => {
      const element = sectionRefs.current[sectionId] ?? document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(sectionId);
      }
    };
    const contractDocumentHtml = buildContractDocumentHtml(session, draftTitle, sectionTitles, sectionEditsRich);

    return (
      <TooltipProvider>
        <DocumentWorkspaceShell
          title={draftTitle || session.draft.title}
          titleIcon={<Scale className="h-4 w-4 text-primary" />}
          titleBadge={
            isComplete ? (
              <Badge variant="secondary" className="ml-2 border-border/60 bg-primary/10 text-primary hover:bg-primary/20">
                Finalized
              </Badge>
            ) : undefined
          }
          headerMeta={
            !isComplete ? (
              <>
                {draftSaveState === "saving" && <span className="hidden animate-pulse text-xs text-muted-foreground sm:inline-block">Saving...</span>}
                {draftSaveState === "saved" && <span className="hidden text-xs text-muted-foreground sm:inline-block">Saved to cloud</span>}
                {draftSaveState === "rate_limited" && <span className="hidden text-xs text-muted-foreground sm:inline-block">Autosave paused briefly</span>}
                {draftSaveState === "error" && <span className="hidden text-xs text-destructive sm:inline-block">Save failed</span>}
              </>
            ) : null
          }
          headerActions={
            !isComplete ? (
              <Button
                onClick={handleApproveContract}
                disabled={isLoading}
                size="sm"
                variant="brand"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span>Approve Draft</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={getContractDownloadUrl(session.session_id, "docx")} download>
                    <Download className="mr-2 h-4 w-4" /> Word
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={getContractDownloadUrl(session.session_id, "pdf")} download>
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </a>
                </Button>
                <Button variant="default" size="sm" onClick={() => setShowSaveAsTemplate(true)}>
                  <Save className="mr-2 h-4 w-4" /> Save Template
                </Button>
              </div>
            )
          }
          sidebarClassName="workspace-sidebar-surface w-80"
          sidebar={
            <div className="space-y-6 p-4">
                {(session.draft.warnings?.length > 0 || session.draft.compliance_notes?.length > 0) && (
                  <div className="space-y-3">
                    {session.draft.warnings && session.draft.warnings.length > 0 && (
                      <div className="workspace-section-surface rounded-lg p-3">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Review Notes</span>
                        </div>
                        <ul className="space-y-1.5 pl-6 text-xs text-muted-foreground list-disc">
                          {session.draft.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {session.draft.compliance_notes && session.draft.compliance_notes.length > 0 && (
                      <div className="workspace-section-surface rounded-lg p-3">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Compliance</span>
                        </div>
                        <ul className="space-y-1.5 pl-6 text-xs text-muted-foreground list-disc">
                          {session.draft.compliance_notes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {((session.mandatory_clause_guidance?.length ?? 0) > 0 || (session.applicable_laws?.length ?? 0) > 0) && (
                  <div className="space-y-3">
                    {(session.mandatory_clause_guidance?.length ?? 0) > 0 && (
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <Scale className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Mandatory Clause Guidance</span>
                        </div>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                          {session.mandatory_clause_guidance?.map((item, i) => (
                            <li key={`${item.clause_title}-${i}`} className="surface-inset rounded-md px-2 py-2">
                              <p className="font-semibold">{item.clause_title}</p>
                              <p className="mt-1 text-[11px] leading-relaxed">{item.rationale}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(session.legal_evidence_registry?.length ?? 0) > 0 && (
                      <div className="workspace-section-surface rounded-lg p-3">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Supporting Evidence</span>
                        </div>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                          {session.legal_evidence_registry?.slice(0, 4).map((item) => (
                            <li key={item.id} className="surface-inset rounded-md px-2 py-2">
                              <p className="font-medium capitalize">{item.evidence_type.replace(/_/g, " ")}</p>
                              <p className="mt-1 text-[11px] leading-relaxed">{item.text}</p>
                              {item.legal_references?.length > 0 && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {item.legal_references.slice(0, 2).join(" · ")}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(session.applicable_laws?.length ?? 0) > 0 && (
                      <div className="workspace-section-surface rounded-lg p-3">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Applicable Authorities</span>
                        </div>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                          {session.applicable_laws?.map((authority) => (
                            <li key={authority.id} className="surface-inset rounded-md px-2 py-2">
                              <p className="font-medium">{authority.title}</p>
                              {authority.legal_reference && (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">{authority.legal_reference}</p>
                              )}
                              {authority.source_quality_label && (
                                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{authority.source_quality_label}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center justify-between">
                    <span>Contract Outline</span>
                    <Badge variant="secondary" className="text-[10px] tabular-nums">{session.draft.sections.length}</Badge>
                  </h3>
                  <nav className="space-y-1">
                    {session.draft.sections.map((section, index) => {
                      const sectionId = section.id || `section-${index}`;
                      const content = sectionEdits[sectionId] !== undefined ? sectionEdits[sectionId] : section.content;
                      const sectionTitle = sectionTitles[sectionId] || section.title || `Section ${index + 1}`;
                      const isActive = activeSection === sectionId;
                      const isEdited = content !== section.content;

                      return (
                        <button
                          key={sectionId}
                          onClick={() => scrollToSection(sectionId)}
                          className={cn(
                            "font-medium",
                            isActive
                              ? surfaceClasses.sidebarNavButtonActive
                              : surfaceClasses.sidebarNavButton
                          )}
                        >
                          <span className="truncate flex-1">
                            {index + 1}. {sectionTitle}
                          </span>
                          {isEdited && !isComplete && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>
            </div>
          }
          mainClassName="workspace-main-surface flex justify-center p-8 md:p-14 lg:p-24"
        >
          <div className="w-full max-w-4xl">
            {!isOnline && isHydrated && (
              <div className="mb-8 flex items-start gap-3 rounded-xl border border-border/60 bg-primary/10 p-4 text-sm text-foreground">
                <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
                <div>You are offline. Canvas edits will resync when you reconnect.</div>
              </div>
            )}

            {wasOffline && (
              <div className="mb-8 flex items-start gap-3 rounded-xl border border-border/60 bg-primary/10 p-4 text-sm text-foreground">
                <RefreshCcw className="mt-0.5 h-5 w-5 shrink-0" />
                <div>Connection restored. Re-syncing the contract canvas.</div>
              </div>
            )}

            <div className="space-y-12">
              <DocumentPanel
                title={draftTitle || session.draft.title}
                titleIcon={<Scale className="h-4 w-4 text-primary" />}
                badge={<Badge variant="secondary" className="rounded-full">{isComplete ? "Finalized" : "Drafting"}</Badge>}
                actions={
                  isComplete ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={getContractDownloadUrl(session.session_id, "docx")} download>
                          <Download className="mr-2 h-4 w-4" /> Word
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={getContractDownloadUrl(session.session_id, "pdf")} download>
                          <Download className="mr-2 h-4 w-4" /> PDF
                        </a>
                      </Button>
                    </div>
                  ) : undefined
                }
                toolbar={
                  !isComplete ? (
                    <RichTextToolbar editor={contractEditor} disabled={!contractEditor && !activeSection} />
                  ) : undefined
                }
              >
                <EditableDocumentCanvas
                  html={contractDocumentHtml}
                  readOnly={isComplete}
                  onEditorReady={setContractEditor}
                  onSectionFocus={setActiveSection}
                  onChange={(html) => {
                    const parsed = parseContractDocumentHtml(html, session);
                    setDraftTitle(parsed.title);
                    setSectionTitles(parsed.sectionTitles);
                    setSectionEdits(parsed.sectionPlain);
                    setSectionEditsRich(parsed.sectionRich);
                  }}
                />
              </DocumentPanel>

              {isComplete && (
                <div className="flex justify-center pb-24">
                  <Button variant="outline" onClick={() => {
                    setSession(null);
                    setDescription("");
                    setSelectedSource("fresh");
                    setSelectedTemplateData(null);
                    setSelectedContractData(null);
                    router.replace("/contracts");
                  }}>
                    Draft Another Contract
                  </Button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Save as Template Dialog (Only rendered here if it's open) */}
          <SaveAsTemplateDialog
            open={showSaveAsTemplate}
            onClose={() => setShowSaveAsTemplate(false)}
            sessionId={session.session_id}
            contractType={session.contract_type || "general"}
            onSuccess={() => {}}
          />
        </DocumentWorkspaceShell>
      </TooltipProvider>
    );
  }

  // Fallback complete state if there's no draft (e.g. error loading it)
  if ((session?.phase === "complete" || session?.phase === "approval") && !session?.draft) {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading finalized contract...</p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Error state
  if (session?.phase === "failed" || error) {
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
              <h3 className="mt-4 font-semibold text-lg">Contract Generation Failed</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {session?.error || error || "An unexpected error occurred."}
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSession(null);
                  setError(null);
                  router.replace("/contracts");
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

  return null;
}

export default function ContractsPage() {
  // Require authentication - redirects to login if not authenticated
  const { canShowContent } = useRequireAuth();

  // Show loading while checking auth or redirecting
  if (!canShowContent) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Page-level H1 — sr-only because the visible hierarchy already
          uses h1s for phase-specific surfaces (Contract Brief,
          Requirements, Draft title). The dashboard topbar renders its
          breadcrumb as <p>, so this is the only landmark h1. */}
      <h1 className="sr-only">Contract Drafting</h1>
      <Suspense
        fallback={
          <div className="container mx-auto max-w-3xl px-4 py-8">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <FeatureGate
          feature="contract_drafting"
          requiredTier="professional"
          featureName="Contract Drafting"
        >
          <ContractsContent />
        </FeatureGate>
      </Suspense>
    </>
  );
}
