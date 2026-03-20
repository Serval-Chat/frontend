export type AuditLogAction =
    | 'update_server'
    | 'create_channel'
    | 'edit_channel'
    | 'delete_channel'
    | 'create_category'
    | 'edit_category'
    | 'delete_category'
    | 'role_created'
    | 'role_edited'
    | 'role_removed'
    | 'role_create'
    | 'role_update'
    | 'role_delete'
    | 'role_given'
    | 'role_icon_updated'
    | 'roles_reordered'
    | 'user_kick'
    | 'user_ban'
    | 'user_unban'
    | 'user_join'
    | 'member_join'
    | 'user_leave'
    | 'owner_changed'
    | 'delete_message'
    | 'edit_message'
    | 'reactions_removed'
    | 'reaction_clear'
    | 'emoji_create'
    | 'emoji_delete'
    | 'invite_create'
    | 'invite_delete';

export interface IAuditLogChange {
    field: string;
    before?: unknown;
    after?: unknown;
}

export interface IAuditLogActor {
    id: string;
    username: string;
    avatarUrl?: string;
}

export interface IAuditLogTarget {
    id?: string;
    username?: string;
    name?: string;
}

export interface AuditLogEntry {
    id: string;
    action: AuditLogAction;
    moderatorId: string;
    moderator: IAuditLogActor;
    targetId?: string;
    targetType?:
        | 'user'
        | 'channel'
        | 'category'
        | 'role'
        | 'message'
        | 'server';
    target?: IAuditLogTarget;
    changes?: IAuditLogChange[];
    reason?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface AuditLogResponse {
    entries: AuditLogEntry[];
    nextCursor: string | null;
}

export interface AuditLogFilters {
    actionType?: AuditLogAction | '';
    moderatorId?: string;
    targetId?: string;
    reason?: string;
}
