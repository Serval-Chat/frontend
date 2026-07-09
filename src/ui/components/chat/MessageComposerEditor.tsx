import React, { useMemo, useRef } from 'react';

import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { LexicalEditor } from 'lexical';
import { ArrowUp } from 'lucide-react';

import type { SlashCommand } from '@/api/interactions/interactions.api';
import { cn } from '@/utils/cn';
import { clearDraft, saveDraft } from '@/utils/drafts';

import { ChipNode } from './lexical/ChipNode';
import { LexicalAutocompletePlugin } from './lexical/LexicalAutocompletePlugin';
import { LexicalEmojiPlugin } from './lexical/LexicalEmojiPlugin';
import { LexicalMarkdownFormattingPlugin } from './lexical/LexicalMarkdownFormattingPlugin';
import { LexicalPastePlugin } from './lexical/LexicalPastePlugin';
import { LexicalSlashCommandPlugin } from './lexical/LexicalSlashCommandPlugin';
import { LexicalSubmitPlugin } from './lexical/LexicalSubmitPlugin';
import { SlashArgChipNode } from './lexical/SlashArgChipNode';
import { SlashCommandChipNode } from './lexical/SlashCommandChipNode';
import { $getRawMessageText } from './lexical/lexicalUtils';
import { $getSlashChipState } from './lexical/slashChipHelpers';

const theme = {
    paragraph: 'mb-0',
    text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
    },
};

const messageInputInitialConfig = {
    namespace: 'MessageInput',
    nodes: [ChipNode, SlashCommandChipNode, SlashArgChipNode],
    onError: (error: Error): void => {
        console.error(error);
    },
    theme,
};

const MAX_LENGTH = Number(import.meta.env.VITE_MAX_MESSAGE_LENGTH || 2000);

type SlashChipState = {
    commandName: string;
    commandId?: string;
    argValues: string[];
} | null;

const isSameSlashChipState = (
    a: SlashChipState,
    b: SlashChipState,
): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.commandName !== b.commandName) return false;
    if (a.commandId !== b.commandId) return false;
    return (
        a.argValues.length === b.argValues.length &&
        a.argValues.every(
            (value, index): boolean => value === b.argValues[index],
        )
    );
};

interface LastMyMessage {
    id: string;
    serverId?: string | null;
    channelId?: string | null;
    receiverId?: string | null;
}

const MessageInputContentEditable = React.memo(
    ({
        hasText,
        lastMessage,
    }: {
        hasText: boolean;
        lastMessage: LastMyMessage | null;
    }) => (
        <ContentEditable
            className="custom-scrollbar h-full max-h-[200px] w-full resize-none overflow-y-auto px-3 py-2 text-sm text-foreground outline-none"
            onKeyDown={(e): void => {
                if (e.key === 'ArrowUp' && !hasText && lastMessage) {
                    e.preventDefault();
                    const editEvent = new CustomEvent('editLastMessage', {
                        detail: {
                            messageId: lastMessage.id,
                            serverId: lastMessage.serverId,
                            channelId: lastMessage.channelId,
                            receiverId: lastMessage.receiverId,
                        },
                    });
                    globalThis.dispatchEvent(editEvent);
                }
            }}
        />
    ),
);
MessageInputContentEditable.displayName = 'MessageInputContentEditable';

interface MessageComposerEditorProps {
    editor: LexicalEditor | null;
    hasText: boolean;
    currentInputText: string;
    isUploading: boolean;
    isSlowModeError: boolean;
    slowMode: number | undefined;
    canBypassSlowMode: boolean;
    lastMessage: LastMyMessage | null;
    selectedFriendId: string | null;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    isServerContextReady: boolean;
    channels: React.ComponentProps<
        typeof LexicalAutocompletePlugin
    >['channels'];
    friends: React.ComponentProps<typeof LexicalAutocompletePlugin>['friends'];
    members: React.ComponentProps<typeof LexicalAutocompletePlugin>['members'];
    roles: React.ComponentProps<typeof LexicalAutocompletePlugin>['roles'];
    serverEmojis: React.ComponentProps<
        typeof LexicalAutocompletePlugin
    >['serverEmojis'];
    serverCommands: SlashCommand[];
    onEditorChange: (editor: LexicalEditor) => void;
    onTextChange: (text: string) => void;
    onSlashChipChange: (chip: SlashChipState) => void;
    onHasTextChange: (hasText: boolean) => void;
    onSendMessage: (text: string) => Promise<boolean>;
    onPasteFiles: (files: FileList | File[]) => void;
    onTyping: () => void;
}

