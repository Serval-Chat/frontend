import type React from 'react';
import { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createLineBreakNode,
    $createParagraphNode,
    $createTextNode,
    $getRoot,
} from 'lexical';

import { $createChipNode } from './ChipNode';

export const LexicalInitPlugin = ({
    initialText,
}: {
    initialText: string;
}): React.ReactNode => {
    const [editor] = useLexicalComposerContext();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        editor.update(() => {
            const root = $getRoot();
            root.clear();
            const p = $createParagraphNode();

            const tokenRegex =
                /(<userid:'[^']+'>|<roleid:'[^']+'>|<emoji:[^>]+>|<everyone>)/g;

            const parts = initialText.split(tokenRegex);

            parts.forEach((part) => {
                if (!part) return;

                if (part === '<everyone>') {
                    p.append($createChipNode('everyone', { id: 'everyone' }));
                } else if (
                    part.startsWith("<userid:'") &&
                    part.endsWith("'>")
                ) {
                    const id = part.slice(9, -2);
                    p.append($createChipNode('user', { id }));
                } else if (
                    part.startsWith("<roleid:'") &&
                    part.endsWith("'>")
                ) {
                    const id = part.slice(9, -2);
                    p.append($createChipNode('role', { id }));
                } else if (part.startsWith('<emoji:') && part.endsWith('>')) {
                    const id = part.slice(7, -1);
                    p.append($createChipNode('emoji', { id }));
                } else {
                    const lines = part.split('\n');
                    lines.forEach((line, i) => {
                        if (line) {
                            p.append($createTextNode(line));
                        }
                        if (i < lines.length - 1) {
                            p.append($createLineBreakNode());
                        }
                    });
                }
            });

            root.append(p);
        });
    }, [editor, initialText]);

    return null;
};
