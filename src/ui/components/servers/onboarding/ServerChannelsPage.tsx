import React, { useMemo, useState } from 'react';

import { Hash } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useOnboarding,
    useUpdateChannelPreferences,
} from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

import { ChannelPreferenceGroup } from './ServerOnboardingModals';

const sortByPosition = <T extends { position: number }>(items: T[]): T[] =>
    [...items].sort((a, b) => a.position - b.position);

export const ServerChannelsPage: React.FC = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    const { data: onboarding } = useOnboarding(serverId ?? '');
    const { data: channels } = useChannels(serverId ?? '');
    const { data: categories } = useCategories(serverId ?? '');
    const updatePreferences = useUpdateChannelPreferences(serverId ?? '');

    const [hiddenChannelIds, setHiddenChannelIds] = useState<string[]>([]);
    const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    React.useEffect(() => {
        if (!onboarding) return;
        setHiddenChannelIds(onboarding.member.hiddenChannelIds ?? []);
        setHiddenCategoryIds(onboarding.member.hiddenCategoryIds ?? []);
    }, [onboarding]);

    const hiddenChannels = new Set(hiddenChannelIds);
    const hiddenCategories = new Set(hiddenCategoryIds);

    const groupedChannels = useMemo(() => {
        const sortedChannels = sortByPosition(channels ?? []);
        const sortedCategories = sortByPosition(categories ?? []);
        const categoryIds = new Set(sortedCategories.map((c) => c._id));
        return [
            {
                category: null,
                channels: sortedChannels.filter(
                    (channel) =>
                        !channel.categoryId ||
                        !categoryIds.has(channel.categoryId),
                ),
            },
            ...sortedCategories.map((category) => ({
                category,
                channels: sortedChannels.filter(
                    (channel) => channel.categoryId === category._id,
                ),
            })),
        ].filter((group) => group.category !== null || group.channels.length);
    }, [channels, categories]);

    const handleSave = (): void => {
        if (!serverId) return;
        updatePreferences.mutate(
            { hiddenCategoryIds, hiddenChannelIds },
            { onSuccess: () => setHasUnsavedChanges(false) },
        );
    };

    const handleToggleChannel = (channelId: string): void => {
        setHasUnsavedChanges(true);
        setHiddenChannelIds((prev) =>
            prev.includes(channelId)
                ? prev.filter((id) => id !== channelId)
                : [...prev, channelId],
        );
    };

    const handleToggleCategory = (categoryId: string): void => {
        setHasUnsavedChanges(true);
        setHiddenCategoryIds((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId],
        );
    };

    const handleBack = (): void => {
        void navigate(`/chat/@server/${serverId}`);
    };

    if (!serverId) return null;

    return (
        <Box className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--chat-bg)]">
            {/* Header */}
            <Box
                as="header"
                className="z-50 flex shrink-0 items-center gap-3 border-b border-white/5 bg-[var(--bg-chat-header)] px-4 py-3 backdrop-blur-sm"
            >
                <button
                    aria-label="Back to server"
                    className="p-1 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                    onClick={handleBack}
                >
                    ←
                </button>
                <Hash className="h-5 w-5 shrink-0 text-muted-foreground" />
                <Box className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] leading-5 font-semibold text-foreground">
                        Channels &amp; Categories
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                        Configure which channels you want to see.
                    </span>
                </Box>
            </Box>

            <Box className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-10">
                {!onboarding || !channels || !categories ? (
                    <div className="flex min-h-40 items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-3 pb-24">
                        {groupedChannels.map((group) => (
                            <ChannelPreferenceGroup
                                category={group.category}
                                channels={group.channels}
                                hiddenCategories={hiddenCategories}
                                hiddenChannels={hiddenChannels}
                                key={group.category?._id ?? 'uncategorized'}
                                onToggleCategory={handleToggleCategory}
                                onToggleChannel={handleToggleChannel}
                            />
                        ))}
                    </div>
                )}
            </Box>

            {hasUnsavedChanges && (
                <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border-subtle bg-bg-secondary/90 px-6 py-4 whitespace-nowrap shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <Text className="text-sm font-medium">
                            Careful — you have unsaved changes!
                        </Text>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (onboarding) {
                                        setHiddenChannelIds(
                                            onboarding.member
                                                .hiddenChannelIds ?? [],
                                        );
                                        setHiddenCategoryIds(
                                            onboarding.member
                                                .hiddenCategoryIds ?? [],
                                        );
                                    }
                                    setHasUnsavedChanges(false);
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                loading={updatePreferences.isPending}
                                variant="primary"
                                onClick={handleSave}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
};
