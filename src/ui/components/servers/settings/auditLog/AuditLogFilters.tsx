import React from 'react';

import {
    Crown,
    Edit2,
    Link,
    PlusCircle,
    Repeat,
    Search,
    Settings,
    ShieldAlert,
    Smile,
    Trash2,
    UserMinus,
    UserPlus,
    UserX,
    X,
} from 'lucide-react';

import type {
    AuditLogAction,
    AuditLogFilters as IAuditLogFilters,
} from '@/api/auditLog/auditLog.types';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Input } from '@/ui/components/common/Input';

interface AuditLogFiltersProps {
    filters: IAuditLogFilters;
    onFiltersChange: (filters: IAuditLogFilters) => void;
}

// Options grouped logically and sorted alphabetically within groups
const ACTION_OPTIONS = [
    { value: '', label: 'All Actions', group: undefined },
    {
        value: 'create_category',
        label: 'Create Category',
        group: 'Channels & Categories',
    },
    {
        value: 'create_channel',
        label: 'Create Channel',
        group: 'Channels & Categories',
    },
    {
        value: 'delete_category',
        label: 'Delete Category',
        group: 'Channels & Categories',
    },
    {
        value: 'delete_channel',
        label: 'Delete Channel',
        group: 'Channels & Categories',
    },
    {
        value: 'edit_category',
        label: 'Edit Category',
        group: 'Channels & Categories',
    },
    {
        value: 'edit_channel',
        label: 'Edit Channel',
        group: 'Channels & Categories',
    },

    { value: 'emoji_create', label: 'Emoji Created', group: 'Emojis' },
    { value: 'emoji_delete', label: 'Emoji Deleted', group: 'Emojis' },

    { value: 'invite_create', label: 'Invite Created', group: 'Invites' },
    { value: 'invite_delete', label: 'Invite Deleted', group: 'Invites' },

    { value: 'user_ban', label: 'Ban Member', group: 'Members' },
    { value: 'user_kick', label: 'Kick Member', group: 'Members' },
    { value: 'member_join', label: 'Member Joined', group: 'Members' },
    {
        value: 'owner_changed',
        label: 'Ownership Transferred',
        group: 'Members',
    },
    { value: 'user_unban', label: 'Unban Member', group: 'Members' },
    { value: 'user_leave', label: 'User Leave', group: 'Members' },

    { value: 'delete_message', label: 'Delete Message', group: 'Messages' },
    { value: 'edit_message', label: 'Edit Message', group: 'Messages' },
    { value: 'reaction_clear', label: 'Remove Reactions', group: 'Messages' },

    { value: 'role_create', label: 'Create Role', group: 'Roles' },
    { value: 'role_delete', label: 'Delete Role', group: 'Roles' },
    { value: 'role_update', label: 'Edit Role', group: 'Roles' },
    { value: 'role_given', label: 'Role Given', group: 'Roles' },
    { value: 'role_icon_updated', label: 'Role Icon Updated', group: 'Roles' },
    { value: 'roles_reordered', label: 'Roles Reordered', group: 'Roles' },

    { value: 'update_server', label: 'Update Server', group: 'Server' },
];

