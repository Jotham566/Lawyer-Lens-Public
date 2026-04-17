"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  Cpu,
  File,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers";
import {
  listDocuments,
  deleteDocument,
  classifyDocument,
  formatFileSize,
  type OrgDocument,
  type DocumentStatus,
} from "@/lib/api/knowledge-base";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  contract: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  policy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sop: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  employee_agreement: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  governance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  compliance_record: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  license: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  financial: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  correspondence: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const DOCUMENT_CATEGORIES = [
  { value: "all", label: "All Categories" },
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
];

/* ─────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────── */

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  const colors =
    CATEGORY_COLORS[category] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        colors,
      )}
    >
      {category.replace(/_/g, " ")}
    </span>
  );
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  switch (status) {
    case "ready":
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  const normalized = fileType.toLowerCase();
  if (normalized.includes("pdf"))
    return <FileText className="h-5 w-5 text-red-500" />;
  if (normalized.includes("doc"))
    return <FileText className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpiringSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const daysAway = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysAway >= 0 && daysAway < 30;
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/* ─────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────── */

interface DocumentListProps {
  refreshTrigger?: number;
  categoryFilter?: string;
  onCategoryFilterChange?: (category: string) => void;
}

export function DocumentList({
  refreshTrigger,
  categoryFilter = "all",
  onCategoryFilterChange,
}: DocumentListProps) {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [classifying, setClassifying] = useState<string | null>(null);

  const pageSize = 10;

  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await listDocuments(
        page,
        pageSize,
        statusFilter === "all" ? undefined : statusFilter,
      );
      setDocuments(response.items);
      setTotal(response.total);
      setHasNext(response.has_next);
      setHasPrev(response.has_prev);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, pageSize, statusFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshTrigger]);

  const handleDelete = async (documentId: string, title: string) => {
    if (!isAuthenticated) return;
    setDeleting(documentId);
    try {
      await deleteDocument(documentId);
      toast.success(`"${title}" deleted successfully`);
      loadDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

  const handleClassify = async (documentId: string) => {
    setClassifying(documentId);
    try {
      await classifyDocument(documentId);
      toast.success("Classification started");
      loadDocuments();
    } catch (error) {
      console.error("Failed to classify document:", error);
      toast.error("Failed to classify document");
    } finally {
      setClassifying(null);
    }
  };

  // Client-side filtering by search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesCategory =
      categoryFilter === "all" ||
      (doc as unknown as Record<string, unknown>).category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="knowledge-base-search-documents"
            name="knowledge-base-search-documents"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => onCategoryFilterChange?.(v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as DocumentStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={loadDocuments}
          disabled={loading}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Document Cards */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="mt-4 text-lg font-bold">
            {searchQuery ? "No matches for that search" : "Your knowledge base is ready"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different keyword, or clear the search to see every document."
              : "Upload contracts, policies, or memos and Ask Ben will cite them in answers."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredDocuments.map((doc) => {
              const docAny = doc as unknown as Record<string, unknown>;
              const category = docAny.category as string | undefined;
              const expiryDate = docAny.expiry_date as string | undefined;
              const isClassified = docAny.compliance_classification != null;

              return (
                <div
                  key={doc.id}
                  className="rounded-xl border border-transparent bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-floating dark:border-glass"
                >
                  <div className="flex items-start gap-4">
                    {/* File Type Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileTypeIcon fileType={doc.file_type} />
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{doc.title}</h4>
                        <StatusIcon status={doc.status} />
                        {category && <CategoryBadge category={category} />}
                        {isClassified && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Classified
                          </span>
                        )}
                        {!isClassified && doc.status === "ready" && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Not Classified
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{doc.filename}</span>
                        <span>{formatFileSize(doc.file_size_bytes)}</span>
                        <span>{formatDate(doc.created_at)}</span>
                        {doc.status === "ready" && (
                          <span>{doc.chunk_count} chunks</span>
                        )}
                      </div>

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {doc.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 4 && (
                            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              +{doc.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expiry Warning */}
                      {expiryDate && isExpired(expiryDate) && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          Expired on {formatDate(expiryDate)}
                        </div>
                      )}
                      {expiryDate &&
                        !isExpired(expiryDate) &&
                        isExpiringSoon(expiryDate) && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            Expires on {formatDate(expiryDate)}
                          </div>
                        )}

                      {/* Error message */}
                      {doc.status === "failed" && doc.error_message && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span className="truncate max-w-[300px]">
                            {doc.error_message}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* View */}
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Classify */}
                      {doc.status === "ready" && !isClassified && (
                        <button
                          type="button"
                          onClick={() => handleClassify(doc.id)}
                          disabled={classifying === doc.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand-gold/10 hover:text-brand-gold"
                          title="Classify document"
                        >
                          {classifying === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Cpu className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            disabled={deleting === doc.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                            title="Delete document"
                          >
                            {deleting === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{doc.title}
                              &quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(doc.id, doc.title)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {(hasNext || hasPrev) && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!hasPrev || loading}
                  className={cn(
                    "inline-flex items-center rounded-lg border border-border/60 px-3 py-1.5 text-sm font-medium transition-colors",
                    hasPrev && !loading
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground/50 cursor-not-allowed",
                  )}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext || loading}
                  className={cn(
                    "inline-flex items-center rounded-lg border border-border/60 px-3 py-1.5 text-sm font-medium transition-colors",
                    hasNext && !loading
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground/50 cursor-not-allowed",
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
