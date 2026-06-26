import {
    $getRoot,
    $isLineBreakNode,
    $isParagraphNode,
    $isTextNode,
    type LexicalNode,
} from 'lexical';

import { $isChipNode } from '@/ui/components/chat/lexical/ChipNode';

import { $isSlashArgChipNode } from './SlashArgChipNode';
import { $isSlashCommandChipNode } from './SlashCommandChipNode';

export function $getRawMessageText(): string {
    let rawText = '';
    const root = $getRoot();

    const traverse = (node: LexicalNode): void => {
        if ($isTextNode(node)) {
            let text = node.getTextContent();
            if (node.hasFormat('code')) {
                text = `\`${text}\``;
            } else {
                const prev = node.getPreviousSibling();
                const next = node.getNextSibling();
                const prevText = $isTextNode(prev) ? prev.getTextContent() : '';
                const nextText = $isTextNode(next) ? next.getTextContent() : '';

                const hasDelimiterSiblings = (delim: string): boolean =>
                    prevText.endsWith(delim) && nextText.startsWith(delim);

                const isBold = node.hasFormat('bold');
                const isItalic = node.hasFormat('italic');
                const isStrike = node.hasFormat('strikethrough');
                const isUnderline = node.hasFormat('underline');

                if (
                    !(
                        isBold &&
                        isItalic &&
                        (hasDelimiterSiblings('***') ||
                            hasDelimiterSiblings('___'))
                    )
                ) {
                    if (
                        isBold &&
                        !hasDelimiterSiblings('**') &&
                        !hasDelimiterSiblings('__')
                    ) {
                        text = `**${text}**`;
                    }
                    if (
                        isItalic &&
                        !hasDelimiterSiblings('*') &&
                        !hasDelimiterSiblings('_')
                    ) {
                        text = `*${text}*`;
                    }
                    if (isStrike && !hasDelimiterSiblings('~~')) {
                        text = `~~${text}~~`;
                    }
                    if (isUnderline) {
                        text = `__${text}__`;
                    }
                }
            }
            rawText += text;
        } else if ($isLineBreakNode(node)) {
            rawText += '\n';
        } else if ($isSlashCommandChipNode(node)) {
            rawText += node.getTextContent();
        } else if ($isSlashArgChipNode(node)) {
            rawText += node.getValue();
        } else if ($isChipNode(node)) {
            const type = node.getChipType();
            const payload = node.getPayload();
            switch (type) {
                case 'user':
                    rawText += `<userid:'${payload.id}'>`;
                    break;
                case 'role':
                    rawText += `<roleid:'${payload.id}'>`;
                    break;
                case 'emoji':
                    rawText += `<emoji:${payload.id}>`;
                    break;
                case 'everyone':
                    rawText += '<everyone>';
                    break;
                case 'channel':
                    rawText += `${window.location.origin}/chat/@server/${payload.serverId}/channel/${payload.id}`;
                    break;
                case 'unicode-emoji':
                    rawText += payload.id;
                    break;
            }
        }

        if ('getChildren' in node && typeof node.getChildren === 'function') {
            const children = node.getChildren();
            for (const child of children) {
                traverse(child);
            }
            if ($isParagraphNode(node)) {
                const parent = node.getParent();
                if (parent && node !== parent.getLastChild()) {
                    rawText += '\n';
                }
            }
        }
    };

    traverse(root);
    return rawText;
}