const getActionIcon = (action: string): React.ReactNode | undefined => {
    switch (action) {
        case 'create_channel':
        case 'create_category':
        case 'role_created':
        case 'role_create':
            return <PlusCircle className="h-4 w-4 text-green-500" />;
        case 'edit_channel':
        case 'edit_category':
        case 'role_edited':
        case 'role_update':
        case 'update_server':
        case 'role_icon_updated':
        case 'edit_message':
            return <Edit2 className="h-4 w-4 text-yellow-500" />;
        case 'delete_channel':
        case 'delete_category':
        case 'role_removed':
        case 'role_delete':
        case 'delete_message':
        case 'reactions_removed':
        case 'reaction_clear':
            return <Trash2 className="h-4 w-4 text-red-500" />;
        case 'user_kick':
            return <UserMinus className="h-4 w-4 text-orange-500" />;
        case 'user_ban':
            return <UserX className="h-4 w-4 text-red-500" />;
        case 'user_unban':
        case 'user_join':
        case 'member_join':
            return <UserPlus className="h-4 w-4 text-green-500" />;
        case 'user_leave':
            return <UserMinus className="h-4 w-4 text-orange-500" />;
        case 'owner_changed':
            return <Crown className="h-4 w-4 text-yellow-400" />;
        case 'role_given':
            return <ShieldAlert className="h-4 w-4 text-blue-500" />;
        case 'emoji_create':
            return <Smile className="h-4 w-4 text-green-500" />;
        case 'emoji_delete':
            return <Smile className="h-4 w-4 text-red-500" />;
        case 'invite_create':
            return <Link className="h-4 w-4 text-green-500" />;
        case 'invite_delete':
            return <Link className="h-4 w-4 text-red-500" />;
        case 'roles_reordered':
            return <Repeat className="h-4 w-4 text-yellow-500" />;
        case '':
            return undefined;
        default:
            return <Settings className="h-4 w-4 text-gray-500" />;
    }
};

const DROPDOWN_OPTIONS = ACTION_OPTIONS.map((opt) => ({
    id: opt.value,
    label: opt.label,
    description: opt.group,
    icon: getActionIcon(opt.value),
}));

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
    filters,
    onFiltersChange,
}) => {
    const handleActionChange = (value: string | null): void => {
        onFiltersChange({
            ...filters,
            actionType: (value || '') as AuditLogAction | '',
        });
    };

    const handleModeratorChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        onFiltersChange({ ...filters, moderatorId: e.target.value });
    };

    const handleTargetChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        onFiltersChange({ ...filters, targetId: e.target.value });
    };

    const handleReasonChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        onFiltersChange({ ...filters, reason: e.target.value });
    };

    const clearFilters = (): void => {
        onFiltersChange({
            actionType: '',
            moderatorId: '',
            targetId: '',
            reason: '',
        });
    };

    const hasActiveFilters = Boolean(
        filters.actionType ||
        filters.moderatorId ||
        filters.targetId ||
        filters.reason,
    );

    return (
        <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="z-10 flex w-full flex-col gap-1.5">
                    <DropdownWithSearch
                        allowClear
                        label="Action"
                        options={DROPDOWN_OPTIONS}
                        placeholder="All Actions"
                        searchPlaceholder="Search actions..."
                        value={filters.actionType || ''}
                        onChange={handleActionChange}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label
                        className="text-text-muted text-xs font-medium"
                        htmlFor="audit-filter-moderator"
                    >
                        Moderator ID
                    </label>
                    <Input
                        className="h-10"
                        id="audit-filter-moderator"
                        placeholder="Filter by User ID"
                        value={filters.moderatorId || ''}
                        onChange={handleModeratorChange}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label
                        className="text-text-muted text-xs font-medium"
                        htmlFor="audit-filter-target"
                    >
                        Target ID
                    </label>
                    <Input
                        className="h-10"
                        id="audit-filter-target"
                        placeholder="Filter by Target ID"
                        value={filters.targetId || ''}
                        onChange={handleTargetChange}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label
                        className="text-text-muted text-xs font-medium"
                        htmlFor="audit-filter-reason"
                    >
                        Reason
                    </label>
                    <div className="relative">
                        <Input
                            className="h-10 pl-9"
                            id="audit-filter-reason"
                            placeholder="Search in reason..."
                            value={filters.reason || ''}
                            onChange={handleReasonChange}
                        />
                        <Search className="text-text-muted absolute top-2.5 left-3 h-4 w-4" />
                    </div>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="flex justify-end">
                    <Button
                        className="text-text-muted hover:text-text"
                        size="sm"
                        variant="ghost"
                        onClick={clearFilters}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            )}
        </div>
    );
};
