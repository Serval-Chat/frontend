import React from 'react';

import {
    CornerUpLeft,
    Edit,
    Pin,
    SmilePlus,
    StickyNote,
    Trash2,
} from 'lucide-react';

import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface MessageActionsProps {
    message: ProcessedChatMessage;
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    showPicker: boolean;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    onTogglePicker: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onToggleSticky: () => void;
    reactRef: React.RefObject<HTMLButtonElement | null>;
}

export const MessageActions = React.memo(
    ({
        message,
        canEdit,
        canDelete,
        canPin,
        showPicker,
        onReplyToMessage,
        onTogglePicker,
        onEdit,
        onDelete,
        onTogglePin,
        onToggleSticky,
        reactRef,
    }: MessageActionsProps) => (
        <Box className="flex items-center gap-1 rounded border border-white/5 bg-bg-secondary px-1 py-1 shadow-xl max-md:hidden">
            {onReplyToMessage ? (
                <Button
                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    size="sm"
                    title="Reply"
                    variant="ghost"
                    onClick={(): void => {
                        onReplyToMessage(message);
                    }}
                >
                    <CornerUpLeft size={18} />
                </Button>
            ) : null}
            <Button
                className={cn(
                    'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                    showPicker && 'bg-white/10 text-foreground',
                )}
                ref={reactRef}
                size="sm"
                title="Add Reaction"
                variant="ghost"
                onClick={onTogglePicker}
            >
                <SmilePlus size={18} />
            </Button>

            {canEdit ? (
                <Button
                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    size="sm"
                    title="Edit Message"
                    variant="ghost"
                    onClick={onEdit}
                >
                    <Edit size={18} />
                </Button>
            ) : null}

            {canPin && message.serverId && message.channelId ? (
                <>
                    <Button
                        className={cn(
                            'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                            message.isPinned && 'text-primary',
                        )}
                        size="sm"
                        title={
                            message.isPinned ? 'Unpin Message' : 'Pin Message'
                        }
                        variant="ghost"
                        onClick={onTogglePin}
                    >
                        <Pin
                            className={cn(
                                'h-4 w-4',
                                message.isPinned && 'fill-primary',
                            )}
                            size={18}
                        />
                    </Button>
                    <Button
                        className={cn(
                            'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                            message.isSticky && 'text-primary',
                        )}
                        size="sm"
                        title={
                            message.isSticky
                                ? 'Unsticky Message'
                                : 'Sticky Message'
                        }
                        variant="ghost"
                        onClick={onToggleSticky}
                    >
                        <StickyNote
                            className={cn(
                                'h-4 w-4',
                                message.isSticky && 'fill-primary',
                            )}
                            size={18}
                        />
                    </Button>
                </>
            ) : null}

            {canDelete ? (
                <Button
                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-danger/20 hover:text-danger"
                    size="sm"
                    title="Delete Message"
                    variant="ghost"
                    onClick={onDelete}
                >
                    <Trash2 size={18} />
                </Button>
            ) : null}
        </Box>
    ),
);

MessageActions.displayName = 'MessageActions';
