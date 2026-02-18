"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Database,
  FileText,
  Search,
  Upload,
  BarChart3,
  HardDrive,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useRequireAuth } from "@/components/providers";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { DocumentUpload } from "@/components/knowledge-base/document-upload";
import { DocumentList } from "@/components/knowledge-base/document-list";
import { SearchInternal } from "@/components/knowledge-base/search-internal";
import {
  getKnowledgeBaseStats,
  formatFileSize,
  type KnowledgeBaseStats,
} from "@/lib/api/knowledge-base";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function KnowledgeBaseContent() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await getKnowledgeBaseStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load KB stats:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStats();
  }, [isAuthenticated, refreshTrigger, loadStats]);

  const handleUploadComplete = () => {
    setRefreshTrigger((t) => t + 1);
  };

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              Knowledge Base
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload and search your organization&apos;s internal documents
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Documents"
              value={stats?.total_documents || 0}
              icon={FileText}
              description="Uploaded to knowledge base"
            />
            <StatCard
              title="Ready for Search"
              value={stats?.ready_documents || 0}
              icon={Search}
              description={`${stats?.processing_documents || 0} processing`}
            />
            <StatCard
              title="Total Chunks"
              value={stats?.total_chunks || 0}
              icon={BarChart3}
              description="Searchable segments"
            />
            <StatCard
              title="Storage Used"
              value={formatFileSize(stats?.total_storage_bytes || 0)}
              icon={HardDrive}
              description="Document storage"
            />
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="search">
          <SearchInternal />
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function KnowledgeBasePage() {
  const { canShowContent } = useRequireAuth();

  // Show loading while checking auth or redirecting
  if (!canShowContent) {
    return (
      <div className="container max-w-7xl py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <FeatureGate
      feature="custom_integrations"
      fallback={
        <div className="container max-w-7xl py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Organization Knowledge Base is an Enterprise feature that
                allows you to upload, manage, and search your own internal
                documents using AI-powered semantic search.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Features include:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Upload PDF, DOCX, and TXT documents</li>
                  <li>Automatic text extraction and chunking</li>
                  <li>AI-powered semantic search</li>
                  <li>Integration with legal research chat</li>
                </ul>
              </div>
              <Button asChild>
                <Link href="/pricing">Upgrade to Enterprise</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <KnowledgeBaseContent />
    </FeatureGate>
  );
}
