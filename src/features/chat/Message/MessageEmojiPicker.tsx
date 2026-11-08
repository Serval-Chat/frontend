import React from 'react';

import { createPortal } from 'react-dom';

import { EmojiPickerSkeleton } from '@/features/emoji/EmojiPickerSkeleton';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useFrequentlyUsedEmojis } from '@/hooks/useFrequentlyUsedEmojis';
import { Box } from '@/ui/primitives/Box';

const EmojiPicker = React.lazy(() =>
    import('@/features/emoji/EmojiPicker').then((m) => ({
        default: m.EmojiPicker,
    })),
);

interface MessageEmojiPickerProps {
    coords: { x: number; y: number };
    pickerRef: React.RefObject<HTMLDivElement | null>;
    serverId?: string;
    channelId?: string;

    onSelect: (emoji: string) => void;
    onCustomSelect: (emoji: { id: string; name: string }) => void;
    onClose: () => void;
}

export const MessageEmojiPicker = React.memo(
    ({
        coords,
        pickerRef,
        serverId,
        channelId,
        onSelect,
        onCustomSelect,
        onClose,
    }: MessageEmojiPickerProps) => {
        const { customCategories, hasExternalEmojiPermission } =
            useCustomEmojis({ serverId, channelId });
        const { frequentlyUsedCategory } = useFrequentlyUsedEmojis();
        const pickerCategories = React.useMemo(
            () =>
                frequentlyUsedCategory
                    ? [...customCategories, frequentlyUsedCategory]
                    : customCategories,
            [customCategories, frequentlyUsedCategory],
        );

        return createPortal(
            <Box
                className="z-[var(--z-index-popover)]"
                ref={pickerRef}
                style={{
                    position: 'fixed',
                    left: coords.x,
                    top: coords.y,
                }}
            >
                <React.Suspense fallback={<EmojiPickerSkeleton />}>
                    <EmojiPicker
                        customCategories={pickerCategories}
                        hasExternalEmojiPermission={hasExternalEmojiPermission}
                        onClickAway={onClose}
                        onCustomEmojiSelect={onCustomSelect}
                        onEmojiSelect={onSelect}
                    />
                </React.Suspense>
            </Box>,
            document.body,
        );
    },
);

MessageEmojiPicker.displayName = 'MessageEmojiPicker';
