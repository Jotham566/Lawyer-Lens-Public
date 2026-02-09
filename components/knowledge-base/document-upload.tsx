"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers";
import { uploadDocument, formatFileSize } from "@/lib/api/knowledge-base";
import { toast } from "sonner";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!allowedTypes.includes(file.type)) {
      return "Invalid file type. Please upload PDF, DOCX, or TXT files.";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
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
      // Set title from filename if empty
      if (!title) {
        const nameWithoutExt = droppedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        toast.error(error);
        return;
      }
      setFile(selectedFile);
      // Set title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setTags("");
    setUploadSuccess(false);
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

      await uploadDocument(
        file,
        title.trim(),
        description.trim() || undefined,
        tagList.length > 0 ? tagList : undefined
      );

      setUploadSuccess(true);
      toast.success("Document uploaded successfully", {
        description: "Processing will begin shortly.",
      });

      // Reset form after a delay
      setTimeout(() => {
        clearFile();
        onUploadComplete?.();
      }, 2000);
    } catch (error) {
      console.error("Upload failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to upload document";
      toast.error("Upload failed", { description: message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : file
                ? "border-green-500 bg-green-50"
                : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
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
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </>
          )}
        </div>

        {/* Form Fields */}
        {file && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                disabled={uploading || uploadSuccess}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of the document"
                rows={3}
                disabled={uploading || uploadSuccess}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags (e.g., contract, policy, HR)"
                disabled={uploading || uploadSuccess}
              />
              <p className="text-xs text-muted-foreground">
                Add tags to help organize and search your documents
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={uploading || uploadSuccess || !title.trim()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uploaded Successfully
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
