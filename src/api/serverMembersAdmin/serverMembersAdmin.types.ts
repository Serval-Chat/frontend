import type { User } from '@/api/users/users.types';

export interface ServerMemberAdminFilters {
    roleId?: string;
    search?: string;
    sortBy?: 'joinedAt' | 'username';
    sortDir?: 'asc' | 'desc';
}

export interface ServerMemberJoinedVia {
    method: 'invite' | 'vanity';
    code: string;
}

export interface ServerMemberAdminEntry {
    id: string;
    serverId: string;
    userId: string;
    nickname?: string;
    roles: string[];
    joinedAt: string;
    joinedVia?: ServerMemberJoinedVia;
    user: User | null;
}

export interface ServerMemberAdminListResponse {
    members: ServerMemberAdminEntry[];
    total: number;
    limit: number;
    offset: number;
}
