import { type ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Check, Edit2, Plus, Search, Trash2, UserPlus } from 'lucide-react';

import type { Badge, User } from '@/api/users/users.types';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminBadges,
    useAssignBadgeToUser,
    useCreateAdminBadge,
    useDeleteAdminBadge,
    useUpdateAdminBadge,
} from '@/hooks/admin/useAdminBadges';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui/components/common/Table';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { useToast } from '@/ui/components/common/Toast';
import { UserBadge } from '@/ui/components/common/UserBadge';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { Stack } from '@/ui/components/layout/Stack';
import { ICON_MAP } from '@/ui/utils/iconMap';

const AssignBadgeModal = ({
    badge,
    onClose,
}: {
    badge: Badge;
    onClose: () => void;
}): ReactNode => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, ADMIN_CONSTANTS.SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: users, isLoading } = useAdminUsers(debouncedSearch, 0, 10);
    const { mutate: assignBadge, isPending } = useAssignBadgeToUser();

    const handleAssign = (userId: string): void => {
        assignBadge(
            { userId, badgeId: badge.id },
            {
                onSuccess: () => {
                    showToast('Badge assigned successfully', 'success');
                },
                onError: (e) => {
                    showToast(e.message || 'Failed to assign badge', 'error');
                },
            },
        );
    };

    return (
        <Modal isOpen title={`Assign Badge: ${badge.name}`} onClose={onClose}>
            <Stack gap="lg">
                <Box className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-subtle p-5">
                    <UserBadge badge={badge} />
                    <Stack gap="xs">
                        <Text as="span" size="lg" weight="black">
                            {badge.name}
                        </Text>
                        <Text
                            as="span"
                            className="font-mono text-[10px] uppercase opacity-50"
                        >
                            {badge.id}
                        </Text>
                    </Stack>
                </Box>

                <Box className="relative">
                    <Search
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground/50"
                        size={18}
                    />
                    <Input
                        className="pl-12"
                        placeholder="Search for a user..."
                        size="admin"
                        value={searchTerm}
                        variant="admin"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>

                <Box className="custom-scrollbar max-h-[400px] min-h-[160px] overflow-y-auto pr-1">
                    <Stack gap="sm">
                        {isLoading ? (
                            <Box className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                                <Text size="xs">Scanning user database...</Text>
                            </Box>
                        ) : users && users.length > 0 ? (
                            users.map((user) => (
                                <Box
                                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-secondary/20 p-4 transition-all hover:bg-bg-secondary/40"
                                    key={user._id}
                                >
                                    <Box className="flex items-center gap-4 overflow-hidden">
                                        <UserProfilePicture
                                            size="sm"
                                            src={user.profilePicture}
                                            username={user.username}
                                        />
                                        <Stack
                                            className="overflow-hidden"
                                            gap="none"
                                        >
                                            <StyledUserName
                                                className="text-sm font-bold"
                                                user={
                                                    {
                                                        ...user,
                                                        profilePicture:
                                                            user.profilePicture ||
                                                            undefined,
                                                    } as unknown as User
                                                }
                                            >
                                                {user.displayName ||
                                                    user.username}
                                            </StyledUserName>
                                            <Text
                                                as="span"
                                                className="opacity-50"
                                                size="xs"
                                            >
                                                @{user.username}
                                            </Text>
                                        </Stack>
                                    </Box>
                                    <Button
                                        disabled={
                                            isPending ||
                                            (user.badges &&
                                                user.badges.includes(badge.id))
                                        }
                                        size="sm"
                                        variant={
                                            user.badges &&
                                            user.badges.includes(badge.id)
                                                ? 'ghost'
                                                : 'primary'
                                        }
                                        onClick={() => handleAssign(user._id)}
                                    >
                                        {user.badges &&
                                        user.badges.includes(badge.id) ? (
                                            <>
                                                <Check size={14} /> Assigned
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={14} /> Assign
                                            </>
                                        )}
                                    </Button>
                                </Box>
                            ))
                        ) : (
                            <Box className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                                <Text size="xs">
                                    {searchTerm
                                        ? 'No matching users identified'
                                        : 'Awaiting search query...'}
                                </Text>
                            </Box>
                        )}
                    </Stack>
                </Box>

                <Box className="flex justify-end border-t border-border-subtle pt-4">
                    <Button variant="ghost" onClick={onClose}>
                        Return
                    </Button>
                </Box>
            </Stack>
        </Modal>
    );
};

