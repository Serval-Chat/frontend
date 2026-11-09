import { useMemo, useState } from 'react';

import { Plus, XCircle } from 'lucide-react';

import type { Badge } from '@/api/users/users.types';
import {
    useAdminBadges,
    useAssignBadgeToUser,
    useRemoveBadgeFromUser,
} from '@/features/admin/hooks/useAdminBadges';
import { UserBadge } from '@/features/users/UserBadge';
import { Button } from '@/ui/primitives/Button';
import { DropdownWithSearch } from '@/ui/primitives/DropdownWithSearch';
import { Heading } from '@/ui/primitives/Heading';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { useToast } from '@/ui/primitives/Toast';

interface AdminBadgesManagementProps {
    userId: string;
    badges: (string | Badge)[];
}

export const AdminBadgesManagement = ({
    userId,
    badges,
}: AdminBadgesManagementProps): React.ReactNode => {
    const { showToast } = useToast();
    const { data: allBadges } = useAdminBadges();
    const { mutate: assignBadge, isPending: isAssigning } =
        useAssignBadgeToUser();
    const { mutate: removeBadge, isPending: isRemoving } =
        useRemoveBadgeFromUser();

    const [isAddingBadge, setIsAddingBadge] = useState(false);

    const availableBadges = useMemo(() => {
        if (!allBadges) return [];
        return allBadges.filter(
            (b): boolean =>
                !badges.some((ub: Badge | string): boolean => {
                    if (typeof ub === 'string') return ub === b.id;
                    return ub.id === b.id;
                }),
        );
    }, [allBadges, badges]);

    const badgeOptions = useMemo(
        () =>
            availableBadges.map((b) => ({
                id: b.id,
                label: b.name,
                description: b.description,
                icon: <UserBadge badge={b} />,
            })),
        [availableBadges],
    );

    const handleAssignBadge = (badgeId: string | null): void => {
        if (!badgeId) return;
        assignBadge(
            { userId, badgeId },
            {
                onSuccess: (): void => {
                    showToast('Badge assigned', 'success');
                    setIsAddingBadge(false);
                },
                onError: (e): void => {
                    showToast(e.message || 'Failed to assign badge', 'error');
                },
            },
        );
    };

    const handleRemoveBadge = (badgeId: string): void => {
        if (!globalThis.confirm(`Remove badge ${badgeId} from user?`)) return;

        removeBadge(
            { userId, badgeId },
            {
                onSuccess: (): void => {
                    showToast('Badge removed', 'success');
                },
                onError: (e): void => {
                    showToast(e.message || 'Failed to remove badge', 'error');
                },
            },
        );
    };

    return (
        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
            <div className="mb-4 flex items-center justify-between">
                <Heading level={3} variant="admin-sub">
                    Badges Management
                </Heading>
                <Button
                    aria-label="Add badge"
                    size="sm"
                    variant="ghost"
                    onClick={(): void => {
                        setIsAddingBadge(!isAddingBadge);
                    }}
                >
                    <Plus size={16} />
                </Button>
            </div>

            {isAddingBadge ? (
                <div className="animate-in slide-in-from-top-2 mb-4 space-y-2 rounded-xl border border-border-subtle bg-bg-secondary/50 p-4">
                    <DropdownWithSearch
                        label="Select badge to assign"
                        options={badgeOptions}
                        placeholder={
                            isAssigning ? 'Assigning...' : 'Choose a badge...'
                        }
                        searchPlaceholder="Search available badges..."
                        value={null}
                        onChange={handleAssignBadge}
                    />
                    <div className="mt-2 flex justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(): void => {
                                setIsAddingBadge(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
                {badges && badges.length > 0 ? (
                    (badges as unknown as Badge[]).map((badge: Badge) => (
                        <div
                            className="group relative inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-secondary/50 px-3 py-2 transition hover:border-danger/30 hover:bg-danger/5"
                            key={badge.id}
                        >
                            <UserBadge badge={badge} />
                            <div className="flex flex-col">
                                <Text as="span" size="xs" weight="bold">
                                    {badge.name}
                                </Text>
                                <Text
                                    as="span"
                                    className="text-[9px]"
                                    variant="muted"
                                >
                                    ID: {badge.id}
                                </Text>
                            </div>
                            <Pressable
                                className="absolute -top-1.5 -right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-sm transition-transform group-hover:flex hover:scale-110"
                                disabled={isRemoving}
                                title="Remove badge"
                                onClick={(): void => {
                                    handleRemoveBadge(badge.id);
                                }}
                            >
                                <XCircle size={12} />
                            </Pressable>
                        </div>
                    ))
                ) : (
                    <Text
                        as="p"
                        className="w-full text-center"
                        size="xs"
                        variant="muted"
                    >
                        No badges assigned
                    </Text>
                )}
            </div>
        </div>
    );
};
