import React from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createParagraphNode,
    $createTextNode,
    $getNodeByKey,
    $getRoot,
    $isParagraphNode,
    $isTextNode,
    DecoratorNode,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';
import { X } from 'lucide-react';

import type { SearchFilters } from '@/api/chat/chat.types';
import { colors, radius } from '@/ui/theme';

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

function chipColors(data: SearchFilterData): { bg: string; color: string } {
    if (data.negated)
        return { bg: colors.dangerMuted, color: colors.dangerMutedText };
    const k = data.filterKey;
    if (k === 'fromUser' || k === 'mentionsUser')
        return { bg: colors.primaryMuted, color: colors.primaryMutedText };
    if (k === 'inChannel' || k === 'inCategory')
        return { bg: colors.primaryMuted, color: colors.primaryMutedText };
    if (k === 'hasFile' || k === 'hasEmbed' || k === 'hasLink')
        return { bg: colors.successMuted, color: colors.successMutedText };
    if (k === 'isPinned' || k === 'authorType')
        return { bg: colors.cautionMuted, color: colors.cautionMutedText };
    return { bg: colors.bgSubtle, color: colors.mutedForeground };
}

function SearchFilterChip({
    data,
    nodeKey,
}: {
    data: SearchFilterData;
    nodeKey: NodeKey;
}) {
    const [editor] = useLexicalComposerContext();
    const { bg, color } = chipColors(data);

    // click the chip body to remove it and re-insert the raw token at the end so the
    // autocomplete / date-picker opens and the user can change the value.
    const handleEdit = () => {
        const token = `${data.negated ? '-' : ''}${data.label}:${String(data.filterValue)}`;
        editor.update(() => {
            $getNodeByKey(nodeKey)?.remove();
            const root = $getRoot();
            let para;
            const first = root.getFirstChild();
            if ($isParagraphNode(first)) {
                para = first;
            } else {
                para = $createParagraphNode();
                root.append(para);
            }
            const children = para.getChildren();
            const last = children[children.length - 1] ?? null;
            if (last !== null && $isTextNode(last)) {
                const t = last.getTextContent();
                const next = (t.trimEnd() ? `${t.trimEnd()} ` : '') + token;
                last.setTextContent(next);
                last.select(next.length, next.length);
            } else {
                const textNode = $createTextNode(token);
                para.append(textNode);
                textNode.select(token.length, token.length);
            }
        });
        editor.focus();
    };

    return (
        <span
            contentEditable={false}
            role="button"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                margin: '0 2px',
                padding: '1px 5px 1px 7px',
                borderRadius: radius.full,
                backgroundColor: bg,
                color,
                fontSize: '0.72rem',
                fontWeight: 500,
                lineHeight: 1.6,
                userSelect: 'none',
                verticalAlign: 'middle',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
            }}
            tabIndex={-1}
            onClick={handleEdit}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEdit();
                }
            }}
        >
            <span style={{ opacity: 0.6, fontWeight: 400 }}>
                {data.negated ? '-' : ''}
                {data.label}:
            </span>{' '}
            {data.display}
            <button
                contentEditable={false}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    padding: '0 1px',
                    cursor: 'pointer',
                    color: 'inherit',
                    opacity: 0.5,
                    fontSize: '1rem',
                    lineHeight: 1,
                    marginLeft: 2,
                }}
                tabIndex={-1}
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.update(() => {
                        $getNodeByKey(nodeKey)?.remove();
                    });
                }}
            >
                <X size={10} />
            </button>
        </span>
    );
}

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
