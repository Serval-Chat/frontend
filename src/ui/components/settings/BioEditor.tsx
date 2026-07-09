import { useRef } from 'react';

import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

import type { User } from '@/api/users/users.types';
import { ChipNode } from '@/ui/components/chat/lexical/ChipNode';
import { LexicalAutocompletePlugin } from '@/ui/components/chat/lexical/LexicalAutocompletePlugin';
import { LexicalInitPlugin } from '@/ui/components/chat/lexical/LexicalInitPlugin';
import { $getRawMessageText } from '@/ui/components/chat/lexical/lexicalUtils';
import { Text } from '@/ui/components/common/Text';

const bioContentEditable = (
    <ContentEditable className="custom-scrollbar h-full max-h-[300px] min-h-[100px] w-full resize-none overflow-y-auto px-3 py-2 text-sm text-foreground outline-none" />
);

interface BioEditorProps {
    value: string;
    initialText: string;
    friends: User[];
    serverEmojis: React.ComponentProps<
        typeof LexicalAutocompletePlugin
    >['serverEmojis'];
    onChange: (rawText: string) => void;
}

export const BioEditor = ({
    value,
    initialText,
    friends,
    serverEmojis,
    onChange,
}: BioEditorProps): React.ReactNode => {
    const isAutocompleteOpenRef = useRef<boolean>(false);

    return (
        <div className="space-y-2">
            <label
                className="text-sm font-bold text-muted-foreground uppercase"
                htmlFor="bio"
            >
                About Me
            </label>
            <div className="relative flex min-h-[100px] items-start rounded-md border border-border-subtle bg-bg-secondary transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:outline-none">
                <LexicalComposer
                    initialConfig={{
                        namespace: 'BioEditor',
                        nodes: [ChipNode],
                        onError: (error): void => {
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
                    }}
                >
                    <LexicalInitPlugin initialText={initialText} />
                    <RichTextPlugin
                        ErrorBoundary={LexicalErrorBoundary}
                        contentEditable={bioContentEditable}
                        placeholder={
                            <div className="pointer-events-none absolute top-[9px] left-3 text-sm text-placeholder select-none">
                                Tell us about yourself...
                            </div>
                        }
                    />
                    <HistoryPlugin />
                    <ClearEditorPlugin />
                    <LexicalAutocompletePlugin
                        friends={friends}
                        isOpenRef={isAutocompleteOpenRef}
                        serverEmojis={serverEmojis}
                    />
                    <OnChangePlugin
                        onChange={(editorState): void => {
                            editorState.read((): void => {
                                const rawText = $getRawMessageText();
                                if (rawText.length <= 190) {
                                    onChange(rawText);
                                }
                            });
                        }}
                    />
                </LexicalComposer>
            </div>
            <Text as="p" className="text-right" size="xs" variant="muted">
                {value.length}/190
            </Text>
        </div>
    );
};
