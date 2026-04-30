import React from 'react';

import {
    DecoratorNode,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';

import { SlashArgChipComponent } from './SlashArgChipComponent';

export const SLASH_ARG_INPUT_ATTR = 'data-slash-arg-idx';

export function focusSlashArgInput(editor: LexicalEditor, index: number): void {
    const root = editor.getRootElement();
    if (!root) return;
    const input = root.querySelector(
        `[${SLASH_ARG_INPUT_ATTR}="${index}"]`,
    ) as HTMLInputElement | null;
    if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
    }
}

export type SerializedSlashArgChipNode = SerializedLexicalNode & {
    argName: string;
    argIndex: number;
    required: boolean;
    value: string;
    isLast: boolean;
};

export class SlashArgChipNode extends DecoratorNode<React.ReactNode> {
    __argName: string;
    __argIndex: number;
    __required: boolean;
    __value: string;
    __isLast: boolean;

    static getType(): string {
        return 'slash-arg-chip';
    }

    static clone(node: SlashArgChipNode): SlashArgChipNode {
        return new SlashArgChipNode(
            node.__argName,
            node.__argIndex,
            node.__required,
            node.__value,
            node.__isLast,
            node.__key,
        );
    }

    constructor(
        argName: string,
        argIndex: number,
        required: boolean,
        value: string,
        isLast: boolean,
        key?: NodeKey,
    ) {
        super(key);
        this.__argName = argName;
        this.__argIndex = argIndex;
        this.__required = required;
        this.__value = value;
        this.__isLast = isLast;
    }

    getArgName(): string {
        return this.__argName;
    }
    getArgIndex(): number {
        return this.__argIndex;
    }
    isRequired(): boolean {
        return this.__required;
    }
    getValue(): string {
        return this.__value;
    }

    setValue(value: string): void {
        const writable = this.getWritable();
        writable.__value = value;
    }

    createDOM(): HTMLElement {
        const span = document.createElement('span');
        span.style.display = 'inline';
        return span;
    }

    updateDOM(): false {
        return false;
    }
    isInline(): true {
        return true;
    }
    isKeyboardSelectable(): boolean {
        return false;
    }

    getTextContent(): string {
        return this.__value;
    }

    exportJSON(): SerializedSlashArgChipNode {
        return {
            type: 'slash-arg-chip',
            version: 1,
            argName: this.__argName,
            argIndex: this.__argIndex,
            required: this.__required,
            value: this.__value,
            isLast: this.__isLast,
        };
    }

    static importJSON(node: SerializedSlashArgChipNode): SlashArgChipNode {
        return new SlashArgChipNode(
            node.argName,
            node.argIndex,
            node.required,
            node.value,
            node.isLast,
        );
    }

    decorate(editor: LexicalEditor): React.ReactNode {
        return React.createElement(SlashArgChipComponent, {
            argIndex: this.__argIndex,
            argName: this.__argName,
            editor,
            isLast: this.__isLast,
            nodeKey: this.getKey(),
            required: this.__required,
            value: this.__value,
        });
    }
}

export function $createSlashArgChipNode(
    argName: string,
    argIndex: number,
    required: boolean,
    isLast: boolean,
): SlashArgChipNode {
    return new SlashArgChipNode(argName, argIndex, required, '', isLast);
}

export function $isSlashArgChipNode(
    node: LexicalNode | null | undefined,
): node is SlashArgChipNode {
    return node instanceof SlashArgChipNode;
}
