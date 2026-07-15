import React from 'react';

import { CLEAR_EDITOR_COMMAND, type LexicalEditor } from 'lexical';
import { BarChart2, FileImage, Send, Smile, Sticker } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { $getRawMessageText } from './lexical/lexicalUtils';

const GifPicker = React.lazy(() =>
    import('./GifPicker').then((m) => ({ default: m.GifPicker })),
);

interface MessageComposerActionsProps {
    editor: LexicalEditor | null;
    showEmojiPicker: boolean;
    showStickerPicker: boolean;
    showGifPicker: boolean;
    showPollModal: boolean;
    hasText: boolean;
    hasFiles: boolean;
    isMobile: boolean;
    isUploading: boolean;
    onToggleEmoji: () => void;
    onToggleSticker: () => void;
    onToggleGif: () => void;
    onCloseGif: () => void;
    onOpenPoll: () => void;
    onSendMessage: (text: string) => Promise<boolean>;
}

export const MessageComposerActions = ({
    editor,
    showEmojiPicker,
    showStickerPicker,
    showGifPicker,
    showPollModal,
    hasText,
    hasFiles,
    isMobile,
    isUploading,
    onToggleEmoji,
    onToggleSticker,
    onToggleGif,
    onCloseGif,
    onOpenPoll,
    onSendMessage,
}: MessageComposerActionsProps): React.ReactNode => (
    <>
        <Button
            className={cn(
                'h-8 w-8 shrink-0 p-0',
                showEmojiPicker && 'text-primary',
            )}
            size="sm"
            variant="ghost"
            onClick={onToggleEmoji}
        >
            <Smile size={20} />
        </Button>

        <Button
            className={cn(
                'h-8 w-8 shrink-0 p-0',
                showStickerPicker && 'text-primary',
            )}
            size="sm"
            variant="ghost"
            onClick={onToggleSticker}
        >
            <Sticker size={20} />
        </Button>

        <Box className="relative">
            <Button
                className={cn(
                    'h-8 w-8 shrink-0 p-0',
                    showGifPicker && 'text-primary',
                )}
                size="sm"
                variant="ghost"
                onClick={onToggleGif}
            >
                <FileImage size={20} />
            </Button>
            {showGifPicker ? (
                <Box className="absolute right-0 bottom-full z-50 mb-2">
                    <React.Suspense
                        fallback={
                            <div className="flex h-[420px] w-[350px] items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-muted-foreground shadow-xl">
                                Loading GIFs...
                            </div>
                        }
                    >
                        <GifPicker
                            onClose={onCloseGif}
                            onSelect={(url): void => {
                                void (async (): Promise<void> => {
                                    const result = await onSendMessage(url);
                                    if (result && editor) {
                                        editor.dispatchCommand(
                                            CLEAR_EDITOR_COMMAND,
                                            undefined,
                                        );
                                    }
                                })();
                                onCloseGif();
                            }}
                        />
                    </React.Suspense>
                </Box>
            ) : null}
        </Box>

        <Button
            className={cn(
                'h-8 w-8 shrink-0 p-0',
                showPollModal && 'text-primary',
            )}
            size="sm"
            variant="ghost"
            onClick={onOpenPoll}
        >
            <BarChart2 size={20} />
        </Button>

        {(hasText || hasFiles) && isMobile ? (
            <Button
                className="h-8 w-8 shrink-0 p-0 text-primary"
                disabled={isUploading}
                size="sm"
                variant="ghost"
                onClick={(): void => {
                    if (editor) {
                        editor.getEditorState().read((): void => {
                            const text = $getRawMessageText();
                            void (async (): Promise<void> => {
                                const result = await onSendMessage(text);
                                if (result) {
                                    editor.dispatchCommand(
                                        CLEAR_EDITOR_COMMAND,
                                        undefined,
                                    );
                                }
                            })();
                        });
                    }
                }}
            >
                <Send size={20} />
            </Button>
        ) : null}
    </>
);
