import React from 'react';

import { createPortal } from 'react-dom';

import { Modal } from '@/ui/components/common/Modal';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';

const EmojiPicker = React.lazy(() =>
    import('@/ui/components/emoji/EmojiPicker').then((m) => ({
        default: m.EmojiPicker,
    })),
);

interface MessageEmojiPickerProps {
    isOpen: boolean;
    isMobile: boolean;
    coords: { x: number; y: number };
    pickerRef: React.RefObject<HTMLDivElement | null>;
    customCategories?: CustomEmojiCategory[];

    onSelect: (emoji: string) => void;
    onCustomSelect: (emoji: { id: string; name: string }) => void;
    onClose: () => void;
}

export const MessageEmojiPicker = React.memo(
    ({
        isOpen,
        isMobile,
        coords,
        pickerRef,
        customCategories,
        onSelect,
        onCustomSelect,
        onClose,
    }: MessageEmojiPickerProps) => {
        if (!isOpen) return null;

        if (isMobile) {
            return (
                <Modal
                    fullScreen
                    noPadding
                    isOpen={isOpen}
                    title="Add Reaction"
                    onClose={onClose}
                >
                    <React.Suspense
                        fallback={
                            <div className="flex h-full items-center justify-center p-4">
                                Loading emojis...
                            </div>
                        }
                    >
                        <EmojiPicker
                            className="h-full !max-h-none w-full !max-w-none rounded-none border-none shadow-none"
                            customCategories={customCategories}
                            onCustomEmojiSelect={onCustomSelect}
                            onEmojiSelect={onSelect}
                        />
                    </React.Suspense>
                </Modal>
            );
        }

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
