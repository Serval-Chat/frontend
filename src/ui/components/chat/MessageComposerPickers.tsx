import React, { useCallback, useMemo, useRef } from 'react';

import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    type LexicalEditor,
} from 'lexical';
import { useClickAway } from 'react-use';

import { useFrequentlyUsedEmojis } from '@/hooks/useFrequentlyUsedEmojis';
import { useIsMobile } from '@/hooks/useIsMobile';
import { $createChipNode } from '@/ui/components/chat/lexical/ChipNode';
import {
    type CustomEmojiCategory,
    EmojiPicker,
} from '@/ui/components/emoji/EmojiPicker';
import {
    type StickerCategory,
    StickerPicker,
} from '@/ui/components/emoji/StickerPicker';

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
    const isMobile = useIsMobile();
    const { frequentlyUsedCategory, recordUsage } = useFrequentlyUsedEmojis();
    const pickerCategories = useMemo(
        () =>
            frequentlyUsedCategory
                ? [...customCategories, frequentlyUsedCategory]
                : customCategories,
        [customCategories, frequentlyUsedCategory],
    );

    useClickAway(
        pickerRef,
        isMobile && showEmojiPicker ? (): void => {} : onClickAway,
    );

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
            if (!isMobile) editor?.focus();
            recordUsage({
                emoji: emoji.name,
                emojiType: 'custom',
                emojiId: emoji.id,
            });
        },
        [editor, isMobile, recordUsage],
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
            if (!isMobile) editor?.focus();
            recordUsage({ emoji, emojiType: 'unicode' });
        },
        [editor, isMobile, recordUsage],
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
                        customCategories={pickerCategories}
                        onClickAway={onClickAway}
                        onCustomEmojiSelect={handleCustomEmojiSelect}
                        onEmojiSelect={handleEmojiSelect}
                    />
                </React.Suspense>
            ) : null}

            {showStickerPicker ? (
                <React.Suspense
                    fallback={
                        <div className="flex h-[500px] w-[620px] max-w-[calc(100vw-24px)] items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-muted-foreground shadow-xl">
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
