import type { AdminPermissions } from '@/types/admin';

export const ADMIN_CONSTANTS = {
    STATS_REFETCH_INTERVAL: 30_000,
    SEARCH_DEBOUNCE_MS: 500,
    DEFAULT_PAGE_SIZE: 50,
    MAX_AUDIT_LOGS_PAGE_SIZE: 100,
} as const;

export const ROLE_PRESETS: Record<string, Partial<AdminPermissions>> = {
    admin: {
        adminAccess: true,
        viewUsers: true,
        manageUsers: true,
        manageBadges: true,
        banUsers: true,
        viewBans: true,
        warnUsers: true,
        viewLogs: true,
        manageServer: true,
        manageInvites: true,
    },
    moderator: {
        adminAccess: false,
        viewUsers: true,
        manageUsers: false,
        manageBadges: false,
        banUsers: true,
        viewBans: true,
        warnUsers: true,
        viewLogs: true,
        manageServer: false,
        manageInvites: false,
    },
    user: {
        adminAccess: false,
        viewUsers: false,
        manageUsers: false,
        manageBadges: false,
        banUsers: false,
        viewBans: false,
        warnUsers: false,
        viewLogs: false,
        manageServer: false,
        manageInvites: false,
    },
};
