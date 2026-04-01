"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers";
import {
  uploadDocument,
  getDocumentStatus,
  formatFileSize,
  type DocumentStatus,
} from "@/lib/api/knowledge-base";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────── */

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const DOCUMENT_CATEGORIES = [
  { value: "contract", label: "Contract" },
  { value: "policy", label: "Policy" },
  { value: "sop", label: "SOP" },
  { value: "employee_agreement", label: "Employee Agreement" },
  { value: "governance", label: "Governance" },
  { value: "compliance_record", label: "Compliance Record" },
  { value: "license", label: "License" },
  { value: "financial", label: "Financial" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
] as const;

const PROCESSING_STEPS: { status: DocumentStatus; label: string; icon: React.ElementType }[] = [
  { status: "uploaded", label: "Uploaded", icon: Upload },
  { status: "processing", label: "Processing", icon: Cpu },
  { status: "ready", label: "Ready", icon: CheckCircle },
];

/* ─────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────── */

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<DocumentStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll processing status after upload
  useEffect(() => {
    if (!uploadedDocId) return;

    const poll = async () => {
      try {
        const status = await getDocumentStatus(uploadedDocId);
        setProcessingStatus(status.status);
        if (status.status === "ready" || status.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (status.status === "ready") {
            toast.success("Document processed successfully");
          } else {
            toast.error("Document processing failed", {
              description: status.error_message,
            });
          }
          onUploadComplete?.();
        }
      } catch {
        // ignore poll errors
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [uploadedDocId, onUploadComplete]);

  const validateFile = (f: File): string | null => {
    const allowedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!allowedTypes.includes(f.type)) {
      return "Invalid file type. Please upload PDF, DOCX, or TXT files.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return "File size exceeds 50MB limit.";
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const error = validateFile(droppedFile);
        if (error) {
          toast.error(error);
          return;
        }
        setFile(droppedFile);
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
        }
      }
    },
    [title],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        toast.error(error);
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setTags("");
    setCategory("");
    setExpiryDate("");
    setReviewDate("");
    setUploadedDocId(null);
    setProcessingStatus(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleUpload = async () => {
    if (!file || !isAuthenticated || !title.trim()) {
      toast.error("Please select a file and provide a title");
      return;
    }

    setUploading(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const result = await uploadDocument(
        file,
        title.trim(),
        description.trim() || undefined,
        tagList.length > 0 ? tagList : undefined,
        category || undefined,
      );

      setUploadedDocId(result.id);
      setProcessingStatus("uploaded");
      toast.success("Document uploaded successfully", {
        description: "Processing will begin shortly.",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to upload document";
      toast.error("Upload failed", { description: message });
    } finally {
      setUploading(false);
    }
  };

  const getStepState = (stepStatus: DocumentStatus) => {
    if (!processingStatus) return "pending";
    const order: DocumentStatus[] = ["uploaded", "processing", "ready"];
    const currentIdx = order.indexOf(processingStatus);
    const stepIdx = order.indexOf(stepStatus);
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return processingStatus === "failed" ? "failed" : "active";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-10 text-center transition-all",
          isDragging
            ? "border-brand-gold bg-brand-gold/5"
            : file
              ? "border-brand-gold/30 bg-brand-gold/5"
              : "border-border/60 hover:border-brand-gold/50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/10">
                <FileText className="h-6 w-6 text-brand-gold" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              disabled={uploading}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 mx-auto mb-4">
              <Upload className="h-7 w-7 text-brand-gold" />
            </div>
            <p className="text-lg font-bold tracking-tight mb-1">
              Drag and drop your document here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: PDF, DOCX, TXT (max 50MB)
            </p>
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
              />
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Browse Files
              </span>
            </label>
          </>
        )}
      </div>

      {/* Form Fields */}
      {file && !uploadedDocId && (
        <div className="rounded-xl border border-transparent bg-card p-6 shadow-soft dark:border-glass space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the document"
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Dates Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Expiry Date
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Review Date
              </label>
              <Input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tags
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags (e.g., contract, policy, HR)"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Add tags to help organize and search your documents
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              uploading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:brightness-110",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </button>
        </div>
      )}

      {/* Processing Status Indicator */}
      {uploadedDocId && processingStatus && (
        <div className="rounded-xl border border-transparent bg-card p-6 shadow-soft dark:border-glass">
          <h3 className="text-sm font-bold mb-4">Processing Status</h3>
          <div className="flex items-center gap-4">
            {PROCESSING_STEPS.map((step, idx) => {
              const state = getStepState(step.status);
              return (
                <div key={step.status} className="flex items-center gap-2">
                  {idx > 0 && (
                    <div
                      className={cn(
                        "h-0.5 w-8",
                        state === "completed" || state === "active"
                          ? "bg-brand-gold"
                          : "bg-border",
                      )}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        state === "completed"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : state === "active"
                            ? "bg-brand-gold/10"
                            : state === "failed"
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-muted",
                      )}
                    >
                      {state === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : state === "active" ? (
                        step.status === "processing" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                        ) : (
                          <step.icon className="h-4 w-4 text-brand-gold" />
                        )
                      ) : state === "failed" ? (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <step.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        state === "active"
                          ? "text-brand-gold"
                          : state === "completed"
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {processingStatus === "ready" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Document has been processed and classified. Ready for search.
            </div>
          )}
          {processingStatus === "failed" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              Processing failed. Please try uploading again.
            </div>
          )}
          {(processingStatus === "ready" || processingStatus === "failed") && (
            <button
              type="button"
              onClick={clearFile}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Upload Another Document
            </button>
          )}
        </div>
      )}
    </div>
  );
}
