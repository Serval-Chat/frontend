import React from 'react';

import { createPortal } from 'react-dom';

import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';

const EmojiPicker = React.lazy(() =>
    import('@/ui/components/emoji/EmojiPicker').then((m) => ({
        default: m.EmojiPicker,
    })),
);

interface MessageEmojiPickerProps {
    isOpen: boolean;
    coords: { x: number; y: number };
    pickerRef: React.RefObject<HTMLDivElement | null>;
    customCategories?: CustomEmojiCategory[];
    hasExternalEmojiPermission?: boolean;

    onSelect: (emoji: string) => void;
    onCustomSelect: (emoji: { id: string; name: string }) => void;
    onClose: () => void;
}

export const MessageEmojiPicker = React.memo(
    ({
        isOpen,
        coords,
        pickerRef,
        customCategories,
        hasExternalEmojiPermission,
        onSelect,
        onCustomSelect,
        onClose,
    }: MessageEmojiPickerProps) => {
        if (!isOpen) return null;

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
                <React.Suspense
                    fallback={
                        <div className="flex h-[400px] w-[320px] items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-muted-foreground shadow-xl">
                            Loading emojis...
                        </div>
                    }
                >
                    <EmojiPicker
                        customCategories={customCategories}
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
