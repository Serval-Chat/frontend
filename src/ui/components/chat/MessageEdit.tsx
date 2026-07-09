import React, { useCallback, useMemo, useRef, useState } from 'react';

import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';
import { Check, Smile, X } from 'lucide-react';
import { useClickAway } from 'react-use';

import {
    useEditChannelMessage,
    useEditUserMessage,
} from '@/api/chat/chat.queries';
import { useFriends } from '@/api/friends/friends.queries';
import {
    useChannels,
    useMembers,
    useRoles,
} from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useKeybindManager } from '@/keybinds/useKeybindManager';
import {
    $createChipNode,
    ChipNode,
} from '@/ui/components/chat/lexical/ChipNode';
import { Button } from '@/ui/components/common/Button';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { LexicalAutocompletePlugin } from './lexical/LexicalAutocompletePlugin';
import { LexicalEmojiPlugin } from './lexical/LexicalEmojiPlugin';
import { LexicalInitPlugin } from './lexical/LexicalInitPlugin';
import { LexicalMarkdownFormattingPlugin } from './lexical/LexicalMarkdownFormattingPlugin';
import { LexicalSubmitPlugin } from './lexical/LexicalSubmitPlugin';
import { $getRawMessageText } from './lexical/lexicalUtils';

const EmojiPicker = React.lazy(() =>
    import('@/ui/components/emoji/EmojiPicker').then((m) => ({
        default: m.EmojiPicker,
    })),
);

interface MessageEditProps {
    messageId: string;
    initialText: string;
    serverId?: string;
    channelId?: string;
    receiverId?: string;
    onCancel: () => void;
    onSuccess?: () => void;
}

const MessageEditActions = ({
    isPending,
    showEmojiPicker,
    hasChanged,
    onToggleEmoji,
    onCancel,
    onSave,
}: {
    isPending: boolean;
    showEmojiPicker: boolean;
    hasChanged: boolean;
    onToggleEmoji: () => void;
    onCancel: () => void;
    onSave: () => void;
}) => (
    <Box className="absolute right-2 bottom-2 flex gap-1">
        <Button
            className={cn(
                'h-6 w-6 rounded p-0 transition-colors',
                'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                showEmojiPicker && 'bg-white/10 text-foreground',
            )}
            disabled={isPending}
            size="sm"
            title="Add Emoji"
            variant="ghost"
            onClick={onToggleEmoji}
        >
            <Smile size={14} />
        </Button>

        <Button
            className={cn(
                'h-6 w-6 rounded p-0 transition-colors',
                'text-muted-foreground hover:bg-danger/20 hover:text-danger',
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
                'h-6 w-6 rounded p-0 transition-colors',
                hasChanged
                    ? 'text-muted-foreground hover:bg-success/20 hover:text-success'
                    : 'cursor-not-allowed opacity-50',
            )}
            disabled={isPending || !hasChanged}
            size="sm"
            title="Save (Enter)"
            variant="ghost"
            onClick={onSave}
        >
            <Check size={14} />
        </Button>
    </Box>
);

const MessageEditEmojiPopup = ({
    pickerRef,
    customCategories,
    onEmojiSelect,
    onCustomEmojiSelect,
}: {
    pickerRef: React.RefObject<HTMLDivElement | null>;
    customCategories: ReturnType<typeof useCustomEmojis>['customCategories'];
    onEmojiSelect: (emoji: string) => void;
    onCustomEmojiSelect: (emoji: { id: string; name: string }) => void;
}) => (
    <Box
        className="absolute right-0 bottom-full z-[var(--z-index-popover)] mb-2"
        ref={pickerRef}
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
                onCustomEmojiSelect={onCustomEmojiSelect}
                onEmojiSelect={onEmojiSelect}
            />
        </React.Suspense>
    </Box>
);

