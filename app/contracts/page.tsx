"use client";

import { useState, useEffect, Suspense } from "react";
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
  Edit3,
  Plus,
  Trash2,
  Building2,
  User,
  Sparkles,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  getContractTemplates,
  createContractSession,
  getContractSession,
  submitContractRequirements,
  submitContractReview,
  getContractDownloadUrl,
  type ContractTemplate,
  type ContractSession,
  type ContractRequirements,
  type PartyInfo,
} from "@/lib/api";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

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
  const initialDescription = searchParams.get("q");
  const sessionIdParam = searchParams.get("session");

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [session, setSession] = useState<ContractSession | null>(null);
  const [description, setDescription] = useState(initialDescription || "");
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [parties, setParties] = useState<PartyInfo[]>([
    { ...defaultParty, role: "First Party" },
    { ...defaultParty, role: "Second Party" },
  ]);
  const [keyTerms, setKeyTerms] = useState<Record<string, string>>({});
  const [jurisdiction, setJurisdiction] = useState("Uganda");
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load existing session if session ID provided
  useEffect(() => {
    if (sessionIdParam) {
      loadSession(sessionIdParam);
    }
  }, [sessionIdParam]);

  // Auto-start if description provided
  useEffect(() => {
    if (initialDescription && !sessionIdParam && !session && templates.length > 0) {
      handleStartContract();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDescription, templates]);

  // Poll for updates while in drafting phase
  useEffect(() => {
    if (!session || session.phase !== "drafting") return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedSession = await getContractSession(session.session_id);
        if (updatedSession.phase !== "drafting") {
          setSession(updatedSession);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [session?.session_id, session?.phase]);

  const loadTemplates = async () => {
    try {
      const templateList = await getContractTemplates();
      setTemplates(templateList);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const sessionData = await getContractSession(sessionId);
      setSession(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };

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
      const newSession = await createContractSession({
        contract_type: contractType,
        description: description.trim(),
        template_id: selectedTemplate,
      });
      setSession(newSession);
      router.replace(`/contracts?session=${newSession.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start contract");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequirements = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const requirements: ContractRequirements = {
        parties: parties.filter((p) => p.name.trim()),
        key_terms: keyTerms,
        jurisdiction,
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

      const updatedSession = await submitContractReview(session.session_id, {
        approved: true,
        edits: edits.length > 0 ? edits : undefined,
      });
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

  const renderPhaseIndicator = () => {
    if (!session) return null;

    const phases = ["requirements", "drafting", "review", "complete"];
    const currentIndex = phases.indexOf(session.phase);

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

              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template">Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a template or let AI choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              {/* Key Terms */}
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

  // Drafting phase
  if (session?.phase === "drafting") {
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
                  </div>
                </div>

                <h3 className="mt-6 font-semibold text-lg">Drafting Your Contract...</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Our AI is generating a customized contract based on your requirements
                  and Ugandan law.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Review phase
  if (session?.phase === "review" && session.draft) {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Link>
          </div>

          {renderPhaseIndicator()}

          <div className="space-y-6">
            {/* Draft Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                    <FileText className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{session.draft.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Review the draft below and make any necessary edits before finalizing.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Warnings */}
            {session.draft.warnings && session.draft.warnings.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Review Notes
                      </p>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        {session.draft.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {session.draft.sections.map((section, index) => {
                    const sectionId = section.id || `section-${index}`;
                    const sectionTitle = section.title || `Section ${index + 1}`;

                    return (
                      <AccordionItem key={sectionId} value={sectionId}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <span>{sectionTitle}</span>
                            {section.editable && (
                              <Badge variant="outline" className="ml-2">
                                <Edit3 className="h-3 w-3 mr-1" />
                                Editable
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {section.editable !== false ? (
                              <Textarea
                                value={
                                  sectionEdits[sectionId] !== undefined
                                    ? sectionEdits[sectionId]
                                    : section.content
                                }
                                onChange={(e) =>
                                  setSectionEdits({
                                    ...sectionEdits,
                                    [sectionId]: e.target.value,
                                  })
                                }
                                className="min-h-[150px] font-mono text-sm"
                              />
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownRenderer content={section.content} />
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Compliance Notes */}
            {session.draft.compliance_notes && session.draft.compliance_notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Compliance Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {session.draft.compliance_notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleApproveContract}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Finalize
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Complete phase
  if (session?.phase === "complete") {
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

                <div className="flex gap-3 mt-6">
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
                </div>

                <Button
                  variant="link"
                  className="mt-4"
                  onClick={() => {
                    setSession(null);
                    setDescription("");
                    router.replace("/contracts");
                  }}
                >
                  Draft Another Contract
                </Button>
              </div>
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
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ContractsContent />
    </Suspense>
  );
}
