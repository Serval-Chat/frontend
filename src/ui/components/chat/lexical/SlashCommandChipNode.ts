import React from 'react';

import {
    DecoratorNode,
    type LexicalEditor,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';

import { SlashCommandChipComponent } from './SlashCommandChipComponent';

export type SerializedSlashCommandChipNode = SerializedLexicalNode & {
    commandName: string;
    commandId?: string;
};

export class SlashCommandChipNode extends DecoratorNode<React.ReactNode> {
    __commandName: string;
    __commandId?: string;

    static getType(): string {
        return 'slash-command-chip';
    }

    static clone(node: SlashCommandChipNode): SlashCommandChipNode {
        return new SlashCommandChipNode(
            node.__commandName,
            node.__commandId,
            node.__key,
        );
    }

    constructor(commandName: string, commandId?: string, key?: NodeKey) {
        super(key);
        this.__commandName = commandName;
        this.__commandId = commandId;
    }

    getCommandName(): string {
        return this.__commandName;
    }

    getCommandId(): string | undefined {
        return this.__commandId;
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
            commandId: this.__commandId,
        };
    }

    static importJSON(
        node: SerializedSlashCommandChipNode,
    ): SlashCommandChipNode {
        return new SlashCommandChipNode(node.commandName, node.commandId);
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
    commandId?: string,
): SlashCommandChipNode {
    return new SlashCommandChipNode(commandName, commandId);
}
