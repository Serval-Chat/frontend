export interface InviteServerBanner {
    type: 'image' | 'gradient' | 'color' | 'gif';
    value: string;
}

export interface InviteServer {
    id: string;
    name: string;
    icon?: string;
    banner?: InviteServerBanner;
}

export interface InviteDetails {
    code: string;
    expiresAt?: string;
    maxUses?: number;
    uses: number;
    server: InviteServer;
    memberCount: number;
}
