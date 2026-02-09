"use client";

import * as React from "react";
import { Bookmark, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    collectionsApi,
    type Collection,
    type CollectionItemMeta,
} from "@/lib/api/collections";
import { cn } from "@/lib/utils";
import { useAuth, useAuthModal } from "@/components/providers";

interface SaveToCollectionButtonProps {
    documentId: string;
    sectionId?: string | null;
    itemType: "document" | "section" | "excerpt";
    meta?: CollectionItemMeta;
    trigger?: React.ReactNode;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showLabel?: boolean;
}

export function SaveToCollectionButton({
    documentId,
    sectionId,
    itemType,
    meta,
    trigger,
    variant = "outline",
    size = "default",
    className,
    showLabel = true,
}: SaveToCollectionButtonProps) {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useAuthModal();
    const pathname = usePathname();
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [collections, setCollections] = React.useState<Collection[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = React.useState<string>("");
    const [isCreatingNew, setIsCreatingNew] = React.useState(false);
    const [newCollectionName, setNewCollectionName] = React.useState("");
    const [notes, setNotes] = React.useState("");

    React.useEffect(() => {
        if (open) {
            loadCollections();
        }
    }, [open]);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const data = await collectionsApi.getAll();
            setCollections(data);
            if (data.length > 0 && !selectedCollectionId) {
                setSelectedCollectionId(data[0].id);
            }
        } catch (error) {
            toast.error("Failed to load collections");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isCreatingNew && !newCollectionName.trim()) {
            toast.error("Please enter a collection name");
            return;
        }
        if (!isCreatingNew && !selectedCollectionId) {
            toast.error("Please select a collection");
            return;
        }

        setSaving(true);
        try {
            let targetCollectionId = selectedCollectionId;

            if (isCreatingNew) {
                const newCollection = await collectionsApi.create({
                    name: newCollectionName.trim(),
                    is_public: false,
                });
                targetCollectionId = newCollection.id;
                // Update local list
                setCollections([...collections, newCollection]);
            }

            await collectionsApi.addItem(targetCollectionId, {
                document_id: documentId,
                section_id: sectionId || undefined,
                item_type: itemType,
                notes: notes.trim() || undefined,
                meta: meta,
            });

            toast.success("Saved to collection");
            setOpen(false);
            // Reset form
            setNotes("");
            setNewCollectionName("");
            setIsCreatingNew(false);
        } catch (error) {
            toast.error("Failed to save item");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen && !isAuthenticated) {
            const search = typeof window !== "undefined" ? window.location.search : "";
            openLogin(`${pathname}${search}`);
            setOpen(false);
            return;
        }
        setOpen(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={variant} size={size} className={className}>
                        <Bookmark className={cn("h-4 w-4", showLabel && "mr-2")} />
                        {showLabel && "Save"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save to Collection</DialogTitle>
                    <DialogDescription>
                        Save this {itemType} to a collection for quick access later.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        {!isCreatingNew ? (
                            <div className="grid gap-2">
                                <Label htmlFor="collection">Collection</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedCollectionId}
                                        onValueChange={setSelectedCollectionId}
                                        disabled={collections.length === 0}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    collections.length === 0
                                                        ? "No collections found"
                                                        : "Select collection"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {collections.map((col) => (
                                                <SelectItem key={col.id} value={col.id}>
                                                    {col.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setIsCreatingNew(true);
                                            setNewCollectionName("");
                                        }}
                                        title="Create new collection"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {collections.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        You haven't created any collections yet. Click + to create
                                        one.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor="new-name">New Collection Name</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="new-name"
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        placeholder="My Research"
                                        autoFocus
                                    />
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsCreatingNew(false)}
                                        disabled={collections.length === 0}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add some notes about this item..."
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
