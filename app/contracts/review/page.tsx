"use client";

/**
 * Contract Review — upload a contract, get an automated structured
 * review.
 *
 * Pipeline (server-side):
 *   parse (Docling) → legal research (LawLens corpus + Tavily/Ulii
 *   fallback) → ReviewAgent (risks / issues / missing clauses /
 *   improvements / statute-reference verification).
 *
 * UI:
 *   1. Empty state → drag-or-click upload + contract-type hint.
 *   2. Loading state → stage labels animate while the request runs.
 *      Backend is synchronous (~30-60s on a 20-page contract); we cycle
 *      labels so the user knows we haven't hung.
 *   3. Result state → score, summary, tabbed sections, evidence list.
 *      A second upload swaps the result without leaving the page.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  ListChecks,
  Loader2,
  ShieldAlert,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import {
  layoutClasses,
  surfaceClasses,
  typographyClasses,
} from "@/lib/design-system";
import { APIError, getUserFriendlyError } from "@/lib/api/client";
import { complianceApi } from "@/lib/api/compliance";
import {
  type ContractReviewExtractedObligation,
  type ContractReviewResult,
  type ContractReviewSeverity,
  uploadContractForReview,
} from "@/lib/api/contracts";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const CONTRACT_TYPES: Array<{ value: string; label: string }> = [
  { value: "general", label: "Auto-detect" },
  { value: "loan", label: "Loan / facility agreement" },
  { value: "lease", label: "Lease / tenancy" },
  { value: "employment", label: "Employment" },
  { value: "service", label: "Services agreement" },
  { value: "nda", label: "Non-disclosure / confidentiality" },
  { value: "sale", label: "Sale / purchase" },
];

// Cycle through these client-side so the user sees progress through
// the (synchronous) backend pipeline. Real reviews take 60-100s
// (Mistral OCR + corpus research + LLM review + statute verification).
// Tick interval timed so the cycle ends near the typical lower bound;
// after the last stage we sit on it with a "still working" hint
// (handled by the renderer) until the actual response arrives.
const PROCESSING_STAGES = [
  "Reading the document…",
  "Extracting text and structure (OCR if needed)…",
  "Researching applicable Ugandan law (LawLens + Ulii)…",
  "Identifying risks, missing clauses, and exposure…",
  "Verifying statute references against retrieved evidence…",
  "Extracting recurring obligations…",
  "Compiling the final review…",
];

// 10s per stage × 7 stages ≈ 70s — matches the typical full-pipeline
// wall clock (corpus + Tavily + ReviewAgent). The renderer holds on
// the last stage past that with a "still working" hint.
const PROCESSING_STAGE_INTERVAL_MS = 10_000;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches backend cap

// ----------------------------------------------------------------------------
// Severity styling
// ----------------------------------------------------------------------------

function severityClasses(severity: ContractReviewSeverity) {
  switch (severity) {
    case "critical":
      return "border-rose-500/40 bg-rose-500/10 text-rose-300";
    case "high":
      return "border-orange-500/40 bg-orange-500/10 text-orange-300";
    case "medium":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "low":
    default:
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "approved":
      return "text-emerald-300";
    case "needs_revision":
      return "text-amber-300";
    case "major_issues":
      return "text-orange-300";
    case "rejected":
      return "text-rose-300";
    default:
      return "text-foreground/85";
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-amber-300";
  if (score >= 50) return "text-orange-300";
  return "text-rose-300";
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

/**
 * localStorage key for the most recent review result. We persist the
 * last successful review so a page refresh mid-demo doesn't blow it
 * away — the user can re-share the URL, navigate away and back, etc.
 * Stored under a versioned key so we can invalidate cleanly if the
 * response shape ever changes.
 */
const LAST_REVIEW_KEY = "lawlens.contract_review.last_v1";

