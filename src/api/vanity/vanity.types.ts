export interface VanityLink {
    code: string | null;
    createdByUserId?: string;
    createdByUsername?: string;
    createdAt?: string;
}

export interface SetVanityLinkRequest {
    code: string;
}
