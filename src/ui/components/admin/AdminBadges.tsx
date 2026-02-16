import { type ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Edit2, Plus, Trash2 } from 'lucide-react';

import type { Badge } from '@/api/users/users.types';
import {
    useAdminBadges,
    useCreateAdminBadge,
    useDeleteAdminBadge,
    useUpdateAdminBadge,
} from '@/hooks/admin/useAdminBadges';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
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
import { ICON_MAP } from '@/ui/utils/iconMap';

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Text
                            as="label"
                            className="block text-xs font-bold uppercase text-muted-foreground tracking-wider"
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
                            className="block text-xs font-bold uppercase text-muted-foreground tracking-wider"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Text
                            as="label"
                            className="block text-xs font-bold uppercase text-muted-foreground tracking-wider"
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
                            className="block text-xs font-bold uppercase text-muted-foreground tracking-wider"
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
                        className="block text-xs font-bold uppercase text-muted-foreground tracking-wider"
                    >
                        Description
                    </Text>
                    <TextArea
                        placeholder="Shown on hover"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                    <TableRow className="bg-bg-secondary/50 border-b border-border-subtle">
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
        </div>
    );
};