export const MessageComposerEditor = ({
    editor,
    hasText,
    currentInputText,
    isUploading,
    isSlowModeError,
    slowMode,
    canBypassSlowMode,
    lastMessage,
    selectedFriendId,
    selectedServerId,
    selectedChannelId,
    isServerContextReady,
    channels,
    friends,
    members,
    roles,
    serverEmojis,
    serverCommands,
    onEditorChange,
    onTextChange,
    onSlashChipChange,
    onHasTextChange,
    onSendMessage,
    onPasteFiles,
    onTyping,
}: MessageComposerEditorProps): React.ReactNode => {
    const isMentionOpenRef = useRef(false);
    const isSlashOpenRef = useRef(false);
    const isAutocompleteOpenRefs = useMemo<
        [React.MutableRefObject<boolean>, React.MutableRefObject<boolean>]
    >(() => [isMentionOpenRef, isSlashOpenRef], []);
    const currentInputTextRef = useRef('');
    const hasTextRef = useRef(false);
    const slashChipStateRef = useRef<SlashChipState>(null);
    const lastDraftJsonRef = useRef<string | null>(null);

    const remainingChars = MAX_LENGTH - currentInputText.length;
    const showCounter =
        remainingChars <= MAX_LENGTH * 0.1 || remainingChars < 0;

    const getPlaceholder = (): React.ReactNode => {
        if (isUploading) return 'Uploading...';

        if (slowMode && slowMode > 0) {
            if (canBypassSlowMode) {
                return "Slowmode enabled. Huh? It doesn't affect YOU!";
            }
            return 'Slowmode enabled.';
        }

        const hasLastMessage = lastMessage !== null;
        return (
            <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="shrink-0">Type a message...</span>
                <span className="flex shrink items-center gap-1 text-[11px] font-medium whitespace-nowrap">
                    <span className="ml-1 opacity-70">(</span>
                    <kbd className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-white/20 bg-white/10 px-1.5 shadow-sm">
                        Shift
                    </kbd>
                    <span className="opacity-70">+</span>
                    <kbd className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-white/20 bg-white/10 px-1.5 shadow-sm">
                        Enter
                    </kbd>
                    <span className="opacity-70">new line</span>
                    {hasLastMessage ? (
                        <>
                            <span className="mx-0.5 h-3 w-px bg-white/10" />
                            <kbd className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-white/20 bg-white/10 px-1 shadow-sm">
                                <ArrowUp size={10} strokeWidth={3} />
                            </kbd>
                            <span className="opacity-70">edit</span>
                        </>
                    ) : null}
                    <span className="opacity-70">)</span>
                </span>
            </div>
        );
    };

    return (
        <div
            className={cn(
                'relative flex min-h-[40px] flex-1 cursor-text items-center rounded-md transition-all duration-200',
                isSlowModeError &&
                    '!border-danger ring-2 !ring-danger ring-offset-1',
            )}
        >
            <LexicalComposer initialConfig={messageInputInitialConfig}>
                <RichTextPlugin
                    ErrorBoundary={LexicalErrorBoundary}
                    // MessageInputContentEditable is wrapped in memo, so a fresh
                    // element reference here doesn't cause it to re-render.
                    // react-doctor-disable-next-line react-doctor/jsx-no-jsx-as-prop
                    contentEditable={
                        <MessageInputContentEditable
                            hasText={hasText}
                            lastMessage={lastMessage}
                        />
                    }
                    placeholder={
                        <div className="pointer-events-none absolute top-[9px] left-3 max-w-[calc(100%-24px)] truncate text-sm text-placeholder select-none">
                            {getPlaceholder()}
                        </div>
                    }
                />
                <HistoryPlugin />
                <ClearEditorPlugin />
                <LexicalMarkdownFormattingPlugin />
                <LexicalSubmitPlugin
                    isAutocompleteOpenRefs={isAutocompleteOpenRefs}
                    onSendMessage={onSendMessage}
                />
                <LexicalEmojiPlugin />
                <LexicalPastePlugin onPasteFiles={onPasteFiles} />
                <LexicalAutocompletePlugin
                    channels={channels}
                    friends={friends}
                    isOpenRef={isMentionOpenRef}
                    members={members}
                    roles={roles}
                    serverEmojis={serverEmojis}
                    serverId={selectedServerId || undefined}
                />
                <LexicalSlashCommandPlugin
                    commands={serverCommands}
                    enabled={isServerContextReady}
                    isOpenRef={isSlashOpenRef}
                    members={members}
                />
                <OnChangePlugin
                    onChange={(editorState, changedEditor): void => {
                        if (!editor) onEditorChange(changedEditor);

                        let currentText = '';
                        let currentChip: SlashChipState = null;
                        editorState.read((): void => {
                            currentText = $getRawMessageText();
                            currentChip = $getSlashChipState();
                        });

                        const nonEmpty =
                            currentText.trim().length > 0 ||
                            currentChip !== null;

                        if (currentInputTextRef.current !== currentText) {
                            currentInputTextRef.current = currentText;
                            onTextChange(currentText);
                        }

                        if (
                            !isSameSlashChipState(
                                slashChipStateRef.current,
                                currentChip,
                            )
                        ) {
                            slashChipStateRef.current = currentChip;
                            onSlashChipChange(currentChip);
                        }

                        if (hasTextRef.current !== nonEmpty) {
                            hasTextRef.current = nonEmpty;
                            onHasTextChange(nonEmpty);
                        }

                        if (nonEmpty) {
                            onTyping();
                        }

                        if (
                            currentText.trim().length === 0 &&
                            currentChip === null
                        ) {
                            lastDraftJsonRef.current = null;
                            clearDraft(
                                selectedFriendId,
                                selectedServerId,
                                selectedChannelId,
                            );
                        } else {
                            const json = JSON.stringify(editorState.toJSON());
                            if (lastDraftJsonRef.current !== json) {
                                lastDraftJsonRef.current = json;
                                saveDraft(
                                    json,
                                    selectedFriendId,
                                    selectedServerId,
                                    selectedChannelId,
                                );
                            }
                        }
                    }}
                />
            </LexicalComposer>

            {showCounter ? (
                <div
                    className={cn(
                        'pointer-events-none absolute right-2 bottom-1 text-[10px] font-bold select-none',
                        remainingChars < 0
                            ? 'text-danger'
                            : 'text-muted-foreground/60',
                    )}
                >
                    {remainingChars < 0
                        ? `-${Math.abs(remainingChars)}`
                        : remainingChars}
                </div>
            ) : null}
        </div>
    );
};