function loadPersistedReview(): ContractReviewResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_REVIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContractReviewResult;
    // Sanity check: must look like a review result.
    if (!parsed || typeof parsed.overall_score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistReview(r: ContractReviewResult | null): void {
  if (typeof window === "undefined") return;
  try {
    if (r) {
      window.localStorage.setItem(LAST_REVIEW_KEY, JSON.stringify(r));
    } else {
      window.localStorage.removeItem(LAST_REVIEW_KEY);
    }
  } catch {
    // Quota exceeded / private mode — silently drop. Re-hydration just
    // returns null on next mount.
  }
}

export default function ContractReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string>("general");
  const [isReviewing, setIsReviewing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  // Re-hydrate the last review on mount so a refresh doesn't lose it.
  // useEffect (not initial state) because localStorage isn't available
  // during SSR — initial render must match the server-rendered HTML.
  const [result, setResult] = useState<ContractReviewResult | null>(null);
  useEffect(() => {
    const persisted = loadPersistedReview();
    if (persisted) setResult(persisted);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle stage labels during processing. Tick interval is chosen so
  // the cycle finishes near the typical pipeline runtime — after the
  // last stage we hold there with a hint so the user doesn't think we
  // hung.
  useEffect(() => {
    if (!isReviewing) {
      setStageIndex(0);
      return;
    }
    const id = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, PROCESSING_STAGES.length - 1));
    }, PROCESSING_STAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isReviewing]);

  const onPickFile = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError(
        `File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). ` +
          `Limit is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
      );
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files?.[0] ?? null;
      onPickFile(dropped);
    },
    [onPickFile],
  );

  const submit = useCallback(async () => {
    if (!file) return;
    setError(null);
    setIsReviewing(true);
    setResult(null);
    try {
      const review = await uploadContractForReview(file, {
        contractType: contractType === "general" ? undefined : contractType,
      });
      setResult(review);
      persistReview(review);
    } catch (err) {
      if (err instanceof APIError && err.status === 403) {
        setError(
          "Contract review requires an Enterprise plan. Talk to your " +
            "admin or contact support to unlock.",
        );
      } else {
        setError(getUserFriendlyError(err, "Review failed. Please try again."));
      }
    } finally {
      setIsReviewing(false);
    }
  }, [file, contractType]);

  const resetForNew = useCallback(() => {
    setFile(null);
    setContractType("general");
    setResult(null);
    setError(null);
    // Clear the persisted last review too — the user explicitly asked
    // for a fresh upload, so re-hydrating the old result on refresh
    // would be confusing.
    persistReview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <main className={cn(layoutClasses.pageContainer, "py-10")}>
      <Header />

      {!result && (
        <UploadCard
          file={file}
          contractType={contractType}
          isDragOver={isDragOver}
          isReviewing={isReviewing}
          stageIndex={stageIndex}
          error={error}
          inputRef={inputRef}
          onPickFile={onPickFile}
          onContractType={setContractType}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onSubmit={submit}
        />
      )}

      {result && (
        <ResultView result={result} onReset={resetForNew} />
      )}
    </main>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function Header() {
  return (
    <header className="mb-8">
      <div className={typographyClasses.labelMd}>Contracts</div>
      <h1 className={cn(typographyClasses.headingXl, "mt-1")}>
        Contract Review
      </h1>
      <p className={cn(typographyClasses.bodyMd, "mt-2 text-muted-foreground")}>
        Upload a contract. The reviewer parses the document, researches
        applicable Ugandan law, and returns a structured assessment with
        risks, missing clauses, and statute-grounded recommendations.
      </p>
      <div className="mt-4 flex gap-2 text-xs">
        <Badge variant="outline" className="border-border text-foreground/85">
          <FileText className="mr-1 h-3 w-3" />
          PDF · DOCX · TXT
        </Badge>
        <Badge variant="outline" className="border-border text-foreground/85">
          <BookOpen className="mr-1 h-3 w-3" />
          LawLens corpus + Ulii
        </Badge>
        <Badge variant="outline" className="border-border text-foreground/85">
          <ShieldAlert className="mr-1 h-3 w-3" />
          Statute references verified
        </Badge>
      </div>
    </header>
  );
}

interface UploadCardProps {
  file: File | null;
  contractType: string;
  isDragOver: boolean;
  isReviewing: boolean;
  stageIndex: number;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPickFile: (f: File | null) => void;
  onContractType: (v: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSubmit: () => void;
}

function UploadCard(props: UploadCardProps) {
  const {
    file,
    contractType,
    isDragOver,
    isReviewing,
    stageIndex,
    error,
    inputRef,
    onPickFile,
    onContractType,
    onDragOver,
    onDragLeave,
    onDrop,
    onSubmit,
  } = props;

  return (
    <Card className={surfaceClasses.pagePanel}>
      <CardContent className="space-y-5 p-6">
        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isReviewing && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors",
            isReviewing
              ? "cursor-default border-border bg-muted/40"
              : "cursor-pointer hover:border-foreground/40",
            isDragOver
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-border",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            disabled={isReviewing}
          />
          {!isReviewing && (
            <>
              <Upload className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
              <div className={typographyClasses.bodyMd}>
                {file ? (
                  <>
                    <span className="text-foreground">{file.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </>
                ) : (
                  <>
                    Drop a contract here, or{" "}
                    <span className="text-emerald-400 underline">
                      click to choose a file
                    </span>
                  </>
                )}
              </div>
              <div className={cn(typographyClasses.bodySm, "mt-1 text-muted-foreground")}>
                PDF, DOCX, or TXT, up to 10 MB
              </div>
            </>
          )}

          {isReviewing && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <div className={typographyClasses.bodyMd}>
                {PROCESSING_STAGES[stageIndex]}
              </div>
              <div className={cn(typographyClasses.bodySm, "text-muted-foreground")}>
                {stageIndex < PROCESSING_STAGES.length - 1
                  ? "This usually takes about 60-90 seconds."
                  : "Still working — final synthesis can take an extra moment."}
              </div>
            </div>
          )}
        </div>

        {/* Contract type selector */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="contract-type" className={typographyClasses.labelSm}>
            Contract type
          </Label>
          <Select
            value={contractType}
            onValueChange={onContractType}
            disabled={isReviewing}
          >
            <SelectTrigger id="contract-type" className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn(typographyClasses.bodySm, "text-muted-foreground")}>
            Auto-detect scans the document body; pick a specific type for
            tighter compliance checks (e.g., Employment Act for employment
            contracts).
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={!file || isReviewing}
            size="lg"
            className={surfaceClasses.brandButton}
          >
            {isReviewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reviewing
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Review contract
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultView({
  result,
  onReset,
}: {
  result: ContractReviewResult;
  onReset: () => void;
}) {
  const issueCount = result.legal_issues.length;
  const riskCount = result.risks.length;
  const improvementCount = result.improvements.length;
  const missingCount =
    result.missing_sections.length + result.missing_clauses.length;
  const obligationCount = result.extracted_obligations?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className={surfaceClasses.pagePanel}>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={typographyClasses.labelSm}>
                {result.filename}
              </div>
              <div className={cn(typographyClasses.headingLg, "mt-1")}>
                {humanContractType(result.contract_type)}
              </div>
              <div
                className={cn(
                  typographyClasses.labelMd,
                  "mt-1",
                  statusColor(result.status),
                )}
              >
                {statusLabel(result.status)}
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              <ScoreTile
                label="Overall"
                value={result.overall_score}
                hint={interpretOverall(result.overall_score)}
              />
              <ScoreTile
                label="Completeness"
                value={result.completeness_score}
                hint={interpretCompleteness(result)}
              />
              <ScoreTile
                label="Compliance"
                value={result.compliance_score}
                hint={interpretCompliance(result)}
              />
              <ScoreTile
                label="Consistency"
                value={result.consistency_score}
                hint={interpretConsistency(result.consistency_score)}
              />
            </div>
          </div>

          {result.summary && (
            <p
              className={cn(
                typographyClasses.bodyMd,
                "mt-4 text-foreground/85",
              )}
            >
              {result.summary}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              Processed in {(result.processing_time_ms / 1000).toFixed(1)}s
            </span>
            <span>·</span>
            <span>{result.text_length.toLocaleString()} characters parsed</span>
            <span>·</span>
            <span>{describeStatuteCheck(result)}</span>
          </div>

          <div className="mt-5 flex justify-end">
            <Button variant="outline" size="sm" onClick={onReset}>
              <Upload className="mr-2 h-3.5 w-3.5" />
              Review another
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Findings tabs */}
      <Tabs defaultValue="risks" className="w-full">
        <TabsList>
          <TabsTrigger value="risks">
            Risks <Badge variant="secondary" className="ml-2">{riskCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="legal">
            Legal issues{" "}
            <Badge variant="secondary" className="ml-2">{issueCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="missing">
            Missing{" "}
            <Badge variant="secondary" className="ml-2">{missingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="improvements">
            Improvements{" "}
            <Badge variant="secondary" className="ml-2">{improvementCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="obligations">
            Obligations{" "}
            <Badge variant="secondary" className="ml-2">{obligationCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence{" "}
            <Badge variant="secondary" className="ml-2">
              {result.evidence.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="mt-4">
          {result.risks.length === 0 ? (
            <EmptyState>No risks flagged.</EmptyState>
          ) : (
            <div className="space-y-3">
              {result.risks.map((r, i) => (
                <FindingCard
                  key={`risk-${i}`}
                  severity={r.severity}
                  title={r.description}
                  detail={r.mitigation}
                  detailLabel="Mitigation"
                  meta={r.affected_party ? `Affects: ${r.affected_party}` : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="legal" className="mt-4">
          {result.legal_issues.length === 0 ? (
            <EmptyState>No legal compliance issues found.</EmptyState>
          ) : (
            <div className="space-y-3">
              {result.legal_issues.map((i, idx) => (
                <FindingCard
                  key={`legal-${idx}`}
                  severity={i.severity}
                  title={i.issue}
                  detail={i.recommendation}
                  detailLabel="Recommendation"
                  meta={
                    [i.section, i.law_reference]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="missing" className="mt-4">
          {missingCount === 0 ? (
            <EmptyState>
              All expected sections and clauses are present.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {result.missing_sections.length > 0 && (
                <MissingBlock
                  title="Missing sections"
                  items={result.missing_sections}
                  icon={<XCircle className="h-4 w-4 text-rose-400" />}
                />
              )}
              {result.missing_clauses.length > 0 && (
                <MissingBlock
                  title="Missing clauses"
                  items={result.missing_clauses}
                  icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="improvements" className="mt-4">
          {result.improvements.length === 0 ? (
            <EmptyState>No improvements suggested.</EmptyState>
          ) : (
            <div className="space-y-3">
              {result.improvements.map((imp, i) => (
                <FindingCard
                  key={`imp-${i}`}
                  severity={imp.priority}
                  title={imp.suggestion}
                  detail=""
                  detailLabel=""
                  meta={imp.section ? `Section: ${imp.section}` : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="obligations" className="mt-4">
          <ObligationsTab
            obligations={result.extracted_obligations ?? []}
            contractType={result.contract_type}
          />
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          {result.evidence.length === 0 ? (
            <EmptyState>
              No evidence captured. Try re-running with{" "}
              <code className="rounded bg-muted px-1 text-xs">
                skip_legal_research=false
              </code>
              .
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {result.evidence.map((e) => (
                <EvidenceCard key={e.id} evidence={e} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Unverified statute references warning (separate, eye-catching) */}
      {result.references_unverified.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <div className={cn(typographyClasses.headingSm, "text-amber-200")}>
                  {result.references_unverified.length} statute reference
                  {result.references_unverified.length === 1 ? "" : "s"}{" "}
                  could not be verified
                </div>
                <p
                  className={cn(
                    typographyClasses.bodySm,
                    "mt-1 text-amber-100/80",
                  )}
                >
                  These citations don&apos;t appear in the retrieved evidence
                  and may be hallucinated. Verify them against the source
                  before relying on the recommendation.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-amber-100/90">
                  {result.references_unverified.map((r, i) => (
                    <li key={`unv-${i}`} className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>
                        <span className="font-medium">{r.raw}</span>{" "}
                        <span className="text-amber-200/70">
                          ({r.statute}
                          {r.section ? `, section ${r.section}` : ""})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="pt-4 text-center text-xs text-muted-foreground">
        <Link href="/contracts" className="hover:text-foreground/85">
          ← Back to Contracts
        </Link>
      </div>
    </div>
  );
}

function ScoreTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="min-w-[7rem] text-right">
      <div className={cn("text-2xl font-semibold", scoreTone(value))}>
        {value}
        <span className="ml-0.5 text-xs text-muted-foreground">/100</span>
      </div>
      <div className={cn(typographyClasses.labelXs, "text-muted-foreground")}>
        {label}
      </div>
      {hint && (
        <div className="mt-1 max-w-[12rem] text-[11px] leading-tight text-muted-foreground/80">
          {hint}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Score interpretation — one short sentence under each tile so UDB legal
// can read the result panel at a glance instead of decoding a number.
// ----------------------------------------------------------------------------

function interpretOverall(score: number): string {
  if (score >= 85) return "Ready to execute; minor edits at most.";
  if (score >= 70) return "Workable with targeted revisions.";
  if (score >= 50) return "Needs significant revision before signing.";
  return "Major issues — substantial rework required.";
}

function interpretCompleteness(result: ContractReviewResult): string {
  const missing =
    result.missing_sections.length + result.missing_clauses.length;
  if (missing === 0) return "All expected sections and clauses present.";
  if (missing <= 3) return `${missing} expected section${missing === 1 ? "" : "s"}/clause${missing === 1 ? "" : "s"} missing.`;
  return `${missing} expected items missing — see Missing tab.`;
}

function interpretCompliance(result: ContractReviewResult): string {
  const issues = result.legal_issues.length;
  const high = result.legal_issues.filter(
    (i) => i.severity === "critical" || i.severity === "high",
  ).length;
  if (issues === 0) return "No Ugandan-law compliance issues flagged.";
  if (high === 0) return `${issues} minor legal concern${issues === 1 ? "" : "s"} flagged.`;
  return `${high} high-severity legal issue${high === 1 ? "" : "s"} — review carefully.`;
}

function interpretConsistency(score: number): string {
  if (score >= 85) return "Internal references and definitions check out.";
  if (score >= 70) return "Minor consistency gaps; verify cross-references.";
  return "Significant internal inconsistencies detected.";
}

function describeStatuteCheck(result: ContractReviewResult): string {
  const verified = result.references_verified;
  const unverified = result.references_unverified.length;
  const total = verified + unverified;
  if (total === 0) {
    return "Document doesn't cite any statutes";
  }
  if (unverified === 0) {
    return `${verified} statute reference${verified === 1 ? "" : "s"} verified`;
  }
  if (verified === 0) {
    return `${unverified} statute reference${unverified === 1 ? "" : "s"} flagged for review`;
  }
  return `${verified} of ${total} statute references verified, ${unverified} flagged`;
}

function FindingCard({
  severity,
  title,
  detail,
  detailLabel,
  meta,
}: {
  severity: ContractReviewSeverity;
  title: string;
  detail: string;
  detailLabel: string;
  meta?: string;
}) {
  return (
    <Card
      className={cn(
        "border-l-2 border-l-zinc-700",
        surfaceClasses.pagePanel,
      )}
    >
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(typographyClasses.bodyMd, "text-foreground")}>
            {title}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 capitalize",
              severityClasses(severity),
            )}
          >
            {severity}
          </Badge>
        </div>
        {detail && (
          <div className={cn(typographyClasses.bodySm, "text-muted-foreground")}>
            <span className="font-medium text-foreground/85">{detailLabel}: </span>
            {detail}
          </div>
        )}
        {meta && (
          <div
            className={cn(typographyClasses.labelXs, "text-muted-foreground")}
          >
            {meta}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MissingBlock({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <Card className={surfaceClasses.pagePanel}>
      <CardContent className="p-4">
        <div className={cn(typographyClasses.headingSm, "mb-2 text-foreground")}>
          {title}
        </div>
        <ul className="space-y-1.5 text-sm text-foreground/85">
          {items.map((item, i) => (
            <li key={`${title}-${i}`} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">{icon}</span>
              <span className="capitalize">
                {item.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ObligationsTab({
  obligations,
  contractType,
}: {
  obligations: ContractReviewExtractedObligation[];
  contractType: string;
}) {
  const [tracking, setTracking] = useState(false);
  const [trackedIds, setTrackedIds] = useState<string[] | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const onTrack = useCallback(async () => {
    if (obligations.length === 0) return;
    setTracking(true);
    setTrackError(null);
    try {
      // contract_session_id is a synthetic UUID — the contract-review
      // flow is stateless (no ContractSession row), and the backend
      // only uses this for bookkeeping inside event_metadata.
      const sessionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const resp = await complianceApi.createContractObligations({
        contract_session_id: sessionId,
        obligations_data: obligations as unknown as Array<
          Record<string, unknown>
        >,
      });
      setTrackedIds(resp.obligation_ids);
    } catch (err) {
      if (err instanceof APIError && err.status === 403) {
        setTrackError(
          "Compliance tracking requires an Enterprise plan.",
        );
      } else {
        setTrackError(
          getUserFriendlyError(
            err,
            "Couldn't add to tracker. Please try again.",
          ),
        );
      }
    } finally {
      setTracking(false);
    }
  }, [obligations]);

  if (obligations.length === 0) {
    return (
      <EmptyState>
        No recurring obligations detected in this {contractType} contract.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {/* Track-all banner */}
      <Card
        className={cn(
          "border-emerald-500/30 bg-emerald-500/5",
          trackedIds && "border-emerald-500/50 bg-emerald-500/10",
        )}
      >
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <div
                className={cn(
                  typographyClasses.bodyMd,
                  "text-foreground",
                )}
              >
                {trackedIds
                  ? `${trackedIds.length} obligation${trackedIds.length === 1 ? "" : "s"} added to your compliance tracker.`
                  : `${obligations.length} recurring obligation${obligations.length === 1 ? "" : "s"} found in this contract.`}
              </div>
              <p
                className={cn(
                  typographyClasses.bodySm,
                  "mt-1 text-muted-foreground",
                )}
              >
                {trackedIds
                  ? "Deadlines, alerts, and recurrence are now active in Regulatory Compliance."
                  : "Click to add them to Regulatory Compliance — deadlines, alerts, and recurrence handled automatically."}
              </p>
            </div>
          </div>
          {trackedIds ? (
            <Link href="/compliance#obligations">
              <Button variant="outline" size="sm">
                <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                View in compliance
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onTrack}
              disabled={tracking}
              size="sm"
              className={surfaceClasses.brandButton}
            >
              {tracking ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <ListChecks className="mr-2 h-3.5 w-3.5" />
                  Add all to tracker
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {trackError && (
        <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{trackError}</div>
        </div>
      )}

      {/* Per-obligation cards */}
      <div className="space-y-3">
        {obligations.map((ob, i) => (
          <ObligationCard
            key={`ob-${i}`}
            obligation={ob}
            tracked={trackedIds !== null}
          />
        ))}
      </div>
    </div>
  );
}

function ObligationCard({
  obligation,
  tracked,
}: {
  obligation: ContractReviewExtractedObligation;
  tracked: boolean;
}) {
  const dueLabel = obligation.next_due_date
    ? new Date(obligation.next_due_date).toLocaleDateString("en-UG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Date not detected";
  return (
    <Card className={surfaceClasses.pagePanel}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(typographyClasses.bodyMd, "text-foreground")}>
            {obligation.title.replace(/^\[Contract\]\s*/, "")}
          </div>
          <div className="flex shrink-0 gap-2">
            <Badge variant="outline" className="border-border capitalize">
              {obligation.obligation_type.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="border-border capitalize">
              {obligation.recurrence_pattern.replace(/_/g, " ")}
            </Badge>
            {tracked && (
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Tracking
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            Next due: {dueLabel}
          </span>
          <span>·</span>
          <span>Warn {obligation.advance_warning_days}d ahead</span>
          <span>·</span>
          <span className="capitalize">
            Owner: {obligation.assigned_owner_role.replace(/_/g, " ")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceCard({
  evidence,
}: {
  evidence: ContractReviewResult["evidence"][number];
}) {
  return (
    <Card className={surfaceClasses.pagePanel}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={cn(typographyClasses.bodyMd, "text-foreground")}>
              {evidence.title || evidence.legal_reference || "Evidence"}
            </div>
            {evidence.legal_reference && evidence.title !== evidence.legal_reference && (
              <div className={cn(typographyClasses.labelXs, "mt-0.5 text-muted-foreground")}>
                {evidence.legal_reference}
              </div>
            )}
          </div>
          {evidence.source_url && (
            <a
              href={evidence.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-emerald-400 hover:text-emerald-300"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        {evidence.snippet && (
          <div className={cn(typographyClasses.bodySm, "text-muted-foreground")}>
            {evidence.snippet}
            {evidence.snippet.length === 400 && "…"}
          </div>
        )}
        <Badge variant="outline" className="border-border text-muted-foreground">
          {evidence.source_type || "unknown source"}
        </Badge>
      </CardContent>
    </Card>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Card className={surfaceClasses.pagePanel}>
      <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <span>{children}</span>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function humanContractType(t: string): string {
  const map: Record<string, string> = {
    loan: "Loan / facility agreement",
    lease: "Lease / tenancy",
    employment: "Employment agreement",
    service: "Services agreement",
    nda: "Non-disclosure agreement",
    sale: "Sale / purchase agreement",
    general: "Contract",
  };
  return map[t] ?? t.replace(/_/g, " ");
}
