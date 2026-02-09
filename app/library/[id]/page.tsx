"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Trash2,
    FileText,
    Settings,
    Calendar,
    MoreVertical,
    Loader2,
    BookOpen,
    ScrollText,
    Gavel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { collectionsApi, type Collection } from "@/lib/api/collections";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { useAuth, useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

// Helper to determine icon based on doc type
const getIconForType = (type?: string) => {
    switch (type) {
        case "act": return FileText;
        case "judgment": return Gavel;
        case "regulation": return ScrollText;
        case "constitution": return BookOpen;
        default: return FileText;
    }
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CollectionDetailPage(props: PageProps) {
    const params = use(props.params);
    const router = useRouter();
    const { isLoading: authLoading } = useRequireAuth();
    const { isAuthenticated } = useAuth();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        loadCollection();
    }, [params.id, isAuthenticated]);

    const loadCollection = async () => {
        setLoading(true);
        try {
            const data = await collectionsApi.get(params.id);
            setCollection(data);
        } catch (error) {
            console.error("Failed to load collection:", error);
            toast.error("Failed to load collection");
            router.push("/library");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCollection = async () => {
        setDeleting(true);
        try {
            await collectionsApi.delete(params.id);
            toast.success("Collection deleted");
            router.push("/library");
        } catch (error) {
            console.error("Failed to delete collection:", error);
            toast.error("Failed to delete collection");
            setDeleting(false);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            await collectionsApi.removeItem(params.id, itemId);
            setCollection((prev) =>
                prev ? { ...prev, items: prev.items?.filter(i => i.id !== itemId) } : null
            );
            toast.success("Item removed");
        } catch (error) {
            console.error("Failed to remove item:", error);
            toast.error("Failed to remove item");
        }
    };

    if (authLoading || !isAuthenticated) {
        return <PageLoading message="Redirecting to login..." />;
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!collection) return null;

    return (
        <div className="container py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link
                    href="/library"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Library
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
                        {collection.description && (
                            <p className="text-muted-foreground mt-2 text-lg">
                                {collection.description}
                            </p>
                        )}
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Created {formatDateOnly(collection.created_at)}</span>
                            </div>
                            <div>•</div>
                            <div>{collection.items?.length || 0} items</div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                                <Settings className="mr-2 h-4 w-4" />
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Collection
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete collection?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete "{collection.name}" and all saved items within it.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteCollection}
                                            className="bg-destructive hover:bg-destructive/90"
                                            disabled={deleting}
                                        >
                                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4">
                {collection.items?.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">This collection is empty.</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/browse">Browse documents to add items</Link>
                        </Button>
                    </div>
                ) : (
                    collection.items?.map((item) => {
                        const Icon = getIconForType(item.meta?.document_type);
                        // Construct target URL with focus on section if available
                        const href = `/document/${item.document_id}${item.section_id ? `?section=${item.section_id}` : ''}`;

                        return (
                            <Card key={item.id} className="group transition-colors hover:border-primary/50">
                                <div className="flex items-start p-6">
                                    <div className="flex-shrink-0 mr-4 mt-1">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <Link href={href} className="block group-hover:text-primary transition-colors">
                                                    <h3 className="font-semibold leading-tight">
                                                        {/* Use snippet_label if available (includes doc + section path), otherwise fall back to title */}
                                                        {item.meta?.snippet_label || item.meta?.title || "Untitled Document"}
                                                    </h3>
                                                </Link>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {item.item_type}
                                                    </Badge>
                                                    <span>•</span>
                                                    <span>Added {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                                                </div>
                                                {item.notes && (
                                                    <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md italic">
                                                        "{item.notes}"
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
