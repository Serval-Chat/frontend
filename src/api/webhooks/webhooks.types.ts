export interface Webhook {
    _id: string;
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
    _id: string;
    name: string;
    token: string;
    avatarUrl?: string;
    createdBy: string;
    createdAt: string;
}
