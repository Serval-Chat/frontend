import React from 'react';

import {
    DecoratorNode,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';

import type { SearchFilters } from '@/api/chat/chat.types';

import { SearchFilterChip } from './SearchFilterChip';

export interface SearchFilterData {
    filterKey: keyof SearchFilters;
    filterValue: string | boolean;
    /** Short key label shown in the chip: 'from', 'in', 'has', etc. */
    label: string;
    /** Human-readable value: 'cat', '#general', 'file', 'true', etc. */
    display: string;
    negated: boolean;
}

export type SerializedSearchFilterNode = SerializedLexicalNode & {
    data: SearchFilterData;
};

export class SearchFilterNode extends DecoratorNode<React.ReactNode> {
    __data: SearchFilterData;

    static getType(): string {
        return 'search-filter';
    }

    static clone(node: SearchFilterNode): SearchFilterNode {
        return new SearchFilterNode(node.__data, node.__key);
    }

    constructor(data: SearchFilterData, key?: NodeKey) {
        super(key);
        this.__data = data;
    }

    createDOM(): HTMLElement {
        const el = document.createElement('span');
        el.style.display = 'inline';
        return el;
    }

    updateDOM(): false {
        return false;
    }

    getData(): SearchFilterData {
        return this.__data;
    }

    isInline(): true {
        return true;
    }

    isKeyboardSelectable(): boolean {
        return true;
    }

    getTextContent(): string {
        const { label, display, negated } = this.__data;
        return `${negated ? '-' : ''}${label}:${display}`;
    }

    exportJSON(): SerializedSearchFilterNode {
        return { type: 'search-filter', version: 1, data: this.__data };
    }

    static importJSON(s: SerializedSearchFilterNode): SearchFilterNode {
        return new SearchFilterNode(s.data);
    }

    decorate(): React.ReactNode {
        return <SearchFilterChip data={this.__data} nodeKey={this.__key} />;
    }
}

export function $createSearchFilterNode(
    data: SearchFilterData,
): SearchFilterNode {
    return new SearchFilterNode(data);
}

export function $isSearchFilterNode(
    node: LexicalNode | null | undefined,
): node is SearchFilterNode {
    return node instanceof SearchFilterNode;
}
