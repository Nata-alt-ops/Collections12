export interface User {
    id: number;
    email: string;
    username: string;
}

export interface Collection {
    image_path: any;
    id: number;
    name: string;
    description: string | null;
    custom_fields: { name: string; type: string }[];
    created_at: string;
    owner_id: number;
}

export interface Item {
    id: number;
    title: string;
    image_path: string | null;
    custom_values: Record<string, any>;
    created_at: string;
    updated_at: string;
    collection_id: number;
}