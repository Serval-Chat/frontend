import { useCallback, useState } from 'react';

import { type UseEmojiInfoReturn, useEmojiInfo } from './useEmojiInfo';

interface EmojiData {
    id: string;
    name: string;
    url: string;
    serverId?: string;
}

interface UseEmojiInfoBoxReturn {
    selectedEmoji: EmojiData | null;
    infoBoxPosition: { x: number; y: number } | null;
    emojiInfo: UseEmojiInfoReturn['emoji'];
    server: UseEmojiInfoReturn['server'];
    showEmojiInfo: (emoji: EmojiData, event: React.MouseEvent) => void;
    closeInfoBox: () => void;
}

export const useEmojiInfoBox = (): UseEmojiInfoBoxReturn => {
    const [selectedEmoji, setSelectedEmoji] = useState<EmojiData | null>(null);
    const [infoBoxPosition, setInfoBoxPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const { emoji: emojiInfo, server: serverInfo } = useEmojiInfo({
        emojiId: selectedEmoji?.id,
        serverId: selectedEmoji?.serverId,
        enabled: !!selectedEmoji,
    });

    const showEmojiInfo = useCallback(
        (emoji: EmojiData, event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const rect = (
                event.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const x = rect.left + rect.width / 2 - 128;
            const y = rect.bottom + 8;

            setSelectedEmoji({
                id: emoji.id,
                name: emoji.name,
                url: emoji.url,
                serverId: emoji.serverId,
            });
            setInfoBoxPosition({ x, y });
        },
        [],
    );

    const closeInfoBox = useCallback(() => {
        setSelectedEmoji(null);
        setInfoBoxPosition(null);
    }, []);

    return {
        selectedEmoji,
        infoBoxPosition,
        emojiInfo,
        server: serverInfo,
        showEmojiInfo,
        closeInfoBox,
    };
};
