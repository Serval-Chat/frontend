import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createParagraphNode,
    $createTextNode,
    $getNodeByKey,
    $getRoot,
    $isParagraphNode,
    $isTextNode,
    type NodeKey,
} from 'lexical';
import { X } from 'lucide-react';

import { colors, radius } from '@/ui/theme';

import type { SearchFilterData } from './SearchFilterNode';

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

const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    margin: '0 2px',
    padding: '1px 5px 1px 7px',
    borderRadius: radius.full,
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.6,
    userSelect: 'none',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
};

const chipEditButtonStyle: React.CSSProperties = {
    all: 'unset',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
};

const chipRemoveButtonStyle: React.CSSProperties = {
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
};

export function SearchFilterChip({
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
            const last = children.at(-1) ?? null;
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
            style={{
                ...chipStyle,
                backgroundColor: bg,
                color,
            }}
        >
            <button
                contentEditable={false}
                style={chipEditButtonStyle}
                tabIndex={-1}
                type="button"
                onClick={handleEdit}
            >
                <span style={{ opacity: 0.6, fontWeight: 400 }}>
                    {data.negated ? '-' : ''}
                    {data.label}:
                </span>{' '}
                {data.display}
            </button>
            <button
                contentEditable={false}
                style={chipRemoveButtonStyle}
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
