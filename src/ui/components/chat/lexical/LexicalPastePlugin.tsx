import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    PASTE_COMMAND,
} from 'lexical';

interface LexicalPastePluginProps {
    onPasteFiles: (files: FileList | File[]) => void;
}

export const LexicalPastePlugin = ({
    onPasteFiles,
}: LexicalPastePluginProps): null => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        (): (() => void) =>
            editor.registerCommand(
                PASTE_COMMAND,
                (event: ClipboardEvent): boolean => {
                    const { clipboardData } = event;
                    if (!clipboardData) return false;

                    const files: File[] = [];

                    if (clipboardData.files && clipboardData.files.length > 0) {
                        for (const file of clipboardData.files) {
                            if (file.type.startsWith('image/')) {
                                files.push(file);
                            }
                        }
                    }

                    if (files.length === 0 && clipboardData.items) {
                        for (const item of clipboardData.items) {
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

                    const plainText = clipboardData.getData('text/plain');
                    const html = clipboardData.getData('text/html');

                    if (plainText && html) {
                        event.preventDefault();
                        editor.update((): void => {
                            const selection = $getSelection();
                            if ($isRangeSelection(selection)) {
                                selection.insertText(plainText);
                            }
                        });
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
