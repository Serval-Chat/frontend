import type React from 'react';
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    CLEAR_EDITOR_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_ENTER_COMMAND,
} from 'lexical';

import { $getRawMessageText } from './lexicalUtils';
import { $getSlashChipState } from './slashChipHelpers';

interface LexicalSubmitPluginProps {
    onSendMessage: (text: string) => boolean | Promise<boolean>;
    isAutocompleteOpenRef?: React.MutableRefObject<boolean>;
}

export const LexicalSubmitPlugin: React.FC<LexicalSubmitPluginProps> = ({
    onSendMessage,
    isAutocompleteOpenRef,
}) => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerCommand(
                KEY_ENTER_COMMAND,
                (event: KeyboardEvent) => {
                    if (event.shiftKey) {
                        return false;
                    }

                    if (isAutocompleteOpenRef?.current) {
                        // The ref can be stale immediately after the user picks a
                        // slash command (React state hasn't propagated yet). If the
                        // editor is already in chip mode the autocomplete is
                        // definitively closed, so don't block submit.
                        const isChipMode =
                            editor.getEditorState().read($getSlashChipState) !==
                            null;
                        if (!isChipMode) {
                            return false;
                        }
                    }

                    if (window.innerWidth <= 768) {
                        return false;
                    }

                    event.preventDefault();

                    editor.getEditorState().read(() => {
                        const rawText = $getRawMessageText();
                        void (async () => {
                            const result = await onSendMessage(rawText);
                            if (result) {
                                editor.dispatchCommand(
                                    CLEAR_EDITOR_COMMAND,
                                    undefined,
                                );
                                // Restore focus so the next keystroke lands in
                                // the editor (critical when sending via a chip
                                // input whose DOM element is about to be removed).
                                editor.focus();
                            }
                        })();
                    });

                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
        [editor, onSendMessage, isAutocompleteOpenRef],
    );

    return null;
};
