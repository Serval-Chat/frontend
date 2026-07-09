import type React from 'react';
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    CLEAR_EDITOR_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_ENTER_COMMAND,
} from 'lexical';

import { shouldAutocompleteHandleEnter } from './autocompleteUtils';
import { $getRawMessageText } from './lexicalUtils';
import { $getSlashChipState } from './slashChipHelpers';

interface LexicalSubmitPluginProps {
    onSendMessage: (text: string) => boolean | Promise<boolean>;
    isAutocompleteOpenRefs?: React.MutableRefObject<boolean>[];
}

const $getTextBeforeCursor = (): string | null => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
    }

    const anchor = selection.anchor;
    if (anchor.type !== 'text') {
        return null;
    }

    const anchorNode = anchor.getNode();
    if (!$isTextNode(anchorNode)) {
        return null;
    }

    return anchorNode.getTextContent().slice(0, anchor.offset);
};

export const LexicalSubmitPlugin = ({
    onSendMessage,
    isAutocompleteOpenRefs,
}: LexicalSubmitPluginProps): null => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        (): (() => void) =>
            editor.registerCommand(
                KEY_ENTER_COMMAND,
                (event: KeyboardEvent): boolean => {
                    if (event.shiftKey) {
                        return false;
                    }

                    // false positive: this runs inside the real KEY_ENTER_COMMAND
                    // handler registered below, not a useEffect reacting to a value
                    // change, so there's no separate event handler to move it into.
                    // react-doctor-disable-next-line react-doctor/no-event-handler
                    if (isAutocompleteOpenRefs?.some((ref) => ref.current)) {
                        // The ref can be stale immediately after the user picks a
                        // slash command (React state hasn't propagated yet). If the
                        // editor is already in chip mode the autocomplete is
                        // definitively closed, so don't block submit.
                        const isChipMode =
                            editor.getEditorState().read($getSlashChipState) !==
                            null;
                        if (!isChipMode) {
                            const shouldYieldToAutocomplete = editor
                                .getEditorState()
                                .read((): boolean =>
                                    shouldAutocompleteHandleEnter(
                                        $getTextBeforeCursor(),
                                    ),
                                );
                            if (shouldYieldToAutocomplete) {
                                return false;
                            }
                        }
                    }

                    if (window.innerWidth <= 768) {
                        return false;
                    }

                    event.preventDefault();

                    editor.getEditorState().read((): void => {
                        const rawText = $getRawMessageText();
                        void (async (): Promise<void> => {
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
        [editor, onSendMessage, isAutocompleteOpenRefs],
    );

    return null;
};
