import type React from 'react';
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, PASTE_COMMAND } from 'lexical';

interface LexicalPastePluginProps {
    onPasteFiles: (files: FileList | File[]) => void;
}

export const LexicalPastePlugin: React.FC<LexicalPastePluginProps> = ({
    onPasteFiles,
}) => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerCommand(
                PASTE_COMMAND,
                (event: ClipboardEvent) => {
                    const { clipboardData } = event;
                    if (!clipboardData) return false;

                    const files: File[] = [];

                    if (clipboardData.files && clipboardData.files.length > 0) {
                        for (const file of Array.from(clipboardData.files)) {
                            if (file.type.startsWith('image/')) {
                                files.push(file);
                            }
                        }
                    }

                    if (files.length === 0 && clipboardData.items) {
                        for (const item of Array.from(clipboardData.items)) {
                            if (
                                item.kind === 'file' &&
                                item.type.startsWith('image/')
                            ) {
                                const file = item.getAsFile();
                                if (file) {
                                    files.push(file);
                                }
                            }
                        }
                    }

                    if (files.length > 0) {
                        onPasteFiles(files);
                        return true;
                    }

                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
        [editor, onPasteFiles],
    );

    return null;
};
