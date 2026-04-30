import React from 'react';

import {
    DecoratorNode,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    createCommand,
} from 'lexical';

import { SlashCommandChipComponent } from './SlashCommandChipComponent';

/**
 * Dispatch this command to cancel the active slash command and clear all chips.
 * The handler is registered in LexicalSlashCommandPlugin to avoid circular deps.
 */
export const CANCEL_SLASH_COMMAND = createCommand<void>('CANCEL_SLASH_COMMAND');

export type SerializedSlashCommandChipNode = SerializedLexicalNode & {
    commandName: string;
};

export class SlashCommandChipNode extends DecoratorNode<React.ReactNode> {
    __commandName: string;

    static getType(): string {
        return 'slash-command-chip';
    }

    static clone(node: SlashCommandChipNode): SlashCommandChipNode {
        return new SlashCommandChipNode(node.__commandName, node.__key);
    }

    constructor(commandName: string, key?: NodeKey) {
        super(key);
        this.__commandName = commandName;
    }

    getCommandName(): string {
        return this.__commandName;
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
        return `/${this.__commandName} `;
    }

    exportJSON(): SerializedSlashCommandChipNode {
        return {
            type: 'slash-command-chip',
            version: 1,
            commandName: this.__commandName,
        };
    }

    static importJSON(
        node: SerializedSlashCommandChipNode,
    ): SlashCommandChipNode {
        return new SlashCommandChipNode(node.commandName);
    }

    decorate(editor: LexicalEditor): React.ReactNode {
        return React.createElement(SlashCommandChipComponent, {
            commandName: this.__commandName,
            editor,
        });
    }
}

export function $createSlashCommandChipNode(
    commandName: string,
): SlashCommandChipNode {
    return new SlashCommandChipNode(commandName);
}

export function $isSlashCommandChipNode(
    node: LexicalNode | null | undefined,
): node is SlashCommandChipNode {
    return node instanceof SlashCommandChipNode;
}
