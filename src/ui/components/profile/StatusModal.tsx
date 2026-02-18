import React, { useRef, useState } from 'react';

import { Smile, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useClickAway } from 'react-use';

import { useUpdateStatus } from '@/api/users/users.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialText?: string;
    initialEmoji?: string;
}

const isCustomEmoji = (emoji: string): boolean =>
    /^[0-9a-fA-F]{24}$/.test(emoji);

export const StatusModal: React.FC<StatusModalProps> = ({
    isOpen,
    onClose,
    initialText = '',
    initialEmoji = '',
}) => {
    const [statusText, setStatusText] = useState(initialText);
    const [statusEmoji, setStatusEmoji] = useState(initialEmoji);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { customCategories } = useCustomEmojis();
    const { mutate: updateStatus, isPending } = useUpdateStatus();

    useClickAway(emojiPickerRef, (e) => {
        if (triggerRef.current?.contains(e.target as Node)) {
            return;
        }
        setShowEmojiPicker(false);
    });

    const position = useSmartPosition({
        isOpen: showEmojiPicker,
        elementRef: emojiPickerRef,
        triggerRef: triggerRef,
        offset: 8,
    });

    const handleSave = (): void => {
        if (statusText.trim() || statusEmoji) {
            updateStatus(
                {
                    text: statusText.trim(),
                    emoji: statusEmoji || undefined,
                },
                {
                    onSuccess: () => onClose(),
                },
            );
        } else {
            updateStatus(
                { clear: true },
                {
                    onSuccess: () => onClose(),
                },
            );
        }
    };

    const handleClear = (): void => {
        updateStatus(
            { clear: true },
            {
                onSuccess: () => {
                    setStatusText('');
                    setStatusEmoji('');
                    onClose();
                },
            },
        );
    };

    const handleEmojiSelect = (emoji: string): void => {
        setStatusEmoji(emoji);
        setShowEmojiPicker(false);
    };

    const handleCustomEmojiSelect = (emoji: { id: string }): void => {
        setStatusEmoji(emoji.id);
        setShowEmojiPicker(false);
    };

    const renderEmojiPreview = (): React.ReactNode => {
        if (!statusEmoji) return <Smile size={20} />;

        if (isCustomEmoji(statusEmoji)) {
            return <ParsedEmoji className="w-5 h-5" emojiId={statusEmoji} />;
        }

        return <ParsedUnicodeEmoji className="text-xl" content={statusEmoji} />;
    };

    return (
        <Modal
            className="max-w-md"
            isOpen={isOpen}
            title="Set a custom status"
            onClose={onClose}
        >
            <Box className="flex flex-col gap-4">
                <Box className="flex items-center gap-2 p-2 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-border-subtle)] focus-within:border-primary transition-colors">
                    <Box className="shrink-0">
                        <Button
                            className="p-1 h-8 w-8 min-w-0"
                            ref={triggerRef}
                            variant="ghost"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            {renderEmojiPreview()}
                        </Button>

                        {showEmojiPicker &&
                            createPortal(
                                <Box
                                    className="fixed z-[var(--z-index-top)] shadow-2xl"
                                    ref={emojiPickerRef}
                                    style={{
                                        top: position.y,
                                        left: position.x,
                                    }}
                                >
                                    <EmojiPicker
                                        customCategories={customCategories}
                                        onCustomEmojiSelect={
                                            handleCustomEmojiSelect
                                        }
                                        onEmojiSelect={handleEmojiSelect}
                                    />
                                </Box>,
                                document.body,
                            )}
                    </Box>
                    <Input
                        className="border-none bg-transparent focus:ring-0 flex-1 h-9"
                        maxLength={120}
                        placeholder="What's happening?"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave();
                            }
                        }}
                    />
                    {(statusText || statusEmoji) && (
                        <Button
                            className="p-1 h-8 w-8 min-w-0 text-muted-foreground hover:text-foreground"
                            variant="ghost"
                            onClick={() => {
                                setStatusText('');
                                setStatusEmoji('');
                            }}
                        >
                            <X size={16} />
                        </Button>
                    )}
                </Box>

                <Box className="flex justify-between items-center gap-3">
                    <Button
                        className="text-muted-foreground hover:text-danger"
                        variant="ghost"
                        onClick={handleClear}
                    >
                        Clear status
                    </Button>
                    <Box className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={isPending}
                            variant="primary"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};
