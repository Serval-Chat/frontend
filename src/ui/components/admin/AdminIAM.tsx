import { type ReactNode, useEffect, useState } from 'react';

import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Eye,
    Search,
    ShieldAlert,
    ShieldCheck,
    User as UserIcon,
} from 'lucide-react';

import { useMe } from '@/api/users/users.queries';
import { ROLE_PRESETS } from '@/constants/admin';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminUsers,
    useUpdateUserPermissions,
} from '@/hooks/admin/useAdminUsers';
import type { AdminPermissions, AdminUser } from '@/types/admin';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { LoadingOverlay } from '@/ui/components/common/LoadingOverlay';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { cn } from '@/utils/cn';

const createDefaultPermissions = (): AdminPermissions => ({
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
});

const PERMISSION_KEYS: (keyof AdminPermissions)[] = [
    'adminAccess',
    'viewUsers',
    'manageUsers',
    'manageBadges',
    'banUsers',
    'viewBans',
    'warnUsers',
    'viewLogs',
    'manageServer',
    'manageInvites',
];

const PermissionEditor = ({
    user,
    onClose,
}: {
    user: AdminUser;
    onClose: () => void;
}): ReactNode => {
    const [permissions, setPermissions] = useState<AdminPermissions>(
        user.permissions,
    );
    const { mutate: updatePermissions, isPending } = useUpdateUserPermissions();
    const { data: currentUser } = useMe();
    const [showConfirm, setShowConfirm] = useState(false);

    const canEdit =
        currentUser?.permissions?.adminAccess ||
        currentUser?.permissions?.manageUsers;

    const handleSave = (): void => {
        setShowConfirm(true);
    };

    const confirmSave = (): void => {
        updatePermissions(
            { userId: user._id, permissions },
            {
                onSuccess: () => {
                    setShowConfirm(false);
                    onClose();
                },
            },
        );
    };

    const togglePermission = (key: keyof AdminPermissions): void => {
        if (!canEdit) return;
        setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const setRole = (role: 'admin' | 'moderator' | 'user'): void => {
        if (!canEdit) return;
        setPermissions({
            ...createDefaultPermissions(),
            ...ROLE_PRESETS[role],
        } as AdminPermissions);
    };

    return (
        <Modal
            isOpen
            title={`Edit Permissions: ${user.username}`}
            onClose={onClose}
        >
            <div className="space-y-6">
                {/* Quick Roles */}
                <div className="flex gap-2 p-1 bg-bg-secondary rounded-lg">
                    <Button
                        className="flex-1 py-1 text-xs font-bold rounded-md transition-colors"
                        disabled={!canEdit}
                        variant="ghost"
                        onClick={() => setRole('user')}
                    >
                        User
                    </Button>
                    <Button
                        className="flex-1 py-1 text-xs font-bold rounded-md transition-colors text-caution"
                        disabled={!canEdit}
                        variant="ghost"
                        onClick={() => setRole('moderator')}
                    >
                        Moderator
                    </Button>
                    <Button
                        className="flex-1 py-1 text-xs font-bold rounded-md transition-colors text-danger"
                        disabled={!canEdit}
                        variant="ghost"
                        onClick={() => setRole('admin')}
                    >
                        Admin
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                    {PERMISSION_KEYS.map((key) => (
                        <div
                            className={cn(
                                'flex items-center justify-between p-3 rounded-xl border transition-all',
                                permissions[key]
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border-subtle bg-bg-secondary/30',
                            )}
                            key={key}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {key
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/^./, (str) =>
                                            str.toUpperCase(),
                                        )}
                                </span>
                                <span className="text-[10px] text-muted-foreground opacity-70">
                                    {getPermissionDescription(key)}
                                </span>
                            </div>
                            <Toggle
                                checked={permissions[key]}
                                onChange={() => togglePermission(key)}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    {!canEdit && (
                        <span className="text-xs text-danger self-center mr-2">
                            You do not have permission to edit users.
                        </span>
                    )}
                    <Button
                        className="rounded-xl px-6"
                        disabled={isPending || !canEdit}
                        loading={isPending}
                        variant="primary"
                        onClick={handleSave}
                    >
                        <Check size={16} /> Save Changes
                    </Button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-background border border-border-subtle rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-warning">
                            <AlertTriangle size={24} />
                            <Heading level={3}>Confirm Changes</Heading>
                        </div>
                        <Text as="p" className="mb-6" variant="muted">
                            Are you sure you want to update permissions for{' '}
                            <span className="font-bold text-foreground">
                                {user.username}
                            </span>
                            ?
                            {permissions.adminAccess &&
                                !user.permissions.adminAccess && (
                                    <span className="block mt-2 text-danger font-bold">
                                        Warning: You are granting Super Admin
                                        access!
                                    </span>
                                )}
                        </Text>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setShowConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isPending}
                                loading={isPending}
                                variant="primary"
                                onClick={confirmSave}
                            >
                                Confirm Update
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Loading State Overlay */}
            <LoadingOverlay
                isOpen={isPending}
                message="Updating Permissions..."
            />
        </Modal>
    );
};

const getPermissionDescription = (key: string): string => {
    switch (key) {
        case 'adminAccess':
            return 'Full super-admin access bypassing checks';
        case 'viewUsers':
            return 'Can list and search all users';
        case 'manageUsers':
            return 'Can edit profiles and delete users';
        case 'manageBadges':
            return 'Allows creating, editing, and deleting platform badges';
        case 'banUsers':
            return 'Can ban users from the platform';
        case 'viewBans':
            return 'Allows viewing active and historical platform bans';
        case 'warnUsers':
            return 'Allows issuing formal warnings to users';
        case 'viewLogs':
            return 'Allows viewing granular administrative audit logs';
        case 'manageServer':
            return 'Allows management and oversight of all user-created servers';
        case 'manageInvites':
            return 'Allows managing and revoking invite codes';
        default:
            return 'Grants access to this feature';
    }
};

export const AdminIAM = ({
    onViewUser,
}: {
    onViewUser: (userId: string) => void;
}): ReactNode => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const LIMIT = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0); // Reset page on new search
        }, ADMIN_CONSTANTS.SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: users, isLoading } = useAdminUsers(
        debouncedSearch,
        page,
        LIMIT,
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <Heading
                    className="flex items-center gap-3"
                    level={2}
                    variant="admin-page"
                >
                    <ShieldCheck className="text-primary" />
                    Identity & Access
                </Heading>
                <Text as="p" variant="muted">
                    Manage user roles, permissions, and administrative access.
                </Text>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-subtle p-4">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                    />
                    <Input
                        className="pl-10"
                        placeholder="Search users by username or ID..."
                        type="text"
                        value={searchTerm}
                        variant="admin"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-subtle">
                <div className="grid grid-cols-[1fr_120px_150px_100px] gap-4 items-center px-6 py-3 border-b border-border-subtle bg-bg-secondary/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <div>User</div>
                    <div>Access Level</div>
                    <div>Joined</div>
                    <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-border-subtle">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : users && users.length > 0 ? (
                        users.map((user) => (
                            <div
                                className="grid grid-cols-[1fr_120px_150px_100px] gap-4 items-center px-6 py-4 hover:bg-bg-secondary/30 transition-colors group"
                                key={user._id}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <UserProfilePicture
                                        className="w-10 h-10 rounded-full ring-2 ring-border-subtle"
                                        src={user.profilePicture}
                                        username={user.username}
                                    />
                                    <div className="flex flex-col truncate">
                                        <span className="font-bold truncate text-foreground">
                                            {user.displayName || user.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            @{user.username}
                                        </span>
                                    </div>
                                    {user.permissions.adminAccess && (
                                        <ShieldAlert
                                            className="text-danger shrink-0 ml-1"
                                            size={14}
                                        />
                                    )}
                                </div>

                                <div>
                                    <div
                                        className={cn(
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                                            user.permissions.adminAccess
                                                ? 'bg-danger/10 text-danger'
                                                : Object.values(
                                                        user.permissions,
                                                    ).some((v) => v)
                                                  ? 'bg-caution/10 text-caution'
                                                  : 'bg-bg-secondary text-muted-foreground',
                                        )}
                                    >
                                        {user.permissions.adminAccess
                                            ? 'Super Admin'
                                            : Object.values(
                                                    user.permissions,
                                                ).some((v) => v)
                                              ? 'Staff'
                                              : 'User'}
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {new Date(
                                        user.createdAt,
                                    ).toLocaleDateString()}
                                </div>

                                <div className="flex justify-end gap-1">
                                    <Button
                                        className="opacity-0 group-hover:opacity-100"
                                        size="sm"
                                        title="View Full Details"
                                        variant="ghost"
                                        onClick={() => onViewUser(user._id)}
                                    >
                                        <Eye size={16} />
                                    </Button>
                                    <Button
                                        className="opacity-0 group-hover:opacity-100"
                                        size="sm"
                                        title="Edit Permissions"
                                        variant="ghost"
                                        onClick={() => setEditingUser(user)}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <UserIcon className="mb-4 opacity-20" size={48} />
                            <Text as="p" weight="medium">
                                No users found
                            </Text>
                            <Text as="p" className="opacity-60" size="sm">
                                Try searching for a different username
                            </Text>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {!isLoading && users && (users.length > 0 || page > 0) && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-bg-subtle rounded-b-2xl">
                    <Button
                        disabled={page === 0}
                        variant="ghost"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Page {page + 1}
                    </span>
                    <Button
                        disabled={users.length < LIMIT}
                        variant="ghost"
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                        <ChevronRight size={16} />
                    </Button>
                </div>
            )}

            {/* Permission Editor Modal */}
            {editingUser && (
                <PermissionEditor
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                />
            )}
        </div>
    );
};
