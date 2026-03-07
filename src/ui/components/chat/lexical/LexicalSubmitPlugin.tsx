import type React from 'react';
import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    CLEAR_EDITOR_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_ENTER_COMMAND,
} from 'lexical';

import { $getRawMessageText } from './lexicalUtils';

interface LexicalSubmitPluginProps {
    onSendMessage: (text: string) => void | Promise<void>;
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
                        return false;
                    }

                    if (window.innerWidth <= 768) {
                        return false;
                    }

                    event.preventDefault();

                    editor.getEditorState().read(() => {
                        const rawText = $getRawMessageText();
                        void onSendMessage(rawText);
                    });

                    setTimeout(() => {
                        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
                    }, 0);

                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
        [editor, onSendMessage, isAutocompleteOpenRef],
    );

    return null;
};
