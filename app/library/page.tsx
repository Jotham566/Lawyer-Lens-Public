"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Library,
  Bookmark,
  Clock,
  FileText,
  Gavel,
  ScrollText,
  BookOpen,
  Trash2,
  ArrowRight,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import {
  useSavedDocuments,
  useReadingHistory,
  useLibraryStore,
  type SavedDocument,
  type ReadingHistoryEntry,
} from "@/lib/stores";
import type { DocumentType } from "@/lib/api/types";

const documentTypeConfig: Record<
  DocumentType,
  { icon: typeof FileText; color: string; bgColor: string; label: string }
> = {
  act: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    label: "Act",
  },
  judgment: {
    icon: Gavel,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    label: "Judgment",
  },
  regulation: {
    icon: ScrollText,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    label: "Regulation",
  },
  constitution: {
    icon: BookOpen,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    label: "Constitution",
  },
};

function SavedDocumentCard({ doc }: { doc: SavedDocument }) {
  const unsaveDocument = useLibraryStore((s) => s.unsaveDocument);
  const config = documentTypeConfig[doc.documentType];
  const DocIcon = config.icon;

  return (
    <Card className="group relative transition-colors hover:border-primary/50 hover:bg-muted/30">
      <Link href={`/document/${doc.id}`} className="block">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                config.bgColor
              )}
            >
              <DocIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                {doc.title}
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {doc.actYear && (
                  <span className="text-xs text-muted-foreground">
                    {doc.actYear}
                  </span>
                )}
                {doc.caseNumber && (
                  <span className="text-xs text-muted-foreground">
                    {doc.caseNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        {doc.notes && (
          <CardContent className="pt-0 pb-3">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {doc.notes}
            </p>
          </CardContent>
        )}
      </Link>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from library?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove &quot;{doc.title}&quot; from your saved documents.
                You can always save it again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => unsaveDocument(doc.id)}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

function HistoryEntryCard({ entry }: { entry: ReadingHistoryEntry }) {
  const config = documentTypeConfig[entry.documentType];
  const DocIcon = config.icon;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Link href={`/document/${entry.documentId}`}>
      <Card className="transition-colors hover:border-primary/50 hover:bg-muted/30">
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                config.bgColor
              )}
            >
              <DocIcon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium leading-tight line-clamp-1">
                {entry.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(entry.lastAccessedAt)}
                </span>
                {entry.accessCount > 1 && (
                  <span className="text-xs text-muted-foreground">
                    ({entry.accessCount} views)
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function LibraryPage() {
  const savedDocuments = useSavedDocuments();
  const readingHistory = useReadingHistory();
  const clearHistory = useLibraryStore((s) => s.clearHistory);
  const [activeTab, setActiveTab] = useState("saved");

  // Group saved documents by type
  const savedByType = savedDocuments.reduce(
    (acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    },
    {} as Record<DocumentType, number>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
            <Library className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              My Library
            </h1>
            <p className="text-muted-foreground">
              {savedDocuments.length} saved document
              {savedDocuments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Saved
            {savedDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {savedDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            History
            {readingHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {readingHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-0">
          {savedDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No saved documents</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  Start building your library by saving documents you want to
                  reference later. Click the bookmark icon on any document to
                  save it.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/legislation/acts">
                      <FileText className="mr-2 h-4 w-4" />
                      Browse Acts
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/judgments">
                      <Gavel className="mr-2 h-4 w-4" />
                      Browse Judgments
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/search">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(savedByType).map(([type, count]) => {
                  const config = documentTypeConfig[type as DocumentType];
                  return (
                    <Badge
                      key={type}
                      variant="secondary"
                      className={cn("gap-1", config.bgColor)}
                    >
                      {config.label}: {count}
                    </Badge>
                  );
                })}
              </div>

              {/* Document grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedDocuments.map((doc) => (
                  <SavedDocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {readingHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No reading history</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  Documents you view will appear here for quick access. Your
                  history is stored locally and is private to you.
                </p>
                <Button variant="outline" className="mt-6" asChild>
                  <Link href="/search">
                    <Search className="mr-2 h-4 w-4" />
                    Search Documents
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Recently viewed documents
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear History
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear reading history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all items from your reading history.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory}>
                        Clear History
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                {readingHistory.map((entry) => (
                  <HistoryEntryCard key={entry.documentId} entry={entry} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
