"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  Building2,
  User,
  Sparkles,
  PenLine,
  X,
  Check,
  List,
  Shield,
  Scale,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  createContractSession,
  getContractSession,
  submitContractRequirements,
  submitContractReview,
  getContractDownloadUrl,
  type ContractSession,
  type ContractRequirements,
  type ContractQuestion,
  type PartyInfo,
  type EnhancedTemplate,
  type ContractListItem,
} from "@/lib/api";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import {
  SourceSelection,
  TemplateBrowser,
  ContractBrowser,
  SaveAsTemplateDialog,
  type SourceType,
} from "@/components/contracts";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { useAuth, useRequireAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { formatDateOnly } from "@/lib/utils/date-formatter";

const phaseLabels: Record<string, { label: string; description: string }> = {
  requirements: {
    label: "Requirements",
    description: "Provide contract details",
  },
  drafting: {
    label: "Drafting",
    description: "Generating contract draft",
  },
  review: {
    label: "Review",
    description: "Review and edit the draft",
  },
  complete: {
    label: "Complete",
    description: "Contract ready for download",
  },
  failed: {
    label: "Failed",
    description: "An error occurred",
  },
};

const defaultParty: PartyInfo = {
  role: "",
  name: "",
  address: "",
  registration_number: "",
};

function ContractsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { refresh: refreshEntitlements } = useEntitlements();
  const initialDescription = searchParams.get("q");
  const sessionIdParam = searchParams.get("session");

  const [session, setSession] = useState<ContractSession | null>(null);
  const [description, setDescription] = useState(initialDescription || "");

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
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const showSidebar = true; // Always show sidebar in review phase
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const sessionData = await getContractSession(sessionId, accessToken);
      setSession(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

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
        const updatedSession = await getContractSession(session.session_id, accessToken);
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
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [session?.session_id, session?.phase, session, accessToken, refreshEntitlements]);

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

      const newSession = await createContractSession(request, accessToken);
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
        requirements,
        accessToken
      );
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit requirements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveContract = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const edits = Object.entries(sectionEdits)
        .filter(([, content]) => content.trim())
        .map(([sectionId, content]) => ({
          section_id: sectionId,
          new_content: content,
        }));

      const updatedSession = await submitContractReview(
        session.session_id,
        {
          approved: true,
          edits: edits.length > 0 ? edits : undefined,
        },
        accessToken
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

  const renderPhaseIndicator = () => {
    if (!session) return null;

    const phases = ["requirements", "drafting", "review", "complete"];
    // Map "approval" phase to "complete" for display purposes
    const displayPhase = session.phase === "approval" ? "complete" : session.phase;
    const currentIndex = phases.indexOf(displayPhase);

    return (
      <div className="flex items-center gap-2 mb-6">
        {phases.map((phase, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const info = phaseLabels[phase];

          return (
            <div key={phase} className="flex items-center">
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
              {index < phases.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Initial description input
  if (!session && !sessionIdParam) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
            <FileText className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Drafting</h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Generate professional contracts based on Ugandan law. Our AI will create
            a customized draft based on your requirements.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Describe Your Contract</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Employment contract for a software developer with a 3-month probation period..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <SourceSelection
                onSelect={handleSourceSelect}
                onOpenTemplateBrowser={() => setShowTemplateBrowser(true)}
                onOpenContractBrowser={() => setShowContractBrowser(true)}
                selectedSource={selectedSource}
                selectedTemplateId={selectedTemplateData?.id}
                selectedContractId={selectedContractData?.session_id}
                templateName={selectedTemplateData?.name}
                contractName={selectedContractData?.title || undefined}
              />

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleStartContract}
                disabled={!description.trim() || isLoading}
                className="w-full"
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
            </div>
          </CardContent>
        </Card>

        {/* Browser Modals */}
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

  // Requirements phase
  if (session?.phase === "requirements") {
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
                <FileText className="h-5 w-5 text-green-500" />
                Contract Requirements
              </CardTitle>
              <CardDescription>
                Provide the details needed to draft your contract.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Contract Description
                </p>
                <p className="text-sm">{session.description}</p>
              </div>

              {/* Parties */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Parties</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addParty}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Party
                  </Button>
                </div>

                {parties.map((party, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {index === 0 ? (
                          <User className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Role</Label>
                            <Input
                              value={party.role}
                              onChange={(e) =>
                                updateParty(index, "role", e.target.value)
                              }
                              placeholder="E.g., Employer"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={party.name}
                              onChange={(e) =>
                                updateParty(index, "name", e.target.value)
                              }
                              placeholder="Full legal name"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Address (Optional)</Label>
                          <Input
                            value={party.address}
                            onChange={(e) =>
                              updateParty(index, "address", e.target.value)
                            }
                            placeholder="Business or residential address"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {parties.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParty(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Key Terms - shown when no dynamic questions */}
              {(!session.questions || session.questions.length === 0) && (
                <div className="space-y-3">
                  <Label className="text-base">Key Terms</Label>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Effective Date</Label>
                      <Input
                        type="date"
                        value={keyTerms.effective_date || ""}
                        onChange={(e) =>
                          setKeyTerms({ ...keyTerms, effective_date: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Duration/Term</Label>
                      <Input
                        value={keyTerms.duration || ""}
                        onChange={(e) =>
                          setKeyTerms({ ...keyTerms, duration: e.target.value })
                        }
                        placeholder="E.g., 2 years, indefinite, project completion"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Value/Consideration</Label>
                      <Input
                        value={keyTerms.value || ""}
                        onChange={(e) =>
                          setKeyTerms({ ...keyTerms, value: e.target.value })
                        }
                        placeholder="E.g., UGX 5,000,000 per month"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Questions from Backend */}
              {session.questions && session.questions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <Label className="text-base">Contract Details</Label>
                  </div>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Please answer the following questions to customize your contract.
                  </p>

                  {/* Group questions by their group field */}
                  {(() => {
                    const groups = session.questions.reduce((acc, q) => {
                      const group = q.group || "general";
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(q);
                      return acc;
                    }, {} as Record<string, ContractQuestion[]>);

                    return Object.entries(groups).map(([groupName, questions]) => (
                      <div key={groupName} className="space-y-3">
                        {Object.keys(groups).length > 1 && (
                          <Label className="text-sm font-medium text-muted-foreground capitalize">
                            {groupName.replace(/_/g, " ")}
                          </Label>
                        )}
                        <div className="grid gap-4">
                          {questions.map((question) => (
                            <div key={question.id}>
                              <Label className="text-sm">
                                {question.question}
                                {question.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </Label>
                              {renderQuestionInput(question)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Jurisdiction */}
              <div>
                <Label>Jurisdiction</Label>
                <Select value={jurisdiction} onValueChange={setJurisdiction}>
                  <SelectTrigger className="mt-2">
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

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmitRequirements}
                disabled={
                  isLoading ||
                  !parties.some((p) => p.name.trim())
                }
                className="w-full"
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
            </CardContent>
          </Card>
        </div>
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
                  </div>
                </div>

                <h3 className="mt-6 font-semibold text-lg">Drafting Your Contract</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  {getProgressStep(progress)}
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-md mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  This typically takes 1-2 minutes for comprehensive contract generation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Review phase - Document-centric design with sidebar navigation
  if (session?.phase === "review" && session.draft) {
    const scrollToSection = (sectionId: string) => {
      const element = sectionRefs.current[sectionId];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(sectionId);
      }
    };

    const handleSaveSection = () => {
      setEditingSection(null);
    };

    const handleCancelEdit = (sectionId: string) => {
      // Revert to original content
      const newEdits = { ...sectionEdits };
      delete newEdits[sectionId];
      setSectionEdits(newEdits);
      setEditingSection(null);
    };

    const getSectionContent = (sectionId: string, originalContent: string) => {
      return sectionEdits[sectionId] !== undefined ? sectionEdits[sectionId] : originalContent;
    };

    return (
      <TooltipProvider>
        <div className="min-h-screen bg-muted/30">
          {/* Sticky Header */}
          <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Link>
                  <div className="hidden sm:block h-6 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-green-600" />
                    <h1 className="font-semibold truncate max-w-[200px] sm:max-w-none">
                      {session.draft.title}
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="hidden sm:flex">
                    <FileText className="h-3 w-3 mr-1" />
                    {session.draft.sections.length} sections
                  </Badge>
                  <Button
                    onClick={handleApproveContract}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Approve & Finalize</span>
                        <span className="sm:hidden">Approve</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-6">
              {/* Sidebar - Table of Contents */}
              <aside className={cn(
                "hidden lg:block w-64 shrink-0",
                !showSidebar && "lg:hidden"
              )}>
                <div className="sticky top-24 space-y-4">
                  {/* Info Cards */}
                  {(session.draft.warnings?.length > 0 || session.draft.compliance_notes?.length > 0) && (
                    <Card className="overflow-hidden">
                      {session.draft.warnings && session.draft.warnings.length > 0 && (
                        <div className="p-3 border-b bg-amber-50 dark:bg-amber-950/30">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {session.draft.warnings.length} Review Note{session.draft.warnings.length !== 1 && "s"}
                            </span>
                          </div>
                        </div>
                      )}
                      {session.draft.compliance_notes && session.draft.compliance_notes.length > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {session.draft.compliance_notes.length} Compliance Note{session.draft.compliance_notes.length !== 1 && "s"}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Table of Contents */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Contents</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <nav className="max-h-[calc(100vh-320px)] overflow-y-auto">
                        <ul className="py-2">
                          {session.draft.sections.map((section, index) => {
                            const sectionId = section.id || `section-${index}`;
                            // Try to get a meaningful title: use section.title, or extract from content
                            const extractTitle = (content: string) => {
                              // Try to find a heading or first meaningful line
                              const lines = content.split('\n').filter(l => l.trim());
                              const firstLine = lines[0] || '';
                              // Remove markdown heading markers and clean up
                              return firstLine.replace(/^#+\s*/, '').replace(/^\*+\s*/, '').trim().slice(0, 50);
                            };
                            const sectionTitle = section.title && section.title !== `Section ${index + 1}`
                              ? section.title
                              : extractTitle(section.content) || `Section ${index + 1}`;
                            const isActive = activeSection === sectionId;
                            const isEdited = sectionEdits[sectionId] !== undefined;
                            const contentLength = section.content?.length || 0;
                            const isCurrentlyEditing = editingSection === sectionId;

                            return (
                              <li key={sectionId}>
                                <button
                                  onClick={() => scrollToSection(sectionId)}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-sm transition-colors group",
                                    "hover:bg-muted/80",
                                    isActive && "bg-muted border-l-2 border-primary",
                                    !isActive && "border-l-2 border-transparent",
                                    isCurrentlyEditing && "bg-primary/5 border-l-2 border-primary"
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className={cn(
                                      "flex items-center justify-center h-5 w-5 rounded text-xs font-medium shrink-0 mt-0.5",
                                      isActive || isCurrentlyEditing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                      {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className={cn(
                                          "font-medium truncate",
                                          isActive && "text-primary"
                                        )}>
                                          {sectionTitle}
                                        </span>
                                        {isCurrentlyEditing && (
                                          <PenLine className="h-3 w-3 text-primary shrink-0" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                        <span>{Math.ceil(contentLength / 100) * 100}+ chars</span>
                                        {isEdited && (
                                          <Badge variant="outline" className="h-4 px-1 text-[10px] text-amber-600 border-amber-300">
                                            modified
                                          </Badge>
                                        )}
                                        {!section.editable && (
                                          <Badge variant="outline" className="h-4 px-1 text-[10px]">
                                            locked
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </nav>
                    </CardContent>
                  </Card>
                </div>
              </aside>

              {/* Main Document Content */}
              <main className="flex-1 min-w-0">
                {/* Warnings Banner */}
                {session.draft.warnings && session.draft.warnings.length > 0 && (
                  <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Review Notes
                          </p>
                          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                            {session.draft.warnings.map((warning, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Document */}
                <Card className="shadow-lg">
                  {/* Document Header */}
                  <div className="border-b bg-muted/30 p-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {session.draft.title}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Generated {formatDateOnly(session.created_at)}
                    </p>
                  </div>

                  {/* Document Body - All sections visible */}
                  <div className="divide-y">
                    {session.draft.sections.map((section, index) => {
                      const sectionId = section.id || `section-${index}`;
                      const sectionTitle = section.title || `Section ${index + 1}`;
                      const isEditing = editingSection === sectionId;
                      const content = getSectionContent(sectionId, section.content);

                      return (
                        <div
                          key={sectionId}
                          ref={(el) => { sectionRefs.current[sectionId] = el; }}
                          className={cn(
                            "scroll-mt-24 transition-colors",
                            activeSection === sectionId && "bg-primary/5"
                          )}
                        >
                          {/* Section Header */}
                          <div className="sticky top-16 z-10 flex items-center justify-between px-6 py-3 bg-muted/50 border-b">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                {index + 1}
                              </span>
                              <h2 className="font-semibold text-base">
                                {sectionTitle}
                              </h2>
                            </div>
                            {section.editable !== false && (
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                    <PenLine className="h-3 w-3 mr-1" />
                                    Editing
                                  </Badge>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingSection(sectionId)}
                                        className="text-muted-foreground hover:text-foreground"
                                      >
                                        <PenLine className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Click to edit or double-click content</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Section Content */}
                          <div className="p-6">
                            {isEditing ? (
                              <div className="space-y-3">
                                {/* Edit Mode Panel */}
                                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 overflow-hidden">
                                  {/* Editor Header */}
                                  <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                      <PenLine className="h-4 w-4" />
                                      <span className="font-medium">Editing: {sectionTitle}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {content.length} characters
                                    </div>
                                  </div>

                                  {/* Textarea */}
                                  <Textarea
                                    value={content}
                                    onChange={(e) =>
                                      setSectionEdits({
                                        ...sectionEdits,
                                        [sectionId]: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      // Escape to cancel
                                      if (e.key === "Escape") {
                                        handleCancelEdit(sectionId);
                                      }
                                      // Cmd/Ctrl + Enter to save
                                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                        handleSaveSection();
                                      }
                                    }}
                                    className="min-h-[250px] font-serif text-base leading-relaxed resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                                    autoFocus
                                    placeholder="Enter section content..."
                                  />

                                  {/* Editor Footer with Actions */}
                                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t">
                                    <div className="text-xs text-muted-foreground">
                                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
                                      <span className="mx-1">to cancel</span>
                                      <span className="mx-2">|</span>
                                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Cmd</kbd>
                                      <span className="mx-0.5">+</span>
                                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                                      <span className="mx-1">to save</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCancelEdit(sectionId)}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveSection()}
                                        className="bg-primary"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="prose prose-slate dark:prose-invert max-w-none
                                  prose-headings:font-semibold prose-headings:tracking-tight
                                  prose-p:leading-relaxed prose-p:text-justify
                                  prose-li:marker:text-muted-foreground
                                  group cursor-pointer rounded-lg transition-colors hover:bg-muted/30"
                                onDoubleClick={() => {
                                  if (section.editable !== false) {
                                    setEditingSection(sectionId);
                                  }
                                }}
                                title={section.editable !== false ? "Double-click to edit" : undefined}
                              >
                                <MarkdownRenderer content={content} />
                                {section.editable !== false && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                    <PenLine className="h-3 w-3" />
                                    Double-click to edit
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Signature Block Placeholder */}
                  <div className="border-t p-6 bg-muted/20">
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          First Party
                        </p>
                        <div className="border-b border-dashed pt-8" />
                        <p className="text-sm text-muted-foreground">Signature</p>
                        <div className="border-b border-dashed pt-8" />
                        <p className="text-sm text-muted-foreground">Date</p>
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Second Party
                        </p>
                        <div className="border-b border-dashed pt-8" />
                        <p className="text-sm text-muted-foreground">Signature</p>
                        <div className="border-b border-dashed pt-8" />
                        <p className="text-sm text-muted-foreground">Date</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Compliance Notes */}
                {session.draft.compliance_notes && session.draft.compliance_notes.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        Compliance Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {session.draft.compliance_notes.map((note, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                            <span className="text-muted-foreground">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <div className="mt-6 flex items-center gap-2 text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* Mobile Actions */}
                <div className="lg:hidden mt-6">
                  <Button
                    onClick={handleApproveContract}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve & Finalize Contract
                      </>
                    )}
                  </Button>
                </div>
              </main>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Complete/Approval phase - show success screen
  if (session?.phase === "complete" || session?.phase === "approval") {
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">Contract Ready!</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Your contract has been finalized and is ready for download.
                </p>

                <div className="flex flex-wrap gap-3 mt-6 justify-center">
                  <Button asChild>
                    <a
                      href={getContractDownloadUrl(session.session_id, "pdf")}
                      download
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={getContractDownloadUrl(session.session_id, "docx")}
                      download
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Word
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveAsTemplate(true)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Template
                  </Button>
                </div>

                <Button
                  variant="link"
                  className="mt-4"
                  onClick={() => {
                    setSession(null);
                    setDescription("");
                    setSelectedSource("fresh");
                    setSelectedTemplateData(null);
                    setSelectedContractData(null);
                    router.replace("/contracts");
                  }}
                >
                  Draft Another Contract
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save as Template Dialog */}
          <SaveAsTemplateDialog
            open={showSaveAsTemplate}
            onClose={() => setShowSaveAsTemplate(false)}
            sessionId={session.session_id}
            contractType={session.contract_type || "general"}
            onSuccess={() => {
              // Could show a toast notification here
            }}
          />
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
  const { isLoading: authLoading } = useRequireAuth();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
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
  );
}
