import React, { useRef, useState } from 'react';

import { Check, Smile, X } from 'lucide-react';
import { useClickAway } from 'react-use';

import {
    useEditChannelMessage,
    useEditUserMessage,
} from '@/api/chat/chat.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { Button } from '@/ui/components/common/Button';
import { TextArea } from '@/ui/components/common/TextArea';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface MessageEditProps {
    messageId: string;
    initialText: string;
    serverId?: string;
    channelId?: string;
    receiverId?: string;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const MessageEdit: React.FC<MessageEditProps> = ({
    messageId,
    initialText,
    serverId,
    channelId,
    receiverId,
    onCancel,
    onSuccess,
}) => {
    const [text, setText] = useState(initialText);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const editChannelMessage = useEditChannelMessage();
    const editUserMessage = useEditUserMessage();
    const { customCategories } = useCustomEmojis();

    // Focus textarea on mount
    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.focus();
            textAreaRef.current.select();
        }
    }, []);

    // Close emoji picker when clicking outside
    useClickAway(emojiPickerRef, () => {
        setShowEmojiPicker(false);
    });

    const handleEmojiSelect = (emoji: string): void => {
        setText((prev) => prev + emoji);
        setShowEmojiPicker(false);
        // Focus back to textarea after emoji selection
        setTimeout(() => {
            textAreaRef.current?.focus();
        }, 0);
    };

    const handleCustomEmojiSelect = (emoji: {
        id: string;
        name: string;
    }): void => {
        setText((prev) => prev + `<emoji:${emoji.id}>`);
        setShowEmojiPicker(false);
        // Focus back to textarea after emoji selection
        setTimeout(() => {
            textAreaRef.current?.focus();
        }, 0);
    };

    const handleSubmit = (): void => {
        const trimmedText = text.trim();
        if (!trimmedText || trimmedText === initialText.trim()) {
            onCancel();
            return;
        }

        if (serverId && channelId) {
            // Edit server channel message
            editChannelMessage.mutate({
                serverId,
                channelId,
                messageId,
                content: trimmedText,
            });
        } else if (receiverId) {
            // Edit direct message
            editUserMessage.mutate({
                messageId,
                content: trimmedText,
                userId: receiverId,
            });
        }

        onSuccess?.();
        onCancel();
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const isPending = editChannelMessage.isPending || editUserMessage.isPending;
    const hasChanged = text.trim() !== initialText.trim();

    return (
        <Box className="relative w-full">
            <TextArea
                className="w-full bg-bg-secondary border border-border-subtle rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 min-h-[60px]"
                disabled={isPending}
                ref={textAreaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            <Box className="absolute right-2 bottom-2 flex gap-1">
                <Button
                    className={cn(
                        'h-6 w-6 p-0 rounded transition-colors',
                        'hover:bg-white/5 text-muted-foreground hover:text-foreground',
                        showEmojiPicker && 'bg-white/10 text-foreground',
                    )}
                    disabled={isPending}
                    size="sm"
                    title="Add Emoji"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                    <Smile size={14} />
                </Button>

                <Button
                    className={cn(
                        'h-6 w-6 p-0 rounded transition-colors',
                        'hover:bg-danger/20 text-muted-foreground hover:text-danger',
                    )}
                    disabled={isPending}
                    size="sm"
                    title="Cancel (Escape)"
                    variant="ghost"
                    onClick={onCancel}
                >
                    <X size={14} />
                </Button>

                <Button
                    className={cn(
                        'h-6 w-6 p-0 rounded transition-colors',
                        hasChanged
                            ? 'hover:bg-success/20 text-muted-foreground hover:text-success'
                            : 'opacity-50 cursor-not-allowed',
                    )}
                    disabled={isPending || !hasChanged}
                    size="sm"
                    title="Save (Enter)"
                    variant="ghost"
                    onClick={handleSubmit}
                >
                    <Check size={14} />
                </Button>
            </Box>

            {showEmojiPicker && (
                <Box
                    className="absolute bottom-full right-0 mb-2 z-[var(--z-index-popover)]"
                    ref={emojiPickerRef}
                >
                    <EmojiPicker
                        customCategories={customCategories}
                        onCustomEmojiSelect={handleCustomEmojiSelect}
                        onEmojiSelect={handleEmojiSelect}
                    />
                </Box>
            )}
        </Box>
    );
};
