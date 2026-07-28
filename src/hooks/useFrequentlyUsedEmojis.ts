import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
    frequentlyUsedEmojisKeys,
    useFrequentlyUsedEmojisQuery,
    useUpdateFrequentlyUsedEmojis,
} from '@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.queries';
import type { FrequentlyUsedEmojiEntry } from '@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.types';
import { useAllServerEmojis } from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';
import { emojiMap } from '@/utils/emoji';
import {
    type EmojiUsageInput,
    QUICK_REACTION_COUNT,
    recordEmojiUsage,
    sortByFrequency,
} from '@/utils/frequentlyUsedEmojis';

export interface QuickReactionEmoji {
    key: string;
    emoji: string;
    emojiType: 'unicode' | 'custom';
    emojiId?: string;
    name?: string;
    imageUrl?: string;
}

interface UseFrequentlyUsedEmojisResult {
    quickReactions: QuickReactionEmoji[];
    frequentlyUsedCategory: CustomEmojiCategory | null;
    recordUsage: (used: EmojiUsageInput) => void;
}

const PERSIST_DEBOUNCE_MS = 1500;
const FREQUENTLY_USED_CATEGORY_ID = '__frequently_used__';

export const useFrequentlyUsedEmojis = (): UseFrequentlyUsedEmojisResult => {
    const { data: me } = useMe();
    const queryClient = useQueryClient();
    const { data: entries } = useFrequentlyUsedEmojisQuery();
    const { data: allEmojis } = useAllServerEmojis({ enabled: !!me });
    const { mutate: persist } = useUpdateFrequentlyUsedEmojis();

    const persistTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    React.useEffect(
        () => (): void => {
            if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
        },
        [],
    );

    const recordUsage = React.useCallback(
        (used: EmojiUsageInput): void => {
            if (!me) return;

            const current =
                queryClient.getQueryData<FrequentlyUsedEmojiEntry[]>(
                    frequentlyUsedEmojisKeys.all,
                ) ?? [];
            const next = recordEmojiUsage(current, used);
            queryClient.setQueryData(frequentlyUsedEmojisKeys.all, next);

            if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
            persistTimerRef.current = setTimeout((): void => {
                const latest =
                    queryClient.getQueryData<FrequentlyUsedEmojiEntry[]>(
                        frequentlyUsedEmojisKeys.all,
                    ) ?? [];
                persist(latest);
            }, PERSIST_DEBOUNCE_MS);
        },
        [me, queryClient, persist],
    );

    const customEmojiById = React.useMemo(() => {
        const map = new Map<string, { name: string; url: string }>();
        for (const e of allEmojis ?? []) {
            map.set(e.id, { name: e.name, url: e.imageUrl });
        }
        return map;
    }, [allEmojis]);

    const resolved = React.useMemo((): QuickReactionEmoji[] => {
        const out: QuickReactionEmoji[] = [];
        for (const e of sortByFrequency(entries ?? [])) {
            if (e.emojiType === 'unicode') {
                out.push({
                    key: `unicode:${e.emoji}`,
                    emoji: e.emoji,
                    emojiType: 'unicode',
                });
                continue;
            }

            const custom = e.emojiId
                ? customEmojiById.get(e.emojiId)
                : undefined;
            if (!custom) continue;

            out.push({
                key: `custom:${e.emojiId}`,
                emoji: e.emoji,
                emojiType: 'custom',
                emojiId: e.emojiId,
                name: custom.name,
                imageUrl: custom.url,
            });
        }
        return out;
    }, [entries, customEmojiById]);

    const quickReactions = React.useMemo(
        () => resolved.slice(0, QUICK_REACTION_COUNT),
        [resolved],
    );

    const frequentlyUsedCategory = React.useMemo(():
        | CustomEmojiCategory
        | null => {
        if (resolved.length === 0) return null;

        const emojis = resolved
            .map((e) =>
                e.emojiType === 'unicode'
                    ? emojiMap.get(e.emoji)
                    : { id: e.emojiId as string, name: e.name as string, url: e.imageUrl as string },
            )
            .filter(
                (e): e is NonNullable<typeof e> => e !== undefined,
            );

        if (emojis.length === 0) return null;

        return {
            id: FREQUENTLY_USED_CATEGORY_ID,
            name: 'Frequently Used',
            emojis,
        };
    }, [resolved]);

    return { quickReactions, frequentlyUsedCategory, recordUsage };
};
