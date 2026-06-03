export interface Webhook {
    id: string;
    name: string;
    token: string;
    avatarUrl?: string;
    createdBy: string;
    createdAt: string;
}

export interface CreateWebhookRequest {
    name: string;
}

export interface WebhookResponse {
    id: string;
    name: string;
    token: string;
    avatarUrl?: string;
    createdBy: string;
    createdAt: string;
}
