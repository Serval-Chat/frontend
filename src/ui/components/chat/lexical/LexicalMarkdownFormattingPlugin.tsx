import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COLLABORATION_TAG,
    HISTORIC_TAG,
    type TextFormatType,
    type TextNode,
} from 'lexical';

interface TextFormatTransformer {
    tag: string;
    format: TextFormatType[];
}

const TRANSFORMERS: TextFormatTransformer[] = [
    { tag: '***', format: ['bold', 'italic'] },
    { tag: '___', format: ['bold', 'italic'] },
    { tag: '**', format: ['bold'] },
    { tag: '__', format: ['bold'] },
    { tag: '*', format: ['italic'] },
    { tag: '_', format: ['italic'] },
    { tag: '~~', format: ['strikethrough'] },
];

const TRANSFORMERS_BY_TRIGGER: Record<string, TextFormatTransformer[]> = {};
for (const t of TRANSFORMERS) {
    const trigger = t.tag.at(-1);
    if (trigger === undefined) continue;
    (TRANSFORMERS_BY_TRIGGER[trigger] ??= []).push(t);
}

function isEqualSubString(
    strA: string,
    aStart: number,
    strB: string,
    bStart: number,
    length: number,
): boolean {
    for (let i = 0; i < length; i++) {
        if (strA[aStart + i] !== strB[bStart + i]) return false;
    }
    return true;
}

function getOpenTagStartIndex(
    str: string,
    maxIndex: number,
    tag: string,
): number {
    const tagLen = tag.length;
    for (let i = maxIndex; i >= tagLen; i--) {
        const start = i - tagLen;
        if (
            isEqualSubString(str, start, tag, 0, tagLen) &&
            str[start + tagLen] !== ' '
        ) {
            return start;
        }
    }
    return -1;
}

function $applyVisualFormatting(
    anchorNode: TextNode,
    anchorOffset: number,
): boolean {
    const text = anchorNode.getTextContent();
    const closeTagEndIndex = anchorOffset - 1;
    const closeChar = text[closeTagEndIndex];
    if (closeChar === undefined) return false;
    const matchers = TRANSFORMERS_BY_TRIGGER[closeChar];
    if (!matchers) return false;

    for (const matcher of matchers) {
        const { tag, format: formats } = matcher;
        const tagLen = tag.length;
        const closeTagStartIndex = closeTagEndIndex - tagLen + 1;
        if (closeTagStartIndex < 0) continue;

        if (
            tagLen > 1 &&
            !isEqualSubString(text, closeTagStartIndex, tag, 0, tagLen)
        )
            continue;
        if (text[closeTagStartIndex - 1] === ' ') continue;

        const openTagStartIndex = getOpenTagStartIndex(
            text,
            closeTagStartIndex,
            tag,
        );
        if (openTagStartIndex < 0) continue;
        if (openTagStartIndex + tagLen === closeTagStartIndex) continue;

        // Prevent e.g. `*` matching when `**` is the intended tag
        if (openTagStartIndex > 0 && text[openTagStartIndex - 1] === closeChar)
            continue;

        const content = text.slice(
            openTagStartIndex + tagLen,
            closeTagStartIndex,
        );
        if (!content.trim()) continue;

        const before = text.slice(0, openTagStartIndex);
        const after = text.slice(closeTagEndIndex + 1);

        // Build nodes: [before?] [open-delim] [content(formatted)] [close-delim] [after?]
        const newNodes: TextNode[] = [];
        if (before) newNodes.push($createTextNode(before));

        newNodes.push($createTextNode(tag));

        const contentNode = $createTextNode(content);
        for (const fmt of formats) contentNode.toggleFormat(fmt);
        newNodes.push(contentNode);

        newNodes.push($createTextNode(tag));

        if (after) newNodes.push($createTextNode(after));

        // newNodes always has at least 3 entries: the open delimiter, the
        // content node, and the close delimiter are pushed unconditionally
        // above, so index 0 and the indices used below are always in range.
        anchorNode.replace(newNodes[0]!);
        let cur = newNodes[0]!;
        for (let i = 1; i < newNodes.length; i++) {
            const next = newNodes[i]!;
            cur.insertAfter(next);
            cur = next;
        }

        // Place cursor after closing delimiter
        const closingDelimIdx = newNodes.length - (after ? 2 : 1);
        const closingDelimNode = newNodes[closingDelimIdx]!;
        const focusNode = after ? newNodes.at(-1)! : closingDelimNode;
        const focusOffset = after ? 0 : tag.length;
        focusNode.select(focusOffset, focusOffset);

        return true;
    }
    return false;
}

export const LexicalMarkdownFormattingPlugin = (): null => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerUpdateListener(
                ({ tags, dirtyLeaves, editorState, prevEditorState }) => {
                    if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG))
                        return;
                    if (editor.isComposing()) return;

                    const selection = editorState.read($getSelection);
                    const prevSelection = prevEditorState.read($getSelection);

                    if (
                        !$isRangeSelection(prevSelection) ||
                        !$isRangeSelection(selection) ||
                        !selection.isCollapsed() ||
                        selection.is(prevSelection)
                    )
                        return;

                    const anchorKey = selection.anchor.key;
                    const anchorOffset = selection.anchor.offset;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const anchorNode = (editorState as any)._nodeMap.get(
                        anchorKey,
                    );

                    if (
                        !$isTextNode(anchorNode) ||
                        !dirtyLeaves.has(anchorKey) ||
                        (anchorOffset !== 1 &&
                            anchorOffset > prevSelection.anchor.offset + 1)
                    )
                        return;

                    editor.update(() => {
                        if (anchorNode.getParent() === null) return;
                        $applyVisualFormatting(
                            anchorNode,
                            selection.anchor.offset,
                        );
                    });
                },
            ),
        [editor],
    );

    return null;
};