export const MessageEdit = ({
    messageId,
    initialText,
    serverId,
    channelId,
    receiverId,
    onCancel,
    onSuccess,
}: MessageEditProps) => {
    const [text, setText] = useState(initialText);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const editChannelMessage = useEditChannelMessage();
    const editUserMessage = useEditUserMessage();
    const { customCategories } = useCustomEmojis({ enabled: true });
    const { data: me } = useMe();
    const keybindManager = useKeybindManager(me?.settings?.keybinds);

    const { data: friends } = useFriends();
    const { data: channels } = useChannels(serverId || '', {
        enabled: !!serverId,
    });
    const { data: members } = useMembers(serverId || '', {
        enabled: !!serverId,
    });
    const { data: roles } = useRoles(serverId || '', { enabled: !!serverId });

    const friendUsers = React.useMemo((): User[] => {
        if (!friends) return [];
        return friends as unknown as User[];
    }, [friends]);

    const allServerEmojis = React.useMemo(
        () =>
            customCategories.flatMap((cat) =>
                cat.emojis.map((e) => ({
                    id: e.id,
                    name: e.name,
                    imageUrl: e.url,
                    serverId: cat.id,
                    createdBy: '',
                    createdAt: '',
                })),
            ),
        [customCategories],
    );

    const isAutocompleteOpenRef = useRef<boolean>(false);
    const isAutocompleteOpenRefs = useMemo(
        (): [React.MutableRefObject<boolean>] => [isAutocompleteOpenRef],
        [],
    );
    const editorInstanceRef = useRef<LexicalEditor | null>(null);

    React.useEffect((): (() => void) => {
        const handleResize = (): void => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);

        const handleGlobalKeyDown = (e: KeyboardEvent): void => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (keybindManager.matches('composer.focus', e)) {
                e.preventDefault();
                if (editorInstanceRef.current) {
                    editorInstanceRef.current.focus();
                    setShowEmojiPicker(false);
                }
            }
        };

        globalThis.addEventListener('keydown', handleGlobalKeyDown);

        if (editorInstanceRef.current) {
            setTimeout((): void => {
                editorInstanceRef.current?.focus();
            }, 0);
        }

        return (): void => {
            window.removeEventListener('resize', handleResize);
            globalThis.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [keybindManager]);

    // Close emoji picker when clicking outside
    useClickAway(emojiPickerRef, (): void => {
        setShowEmojiPicker(false);
    });

    const handleEmojiSelect = useCallback((emoji: string): void => {
        if (editorInstanceRef.current) {
            editorInstanceRef.current.update((): void => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.insertNodes([
                        $createChipNode('unicode-emoji', {
                            id: emoji,
                        }),
                    ]);
                }
            });
            editorInstanceRef.current.focus();
        }
        setShowEmojiPicker(false);
    }, []);

    const handleCustomEmojiSelect = useCallback(
        (emoji: { id: string; name: string }): void => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.update((): void => {
                    const selection = editorInstanceRef.current
                        ?.getEditorState()
                        .read(() => $getSelection());
                    if ($isRangeSelection(selection)) {
                        selection.insertNodes([
                            $createChipNode('emoji', {
                                id: emoji.id,
                                label: emoji.name,
                            }),
                        ]);
                        selection.insertText(' ');
                    }
                });
                editorInstanceRef.current.focus();
            }
            setShowEmojiPicker(false);
        },
        [],
    );

    const handleSubmit = (overrideText?: string): void => {
        const trimmedText = (overrideText ?? text).trim();
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

    const isPending = editChannelMessage.isPending || editUserMessage.isPending;
    const hasChanged = text.trim() !== initialText.trim();

    const contentEditableElement = useMemo(
        () => (
            <ContentEditable
                className="custom-scrollbar h-full max-h-[200px] min-h-[60px] w-full resize-none overflow-y-auto px-3 py-2 pb-8 text-sm text-foreground outline-none"
                onKeyDown={(e): void => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        onCancel();
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                        if (isMobile) return;
                        if (!isAutocompleteOpenRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                }}
            />
        ),
        [onCancel, isMobile],
    );

    const initialConfig = {
        namespace: 'MessageEdit',
        nodes: [ChipNode],
        onError: (error: Error): void => {
            console.error(error);
        },
        theme: {
            paragraph: 'mb-0',
            text: {
                bold: 'font-bold',
                italic: 'italic',
                underline: 'underline',
                strikethrough: 'line-through',
            },
        },
    };

    return (
        <Box className="relative w-full">
            <div className="relative flex min-h-[60px] flex-1 cursor-text items-start rounded-md border border-border-subtle bg-bg-secondary transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:outline-none">
                <LexicalComposer initialConfig={initialConfig}>
                    <LexicalInitPlugin initialText={initialText} />
                    <RichTextPlugin
                        ErrorBoundary={LexicalErrorBoundary}
                        contentEditable={contentEditableElement}
                        placeholder={
                            <div className="pointer-events-none absolute top-[9px] left-3 max-w-[calc(100%-24px)] truncate text-sm text-placeholder select-none">
                                Editing message...
                            </div>
                        }
                    />
                    <HistoryPlugin />
                    <ClearEditorPlugin />
                    <LexicalMarkdownFormattingPlugin />
                    <LexicalEmojiPlugin />
                    <LexicalSubmitPlugin
                        isAutocompleteOpenRefs={isAutocompleteOpenRefs}
                        onSendMessage={(msg): true => {
                            if (!isMobile) handleSubmit(msg);
                            return true;
                        }}
                    />
                    <LexicalAutocompletePlugin
                        channels={channels}
                        friends={friendUsers}
                        isOpenRef={isAutocompleteOpenRef}
                        members={members}
                        roles={roles}
                        serverEmojis={allServerEmojis}
                        serverId={serverId}
                    />
                    <OnChangePlugin
                        onChange={(editorState, editor): void => {
                            editorInstanceRef.current = editor;
                            editorState.read((): void => {
                                setText($getRawMessageText());
                            });
                        }}
                    />
                </LexicalComposer>
            </div>

            <MessageEditActions
                hasChanged={hasChanged}
                isPending={isPending}
                showEmojiPicker={showEmojiPicker}
                onCancel={onCancel}
                onSave={(): void => {
                    handleSubmit();
                }}
                onToggleEmoji={(): void => {
                    setShowEmojiPicker(!showEmojiPicker);
                }}
            />

            {showEmojiPicker ? (
                <MessageEditEmojiPopup
                    customCategories={customCategories}
                    pickerRef={emojiPickerRef}
                    onCustomEmojiSelect={handleCustomEmojiSelect}
                    onEmojiSelect={handleEmojiSelect}
                />
            ) : null}
        </Box>
    );
};
