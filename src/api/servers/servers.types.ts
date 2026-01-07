export type ServerBannerType = 'color' | 'image' | 'gif';

export const ServerBannerType = {
    COLOR: 'color' as const,
    IMAGE: 'image' as const,
    GIF: 'gif' as const,
};

export interface ServerBanner {
    type: ServerBannerType;
    value: string;
}

export interface Server {
    _id: string;
    name: string;
    ownerId: string;
    icon?: string;
    banner?: ServerBanner;
    description?: string;
    defaultRoleId?: string;
    memberCount?: number;
    allTimeHigh?: number;
    disableCustomFonts?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