const BadgeEditor = ({
    badge,
    onClose,
}: {
    badge: Badge | null;
    onClose: () => void;
}): ReactNode => {
    const isEdit = !!badge;
    const { showToast } = useToast();

    const [id, setId] = useState(badge?.id ?? '');
    const [name, setName] = useState(badge?.name ?? '');
    const [description, setDescription] = useState(badge?.description ?? '');
    const [icon, setIcon] = useState(badge?.icon ?? 'shield');
    const [color, setColor] = useState(badge?.color ?? '#3b82f6');

    const { mutate: createBadge, isPending: isCreating } =
        useCreateAdminBadge();
    const { mutate: updateBadge, isPending: isUpdating } =
        useUpdateAdminBadge();

    const isPending = isCreating || isUpdating;

    const iconOptions = useMemo(
        () =>
            Object.keys(ICON_MAP)
                .sort()
                .map((key) => {
                    const IconComponent = ICON_MAP[key];
                    return {
                        id: key,
                        label: key,
                        icon: (
                            <IconComponent
                                className="text-muted-foreground"
                                size={16}
                            />
                        ),
                    };
                }),
        [],
    );

    const selectedIcon = icon && ICON_MAP[icon] ? icon : null;

    const previewBadge: Badge = useMemo(
        () => ({
            _id: badge?._id ?? 'preview',
            id: id || 'id',
            name: name || 'Name',
            description: description || '',
            icon: icon || 'shield',
            color: color || '#3b82f6',
            createdAt: badge?.createdAt ?? new Date().toISOString(),
        }),
        [badge?._id, badge?.createdAt, color, description, icon, id, name],
    );

    const handleSave = (): void => {
        if (!name.trim() || !description.trim() || !icon.trim()) {
            showToast('name, description, and icon are required', 'error');
            return;
        }

        if (!isEdit && !id.trim()) {
            showToast('id is required', 'error');
            return;
        }

        if (isEdit) {
            updateBadge(
                {
                    badgeId: badge!.id,
                    patch: {
                        name,
                        description,
                        icon,
                        color,
                    },
                },
                {
                    onSuccess: () => {
                        showToast('Badge updated', 'success');
                        onClose();
                    },
                    onError: (e) => {
                        showToast(
                            e.message || 'Failed to update badge',
                            'error',
                        );
                    },
                },
            );
            return;
        }

        createBadge(
            {
                id,
                name,
                description,
                icon,
                color,
            },
            {
                onSuccess: () => {
                    showToast('Badge created', 'success');
                    onClose();
                },
                onError: (e) => {
                    showToast(e.message || 'Failed to create badge', 'error');
                },
            },
        );
    };

    return (
        <Modal
            isOpen
            title={isEdit ? `Edit Badge: ${badge!.id}` : 'Create Badge'}
            onClose={onClose}
        >
            <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-bg-subtle p-4">
                    <div className="space-y-1">
                        <Text as="p" weight="bold">
                            Preview
                        </Text>
                        <UserBadge badge={previewBadge} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Text
                            as="label"
                            className="block text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        >
                            ID
                        </Text>
                        <Input
                            disabled={isEdit}
                            placeholder="bug_hunter"
                            size="admin"
                            value={id}
                            variant="admin"
                            onChange={(e) => setId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Text
                            as="label"
                            className="block text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        >
                            Name
                        </Text>
                        <Input
                            placeholder="Bug Hunter"
                            size="admin"
                            value={name}
                            variant="admin"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Text
                            as="label"
                            className="block text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        >
                            Icon
                        </Text>
                        <DropdownWithSearch
                            options={iconOptions}
                            placeholder="Select icon"
                            searchPlaceholder="Search icons..."
                            value={selectedIcon}
                            onChange={(value) => setIcon(value ?? '')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Text
                            as="label"
                            className="block text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        >
                            Color
                        </Text>
                        <Input
                            placeholder="#3b82f6"
                            size="admin"
                            value={color}
                            variant="admin"
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Text
                        as="label"
                        className="block text-xs font-bold tracking-wider text-muted-foreground uppercase"
                    >
                        Description
                    </Text>
                    <TextArea
                        placeholder="Shown on hover"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={isPending}
                        loading={isPending}
                        variant="primary"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export const AdminBadges = (): ReactNode => {
    const { data: badges, isLoading, error } = useAdminBadges();
    const { mutate: deleteBadge, isPending: isDeleting } =
        useDeleteAdminBadge();
    const { showToast } = useToast();

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [assigningBadge, setAssigningBadge] = useState<Badge | null>(null);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Heading level={2} variant="admin-page">
                        Badges
                    </Heading>
                    <Text as="p" variant="muted">
                        Create, edit, and delete platform badges.
                    </Text>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        setEditingBadge(null);
                        setEditorOpen(true);
                    }}
                >
                    <Plus size={16} /> New badge
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Badge</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="py-10 text-muted-foreground">
                                    Loading badges...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : error ? (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="py-10 text-danger">
                                    {error.message}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : badges && badges.length > 0 ? (
                        badges.map((badgeItem) => (
                            <TableRow key={badgeItem.id}>
                                <TableCell>
                                    <UserBadge badge={badgeItem} />
                                </TableCell>
                                <TableCell monospace muted>
                                    {badgeItem.id}
                                </TableCell>
                                <TableCell muted>
                                    <span className="line-clamp-2">
                                        {badgeItem.description}
                                    </span>
                                </TableCell>
                                <TableCell align="right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            title="Assign badge to user"
                                            variant="ghost"
                                            onClick={() => {
                                                setAssigningBadge(badgeItem);
                                            }}
                                        >
                                            <UserPlus size={16} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            title="Edit badge"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingBadge(badgeItem);
                                                setEditorOpen(true);
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button
                                            disabled={isDeleting}
                                            size="sm"
                                            title="Delete badge"
                                            variant="ghost"
                                            onClick={() => {
                                                const confirmed =
                                                    window.confirm(
                                                        `Delete badge ${badgeItem.id}?`,
                                                    );
                                                if (!confirmed) return;

                                                deleteBadge(
                                                    { badgeId: badgeItem.id },
                                                    {
                                                        onSuccess: () =>
                                                            showToast(
                                                                'Badge deleted',
                                                                'success',
                                                            ),
                                                        onError: (e) =>
                                                            showToast(
                                                                e.message ||
                                                                    'Failed to delete badge',
                                                                'error',
                                                            ),
                                                    },
                                                );
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="py-12 text-muted-foreground">
                                    No badges yet.
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {editorOpen && (
                <BadgeEditor
                    badge={editingBadge}
                    onClose={() => setEditorOpen(false)}
                />
            )}

            {assigningBadge && (
                <AssignBadgeModal
                    badge={assigningBadge}
                    onClose={() => setAssigningBadge(null)}
                />
            )}
        </div>
    );
};
