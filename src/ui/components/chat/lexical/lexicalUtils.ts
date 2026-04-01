import {
    $getRoot,
    $isLineBreakNode,
    $isParagraphNode,
    $isTextNode,
    type LexicalNode,
} from 'lexical';

import { $isChipNode } from '@/ui/components/chat/lexical/ChipNode';

export function $getRawMessageText(): string {
    let rawText = '';
    const root = $getRoot();

    const traverse = (node: LexicalNode): void => {
        if ($isTextNode(node)) {
            rawText += node.getTextContent();
        } else if ($isLineBreakNode(node)) {
            rawText += '\n';
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
                    rawText += `#${payload.label || payload.id}`;
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
