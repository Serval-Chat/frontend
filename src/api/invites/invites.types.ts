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

export interface ServerInvite {
    _id: string;
    serverId: string;
    code: string;
    customPath?: string;
    createdByUserId: string;
    maxUses?: number;
    uses: number;
    expiresAt?: string;
    createdAt: string;
}

export interface CreateInviteData {
    customPath?: string;
    maxUses?: number;
    expiresIn?: number; // In seconds
}
