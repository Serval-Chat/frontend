import React, { useCallback, useRef } from 'react';

import { $getRoot, $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';
import { useClickAway } from 'react-use';

import type { CustomEmojiCategory } from '@/api/emojis/emojis.types';
import type { StickerCategory } from '@/api/stickers/stickers.types';
import { $createChipNode } from '@/ui/components/chat/lexical/ChipNode';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { StickerPicker } from '@/ui/components/emoji/StickerPicker';
import { Box } from '@/ui/components/layout/Box';

interface MessageComposerPickersProps {
    editor: LexicalEditor | null;
    showEmojiPicker: boolean;
    showStickerPicker: boolean;
    customCategories: CustomEmojiCategory[];
    stickerCategories: StickerCategory[];
    sendMessage: (text: string, replyToId?: string, stickerId?: string) => void;
    onClickAway: () => void;
    onStickerSelected: () => void;
}

export const MessageComposerPickers = ({
    editor,
    showEmojiPicker,
    showStickerPicker,
    customCategories,
    stickerCategories,
    sendMessage,
    onClickAway,
    onStickerSelected,
}: MessageComposerPickersProps): React.ReactNode => {
    const pickerRef = useRef<HTMLDivElement>(null);

    useClickAway(pickerRef, onClickAway);

    const handleCustomEmojiSelect = useCallback(
        (emoji: { id: string; name: string; url: string }): void => {
            editor?.update((): void => {
                let selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    selection = $getRoot().selectEnd();
                }
                if ($isRangeSelection(selection)) {
                    const chip = $createChipNode('emoji', {
                        id: emoji.id,
                        label: emoji.name,
                        imageUrl: emoji.url,
                    });
                    selection.insertNodes([chip]);
                }
            });
            editor?.focus();
        },
        [editor],
    );

    const handleEmojiSelect = useCallback(
        (emoji: string): void => {
            editor?.update((): void => {
                let selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    selection = $getRoot().selectEnd();
                }
                if ($isRangeSelection(selection)) {
                    selection.insertNodes([
                        $createChipNode('unicode-emoji', { id: emoji }),
                    ]);
                }
            });
            editor?.focus();
        },
        [editor],
    );

    const handleStickerSelect = useCallback(
        (sticker: { id: string }): void => {
            sendMessage('', undefined, sticker.id);
            onStickerSelected();
        },
        [sendMessage, onStickerSelected],
    );

    if (!showEmojiPicker && !showStickerPicker) return null;

    return (
        <div
            className="absolute right-0 bottom-full z-[var(--z-index-popover)] mb-2"
            ref={pickerRef}
        >
            {showEmojiPicker ? (
                <React.Suspense
                    fallback={
                        <div className="flex h-[400px] w-[320px] items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-muted-foreground shadow-xl">
                            Loading emojis...
                        </div>
                    }
                >
                    <EmojiPicker
                        customCategories={customCategories}
                        onCustomEmojiSelect={handleCustomEmojiSelect}
                        onEmojiSelect={handleEmojiSelect}
                    />
                </React.Suspense>
            ) : null}

            {showStickerPicker ? (
                <React.Suspense
                    fallback={
                        <div className="flex h-[420px] w-[350px] items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-muted-foreground shadow-xl">
                            Loading stickers...
                        </div>
                    }
                >
                    <StickerPicker
                        categories={stickerCategories}
                        onStickerSelect={handleStickerSelect}
                    />
                </React.Suspense>
            ) : null}
        </div>
    );
};
