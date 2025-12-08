"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { saveContractAsTemplate } from "@/lib/api/contracts";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  contractType: string;
  onSuccess?: () => void;
}

export function SaveAsTemplateDialog({
  open,
  onClose,
  sessionId,
  contractType,
  onSuccess,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (name.trim().length < 3) {
      setError("Template name must be at least 3 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveContractAsTemplate(sessionId, {
        name: name.trim(),
        description: description.trim() || undefined,
        make_public: makePublic,
      });

      onSuccess?.();
      onClose();

      // Reset form
      setName("");
      setDescription("");
      setMakePublic(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsLoading(false);
    }
  };

  const getContractTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save this {getContractTypeLabel(contractType)} contract as a reusable template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Standard Employment Contract"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description (optional)</Label>
            <Textarea
              id="template-description"
              placeholder="Describe when to use this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="make-public" className="text-sm font-medium">
                Share with Organization
              </Label>
              <p className="text-xs text-muted-foreground">
                Make this template available to other users
              </p>
            </div>
            <Switch
              id="make-public"
              checked={makePublic}
              onCheckedChange={setMakePublic}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
