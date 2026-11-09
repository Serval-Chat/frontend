import React from 'react';

import {
    CornerUpLeft,
    Edit,
    Pin,
    RefreshCw,
    SmilePlus,
    StickyNote,
    Trash2,
} from 'lucide-react';

import { ParsedUnicodeEmoji } from '@/features/messages/ParsedUnicodeEmoji';
import type { QuickReactionEmoji } from '@/hooks/useFrequentlyUsedEmojis';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { Tooltip } from '@/ui/primitives/Tooltip';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { emojiMap } from '@/utils/emoji';

const quickReactionLabel = (quickReaction: QuickReactionEmoji): string =>
    quickReaction.emojiType === 'custom'
        ? `:${quickReaction.name}:`
        : `:${emojiMap.get(quickReaction.emoji)?.short_name ?? quickReaction.emoji}:`;

interface MessageActionsProps {
    message: ProcessedChatMessage;
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    canReact: boolean;
    showPicker: boolean;
    quickReactions?: QuickReactionEmoji[];
    onQuickReact?: (emoji: QuickReactionEmoji) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    onTogglePicker: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onToggleSticky: () => void;
    reactRef: React.RefObject<HTMLButtonElement | null>;
    onRetry?: () => void;
    onDiscard?: () => void;
}

export const MessageActions = React.memo(
    ({
        message,
        canEdit,
        canDelete,
        canPin,
        canReact,
        showPicker,
        quickReactions,
        onQuickReact,
        onReplyToMessage,
        onTogglePicker,
        onEdit,
        onDelete,
        onTogglePin,
        onToggleSticky,
        reactRef,
        onRetry,
        onDiscard,
    }: MessageActionsProps) => {
        if (message._pending === 'failed') {
            return (
                <Box className="flex items-center gap-1 rounded border border-white/5 bg-background px-1 py-1 shadow-xl">
                    {onRetry ? (
                        <Tooltip content="Try again" position="top">
                            <Tooltip
                                content="Try again"
                                position="top"
                                triggerClassName="inline-flex items-center"
                            >
                                <Button
                                    aria-label="Try again"
                                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                                    size="sm"
                                    variant="ghost"
                                    onClick={onRetry}
                                >
                                    <RefreshCw size={18} />
                                </Button>
                            </Tooltip>
                        </Tooltip>
                    ) : null}
                    {onDiscard || onDelete ? (
                        <Tooltip content="Delete message" position="top">
                            <Button
                                aria-label="Delete message"
                                className="h-8 w-8 rounded p-1.5 text-danger transition-colors hover:bg-danger/20 hover:text-danger"
                                size="sm"
                                variant="ghost"
                                onClick={onDiscard || onDelete}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </Tooltip>
                    ) : null}
                </Box>
            );
        }

        return (
            <Box className="flex items-center gap-1 rounded border border-white/5 bg-background px-1 py-1 shadow-xl max-md:hidden">
                {canReact && quickReactions && quickReactions.length > 0
                    ? quickReactions.map((quickReaction) => (
                          <Tooltip
                              content={quickReactionLabel(quickReaction)}
                              key={quickReaction.key}
                              position="top"
                          >
                              <Button
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-white/5"
                                  size="sm"
                                  variant="ghost"
                                  onClick={(): void => {
                                      onQuickReact?.(quickReaction);
                                  }}
                              >
                                  {quickReaction.emojiType === 'custom' ? (
                                      <img
                                          alt={quickReaction.name}
                                          className="h-7 w-7 object-contain"
                                          src={
                                              resolveApiUrl(
                                                  quickReaction.imageUrl,
                                              ) || ''
                                          }
                                      />
                                  ) : (
                                      <ParsedUnicodeEmoji
                                          className="top-0! h-7 w-7"
                                          content={quickReaction.emoji}
                                      />
                                  )}
                              </Button>
                          </Tooltip>
                      ))
                    : null}

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
                {canReact ? (
                    <Tooltip
                        content="Add Reaction"
                        position="top"
                        triggerClassName="inline-flex items-center"
                    >
                        <Button
                            aria-label="Add Reaction"
                            className={cn(
                                'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                                showPicker && 'bg-white/10 text-foreground',
                            )}
                            ref={reactRef}
                            size="sm"
                            variant="ghost"
                            onClick={onTogglePicker}
                        >
                            <SmilePlus size={18} />
                        </Button>
                    </Tooltip>
                ) : null}

                {canEdit ? (
                    <Tooltip
                        content="Edit Message"
                        position="top"
                        triggerClassName="inline-flex items-center"
                    >
                        <Button
                            aria-label="Edit Message"
                            className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            size="sm"
                            variant="ghost"
                            onClick={onEdit}
                        >
                            <Edit size={18} />
                        </Button>
                    </Tooltip>
                ) : null}

                {canPin && message.serverId && message.channelId ? (
                    <>
                        <Tooltip
                            content={
                                message.isPinned
                                    ? 'Unpin Message'
                                    : 'Pin Message'
                            }
                            position="top"
                            triggerClassName="inline-flex items-center"
                        >
                            <Button
                                aria-label={
                                    message.isPinned
                                        ? 'Unpin Message'
                                        : 'Pin Message'
                                }
                                className={cn(
                                    'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                                    message.isPinned && 'text-primary',
                                )}
                                size="sm"
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
                        </Tooltip>
                        <Tooltip
                            content={
                                message.isSticky
                                    ? 'Unsticky Message'
                                    : 'Sticky Message'
                            }
                            position="top"
                            triggerClassName="inline-flex items-center"
                        >
                            <Button
                                aria-label={
                                    message.isSticky
                                        ? 'Unsticky Message'
                                        : 'Sticky Message'
                                }
                                className={cn(
                                    'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                                    message.isSticky && 'text-primary',
                                )}
                                size="sm"
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
                        </Tooltip>
                    </>
                ) : null}

                {canDelete ? (
                    <Tooltip
                        content="Delete Message"
                        position="top"
                        triggerClassName="inline-flex items-center"
                    >
                        <Button
                            aria-label="Delete Message"
                            className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-danger/20 hover:text-danger"
                            size="sm"
                            variant="ghost"
                            onClick={onDelete}
                        >
                            <Trash2 size={18} />
                        </Button>
                    </Tooltip>
                ) : null}
            </Box>
        );
    },
);

MessageActions.displayName = 'MessageActions';
