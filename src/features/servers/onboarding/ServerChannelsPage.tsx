import { useMemo, useState } from 'react';

import { EyeOff, Hash } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useOnboarding,
    useUpdateChannelPreferences,
} from '@/api/servers/servers.queries';
import { ServerSubpageLayout } from '@/features/servers/ServerSubpageLayout';
import { LoadingSpinner } from '@/ui/primitives/LoadingSpinner';
import { Pressable } from '@/ui/primitives/Pressable';
import { SettingsFloatingBar } from '@/ui/primitives/SettingsFloatingBar';
import { Text } from '@/ui/primitives/Text';

import { ChannelPreferenceGroup } from './ServerOnboardingModals';

const sortByPosition = <T extends { position: number }>(items: T[]): T[] =>
    [...items].sort((a, b): number => a.position - b.position);

export const ServerChannelsPage = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    const { data: onboarding } = useOnboarding(serverId ?? '');
    const { data: channels } = useChannels(serverId ?? '');
    const { data: categories } = useCategories(serverId ?? '');
    const updatePreferences = useUpdateChannelPreferences(serverId ?? '');

    const [hiddenChannelIds, setHiddenChannelIds] = useState<string[]>([]);
    const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [syncedOnboarding, setSyncedOnboarding] = useState(onboarding);

    if (onboarding !== syncedOnboarding) {
        setSyncedOnboarding(onboarding);
        if (onboarding) {
            setHiddenChannelIds(onboarding.member.hiddenChannelIds ?? []);
            setHiddenCategoryIds(onboarding.member.hiddenCategoryIds ?? []);
        }
    }

    const hiddenChannels = new Set(hiddenChannelIds);
    const hiddenCategories = new Set(hiddenCategoryIds);

    const groupedChannels = useMemo(() => {
        const sortedChannels = sortByPosition(channels ?? []);
        const sortedCategories = sortByPosition(categories ?? []);
        const categoryIds = new Set(sortedCategories.map((c): string => c.id));
        return [
            {
                category: null,
                channels: sortedChannels.filter(
                    (channel): boolean =>
                        !channel.categoryId ||
                        !categoryIds.has(channel.categoryId),
                ),
            },
            ...sortedCategories.map((category) => ({
                category,
                channels: sortedChannels.filter(
                    (channel): boolean => channel.categoryId === category.id,
                ),
            })),
        ].filter(
            (group): number | true =>
                group.category !== null || group.channels.length,
        );
    }, [channels, categories]);

    const handleSave = (): void => {
        if (!serverId) return;
        updatePreferences.mutate(
            { hiddenCategoryIds, hiddenChannelIds },
            {
                onSuccess: (): void => {
                    setHasUnsavedChanges(false);
                },
            },
        );
    };

    const handleToggleChannel = (channelId: string): void => {
        setHasUnsavedChanges(true);
        setHiddenChannelIds((prev): string[] =>
            prev.includes(channelId)
                ? prev.filter((id): boolean => id !== channelId)
                : [...prev, channelId],
        );
    };

    const handleToggleCategory = (categoryId: string): void => {
        setHasUnsavedChanges(true);
        setHiddenCategoryIds((prev): string[] =>
            prev.includes(categoryId)
                ? prev.filter((id): boolean => id !== categoryId)
                : [...prev, categoryId],
        );
    };

    const handleBack = (): void => {
        void navigate(`/chat/@server/${serverId}`);
    };

    if (!serverId) return null;

    return (
        <ServerSubpageLayout
            footer={
                <SettingsFloatingBar
                    containerClassName="pride-glass-input"
                    isPending={updatePreferences.isPending}
                    isVisible={hasUnsavedChanges}
                    offset="0px"
                    onReset={(): void => {
                        if (onboarding) {
                            setHiddenChannelIds(
                                onboarding.member.hiddenChannelIds ?? [],
                            );
                            setHiddenCategoryIds(
                                onboarding.member.hiddenCategoryIds ?? [],
                            );
                        }
                        setHasUnsavedChanges(false);
                    }}
                    onSave={handleSave}
                />
            }
            reserveFooterSpace={hasUnsavedChanges}
        >
            {!onboarding || !channels || !categories ? (
                <div className="flex min-h-40 items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="max-w-3xl space-y-6">
                    <Pressable
                        aria-label="Back to server"
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                        onClick={handleBack}
                    >
                        ← Back
                    </Pressable>
                    <div className="flex items-center gap-3">
                        <Hash className="h-6 w-6 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <Text
                                className="leading-6"
                                size="xl"
                                variant="default"
                                weight="semibold"
                            >
                                Channels &amp; Categories
                            </Text>
                            <Text size="sm" variant="muted">
                                Configure which channels you want to see.
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <EyeOff className="h-3.5 w-3.5 shrink-0" />
                        <Text>
                            Click a channel or category to hide it from your
                            sidebar.
                        </Text>
                    </div>
                    <div className="space-y-3">
                        {groupedChannels.map((group) => (
                            <ChannelPreferenceGroup
                                category={group.category}
                                channels={group.channels}
                                hiddenCategories={hiddenCategories}
                                hiddenChannels={hiddenChannels}
                                key={group.category?.id ?? 'uncategorized'}
                                onToggleCategory={handleToggleCategory}
                                onToggleChannel={handleToggleChannel}
                            />
                        ))}
                    </div>
                </div>
            )}
        </ServerSubpageLayout>
    );
};
