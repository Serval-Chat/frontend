import React from 'react';

import {
    DecoratorNode,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';

import { ChannelLink } from '@/ui/components/chat/ChannelLink';
import { Mention } from '@/ui/components/common/Mention';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { RoleMention } from '@/ui/components/common/RoleMention';

export type ChipType = 'user' | 'role' | 'everyone' | 'emoji' | 'channel';

export interface ChipPayload {
    id: string;
    label?: string; // For users, roles, channels
    color?: string; // For roles
    imageUrl?: string; // For custom emojis
    serverId?: string; // For channels
}

export type SerializedChipNode = SerializedLexicalNode & {
    chipType: ChipType;
    payload: ChipPayload;
};

export class ChipNode extends DecoratorNode<React.ReactNode> {
    __chipType: ChipType;
    __payload: ChipPayload;

    static getType(): string {
        return 'chip';
    }

    static clone(node: ChipNode): ChipNode {
        return new ChipNode(node.__chipType, node.__payload, node.__key);
    }

    constructor(chipType: ChipType, payload: ChipPayload, key?: NodeKey) {
        super(key);
        this.__chipType = chipType;
        this.__payload = payload;
    }

    createDOM(): HTMLElement {
        const dom = document.createElement('span');
        dom.style.display = 'inline-flex';
        dom.style.alignItems = 'baseline';
        return dom;
    }

    updateDOM(): false {
        return false;
    }

    getChipType(): ChipType {
        return this.__chipType;
    }

    getPayload(): ChipPayload {
        return this.__payload;
    }

    isInline(): true {
        return true;
    }

    isKeyboardSelectable(): boolean {
        return false;
    }

    getTextContent(): string {
        switch (this.__chipType) {
            case 'user':
                return `@${this.__payload.label || this.__payload.id}`;
            case 'role':
                return `@${this.__payload.label || this.__payload.id}`;
            case 'everyone':
                return '@everyone';
            case 'channel':
                return `#${this.__payload.label || this.__payload.id}`;
            case 'emoji':
                return `:${this.__payload.label || this.__payload.id}:`;
            default:
                return '';
        }
    }

    exportJSON(): SerializedChipNode {
        return {
            type: 'chip',
            version: 1,
            chipType: this.__chipType,
            payload: this.__payload,
        };
    }

    static importJSON(serializedNode: SerializedChipNode): ChipNode {
        const node = $createChipNode(
            serializedNode.chipType,
            serializedNode.payload,
        );
        return node;
    }

    decorate(): React.ReactNode {
        switch (this.__chipType) {
            case 'user':
                return <Mention userId={this.__payload.id} />;

            case 'role':
                return <RoleMention roleId={this.__payload.id} />;

            case 'everyone':
                return (
                    <span
                        className="mx-0.5 inline-flex items-baseline rounded bg-primary px-1.5 text-[0.9em] font-medium text-white shadow-sm"
                        style={{ verticalAlign: 'baseline' }}
                    >
                        @everyone
                    </span>
                );

            case 'channel':
                return (
                    <ChannelLink
                        channelId={this.__payload.id}
                        serverId={this.__payload.serverId || ''}
                    />
                );

            case 'emoji':
                return (
                    <ParsedEmoji
                        className="mx-px align-middle"
                        emojiId={this.__payload.id}
                        style={{
                            width: '1.2em',
                            height: '1.2em',
                            transform: 'translateY(-1px)',
                        }}
                    />
                );

            default:
                return null;
        }
    }
}

export function $createChipNode(
    chipType: ChipType,
    payload: ChipPayload,
): ChipNode {
    return new ChipNode(chipType, payload);
}

export function $isChipNode(
    node: LexicalNode | null | undefined,
): node is ChipNode {
    return node instanceof ChipNode;
}
