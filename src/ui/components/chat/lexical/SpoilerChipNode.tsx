import React from 'react';

import {
    DecoratorNode,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';

import { Spoiler } from '@/ui/components/common/Spoiler';

export type SerializedSpoilerChipNode = SerializedLexicalNode & {
    content: string;
};

export class SpoilerChipNode extends DecoratorNode<React.ReactNode> {
    __content: string;

    static getType(): string {
        return 'spoiler-chip';
    }

    static clone(node: SpoilerChipNode): SpoilerChipNode {
        return new SpoilerChipNode(node.__content, node.__key);
    }

    constructor(content: string, key?: NodeKey) {
        super(key);
        this.__content = content;
    }

    createDOM(): HTMLElement {
        return document.createElement('span');
    }

    updateDOM(): false {
        return false;
    }

    getContent(): string {
        return this.__content;
    }

    isInline(): true {
        return true;
    }

    isKeyboardSelectable(): boolean {
        return false;
    }

    getTextContent(): string {
        return this.__content;
    }

    exportJSON(): SerializedSpoilerChipNode {
        return {
            type: 'spoiler-chip',
            version: 1,
            content: this.__content,
        };
    }

    static importJSON(
        serializedNode: SerializedSpoilerChipNode,
    ): SpoilerChipNode {
        return $createSpoilerChipNode(serializedNode.content);
    }

    decorate(): React.ReactNode {
        return <Spoiler alwaysRevealed>{this.__content}</Spoiler>;
    }
}

export function $createSpoilerChipNode(content: string): SpoilerChipNode {
    return new SpoilerChipNode(content);
}

export function $isSpoilerChipNode(
    node: LexicalNode | null | undefined,
): node is SpoilerChipNode {
    return node instanceof SpoilerChipNode;
}
