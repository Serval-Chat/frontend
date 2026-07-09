import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TextNode } from 'lexical';

import { $createChipNode } from '@/ui/components/chat/lexical/ChipNode';
import { emojiRegex } from '@/utils/emoji';

/**
 * @description A Lexical plugin that automatically transforms Unicode emojis into ChipNodes.
 */
export const LexicalEmojiPlugin = (): null => {
    const [editor] = useLexicalComposerContext();

    useEffect((): (() => void) => {
        const emojiTransform = (node: TextNode): void => {
            const text = node.getTextContent();
            const match = emojiRegex.exec(text);

            if (match) {
                const emoji = match[0];
                const startIndex = match.index;
                const endIndex = startIndex + emoji.length;

                let targetNode = node;
                if (startIndex > 0) {
                    const [, splitNode] = node.splitText(startIndex);
                    if (!splitNode) return;
                    targetNode = splitNode;
                }
                const [emojiNode, nextNode] = targetNode.splitText(
                    endIndex - startIndex,
                );
                if (!emojiNode) return;

                const chipNode = $createChipNode('unicode-emoji', {
                    id: emoji,
                });
                emojiNode.replace(chipNode);

                if (nextNode) {
                    emojiTransform(nextNode);
                }
            }
        };

        return editor.registerNodeTransform(TextNode, emojiTransform);
    }, [editor]);

    return null;
};
