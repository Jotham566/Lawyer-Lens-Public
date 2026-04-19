import { apiGet, apiPost, apiFetch } from "./client";

export interface CollectionItemMeta {
    title?: string;
    document_type?: string;
    identifier?: string;
    quote?: string;
    snippet_label?: string;
    chapter?: string;
    act_year?: string | number;
    [key: string]: unknown;
}

export interface CollectionItem {
    id: string;
    collection_id: string;
    /** Set when this item is a legislation bookmark. Mutually
     * exclusive with research_session_id (DB-level CHECK constraint
     * ck_collection_items_one_target). */
    document_id: string | null;
    /** Set when this item is a saved research-report bookmark. */
    research_session_id: string | null;
    section_id: string | null;
    item_type: "document" | "section" | "excerpt" | "research_report";
    notes: string | null;
    meta: CollectionItemMeta;
    created_at: string;
    updated_at: string;
}

export interface Collection {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    item_count?: number;
    items?: CollectionItem[];
}

export interface CreateCollectionRequest {
    name: string;
    description?: string;
    is_public?: boolean;
}

export interface UpdateCollectionRequest {
    name?: string;
    description?: string;
    is_public?: boolean;
}

export interface AddCollectionItemRequest {
    /** For legislation bookmarks. Mutually exclusive with
     * research_session_id — backend rejects requests with both. */
    document_id?: string;
    /** For research-report bookmarks. */
    research_session_id?: string;
    section_id?: string;
    item_type: "document" | "section" | "excerpt" | "research_report";
    notes?: string;
    meta?: CollectionItemMeta;
}

export const collectionsApi = {
    /**
     * Get all collections for the current user
     */
    getAll: async (): Promise<Collection[]> => {
        return apiGet<Collection[]>("/collections/");
    },

    /**
     * Get a specific collection by ID
     */
    get: async (collectionId: string): Promise<Collection> => {
        return apiGet<Collection>(`/collections/${collectionId}`);
    },

    /**
     * Create a new collection
     */
    create: async (data: CreateCollectionRequest): Promise<Collection> => {
        return apiPost<Collection>("/collections/", data);
    },

    /**
     * Update a collection
     */
    update: async (
        collectionId: string,
        data: UpdateCollectionRequest
    ): Promise<Collection> => {
        return apiFetch<Collection>(`/collections/${collectionId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete a collection
     */
    delete: async (collectionId: string): Promise<void> => {
        await apiFetch(`/collections/${collectionId}`, { method: "DELETE" });
    },

    /**
     * Add an item to a collection
     */
    addItem: async (
        collectionId: string,
        data: AddCollectionItemRequest
    ): Promise<CollectionItem> => {
        return apiPost<CollectionItem>(`/collections/${collectionId}/items`, data);
    },

    /**
     * Remove an item from a collection
     */
    removeItem: async (
        collectionId: string,
        itemId: string
    ): Promise<void> => {
        await apiFetch(`/collections/${collectionId}/items/${itemId}`, { method: "DELETE" });
    },
};
