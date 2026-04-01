import React, { useRef, useState } from 'react';

import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
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
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import {
    $createChipNode,
    ChipNode,
} from '@/ui/components/chat/lexical/ChipNode';
import { Button } from '@/ui/components/common/Button';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { LexicalAutocompletePlugin } from './lexical/LexicalAutocompletePlugin';
import { LexicalEmojiPlugin } from './lexical/LexicalEmojiPlugin';
import { LexicalInitPlugin } from './lexical/LexicalInitPlugin';
import { LexicalSubmitPlugin } from './lexical/LexicalSubmitPlugin';
import { $getRawMessageText } from './lexical/lexicalUtils';

const EditorBridge = ({
    onReady,
}: {
    onReady: (e: LexicalEditor) => void;
}): React.ReactNode => {
    const [editor] = useLexicalComposerContext();
    React.useEffect(() => {
        onReady(editor);
    }, [editor, onReady]);
    return null;
};

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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const editChannelMessage = useEditChannelMessage();
    const editUserMessage = useEditUserMessage();
    const { customCategories } = useCustomEmojis();

    const { data: friends } = useFriends();
    const { data: channels } = useChannels(serverId || '');
    const { data: members } = useMembers(serverId || '');
    const { data: roles } = useRoles(serverId || '');

    const friendUsers = React.useMemo(() => {
        if (!friends) return [];
        return friends as unknown as User[];
    }, [friends]);

    const allServerEmojis = React.useMemo(
        () =>
            customCategories.flatMap((cat) =>
                cat.emojis.map((e) => ({
                    _id: e.id,
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
    const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(
        null,
    );

    React.useEffect(() => {
        const handleResize = (): void => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        const handleGlobalKeyDown = (e: KeyboardEvent): void => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (editorInstance) {
                    editorInstance.focus();
                    setShowEmojiPicker(false);
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);

        if (editorInstance) {
            setTimeout(() => {
                editorInstance.focus();
            }, 0);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [editorInstance]);

    // Close emoji picker when clicking outside
    useClickAway(emojiPickerRef, () => {
        setShowEmojiPicker(false);
    });

    const handleEmojiSelect = (emoji: string): void => {
        if (editorInstance) {
            editorInstance.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.insertNodes([
                        $createChipNode('unicode-emoji', {
                            id: emoji,
                        }),
                    ]);
                }
            });
            editorInstance.focus();
        }
        setShowEmojiPicker(false);
    };

    const handleCustomEmojiSelect = (emoji: {
        id: string;
        name: string;
    }): void => {
        if (editorInstance) {
            editorInstance.update(() => {
                const selection = editorInstance
                    .getEditorState()
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
            editorInstance.focus();
        }
        setShowEmojiPicker(false);
    };

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

    const initialConfig = {
        namespace: 'MessageEdit',
        nodes: [ChipNode],
        onError: (error: Error) => console.error(error),
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
                    <EditorBridge onReady={setEditorInstance} />
                    <LexicalInitPlugin initialText={initialText} />
                    <RichTextPlugin
                        ErrorBoundary={LexicalErrorBoundary}
                        contentEditable={
                            <ContentEditable
                                className="custom-scrollbar h-full max-h-[200px] min-h-[60px] w-full resize-none overflow-y-auto px-3 py-2 pb-8 text-sm text-foreground outline-none"
                                onKeyDown={(e) => {
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
                        }
                        placeholder={
                            <div className="pointer-events-none absolute top-[9px] left-3 max-w-[calc(100%-24px)] truncate text-sm text-placeholder select-none">
                                Editing message...
                            </div>
                        }
                    />
                    <HistoryPlugin />
                    <ClearEditorPlugin />
                    <LexicalEmojiPlugin />
                    <LexicalSubmitPlugin
                        isAutocompleteOpenRef={isAutocompleteOpenRef}
                        onSendMessage={(msg) => {
                            if (!isMobile) handleSubmit(msg);
                        }}
                    />
                    <LexicalAutocompletePlugin
                        channels={channels}
                        friends={friendUsers}
                        members={members}
                        roles={roles}
                        serverEmojis={allServerEmojis}
                        onOpenChange={(isOpen) => {
                            isAutocompleteOpenRef.current = isOpen;
                        }}
                    />
                    <OnChangePlugin
                        onChange={(editorState, editor) => {
                            if (!editorInstance) setEditorInstance(editor);
                            editorState.read(() => {
                                setText($getRawMessageText());
                            });
                        }}
                    />
                </LexicalComposer>
            </div>

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
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
                    onClick={() => handleSubmit()}
                >
                    <Check size={14} />
                </Button>
            </Box>

            {showEmojiPicker && (
                <Box
                    className="absolute right-0 bottom-full z-[var(--z-index-popover)] mb-2"
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
