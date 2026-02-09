"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers";
import { uploadAvatar, deleteAvatar } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";
import { AlertBanner } from "@/components/common";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  size?: "sm" | "md" | "lg" | "xl";
  onAvatarChange?: (newAvatarUrl: string | null) => void;
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  size = "lg",
  onAvatarChange,
}: AvatarUploadProps) {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError("Image must be less than 5MB");
        return;
      }

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
      setShowConfirmDialog(true);

      // Reset input value to allow selecting same file again
      event.target.value = "";
    },
    []
  );

  const handleUpload = async () => {
    if (!selectedFile || !isAuthenticated) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadAvatar(selectedFile);
      setAvatarUrl(response.avatar_url);
      onAvatarChange?.(response.avatar_url);
      setShowConfirmDialog(false);
      cleanupPreview();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Failed to upload avatar");
      } else {
        setError("Failed to upload avatar. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAvatar();
      setAvatarUrl(null);
      onAvatarChange?.(null);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Failed to delete avatar");
      } else {
        setError("Failed to delete avatar. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const cleanupPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  }, [previewUrl]);

  const handleCancel = () => {
    setShowConfirmDialog(false);
    cleanupPreview();
    setError(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {userName ? getInitials(userName) : <User className={iconSizeClasses[size]} />}
            </AvatarFallback>
          </Avatar>

          {/* Upload overlay on hover */}
          <button
            type="button"
            onClick={triggerFileSelect}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Upload avatar"
          >
            <Camera className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select avatar image"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileSelect}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </>
            )}
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Photo
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && <AlertBanner variant="error" message={error} />}

      <p className="text-xs text-muted-foreground">
        Recommended: Square image, at least 200x200 pixels. Max 5MB.
      </p>

      {/* Preview/Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Preview your new profile photo before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {previewUrl && (
              <Avatar className="h-32 w-32">
                <AvatarImage src={previewUrl} alt="Preview" />
                <AvatarFallback>
                  <Loader2 className="h-6 w-6 animate-spin" />
                </AvatarFallback>
              </Avatar>
            )}

            {error && <AlertBanner variant="error" message={error} />}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
