import {
    $createTextNode,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isTextNode,
    COLLABORATION_TAG,
    HISTORIC_TAG,
    type LexicalEditor,
    type LexicalNode,
    type TextFormatType,
} from 'lexical';

import { $createSpoilerChipNode, $isSpoilerChipNode } from './SpoilerChipNode';

interface TextFormatTransformer {
    tag: string;
    formats: TextFormatType[] | null;
}

const TRANSFORMERS: TextFormatTransformer[] = [
    { tag: '***', formats: ['bold', 'italic'] },
    { tag: '**', formats: ['bold'] },
    { tag: '*', formats: ['italic'] },
    { tag: '__', formats: ['underline'] },
    { tag: '~~', formats: ['strikethrough'] },
    { tag: '`', formats: ['code'] },
    { tag: '||', formats: null },
];

const FORMAT_TYPES: TextFormatType[] = [
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'code',
];

function $createContentNode(
    transformer: TextFormatTransformer,
    content: string,
): LexicalNode {
    if (transformer.formats === null) return $createSpoilerChipNode(content);
    const node = $createTextNode(content);
    for (const fmt of transformer.formats) node.toggleFormat(fmt);
    return node;
}

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
        const { tag } = matcher;
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

        if (openTagStartIndex > 0 && text[openTagStartIndex - 1] === closeChar)
            continue;

        const content = text.slice(
            openTagStartIndex + tagLen,
            closeTagStartIndex,
        );
        if (!content.trim()) continue;

        const before = text.slice(0, openTagStartIndex);
        const after = text.slice(closeTagEndIndex + 1);

        const newNodes: LexicalNode[] = [];
        if (before) newNodes.push($createTextNode(before));

        newNodes.push($createTextNode(tag));
        newNodes.push($createContentNode(matcher, content));

        const closingDelim = $createTextNode(tag);
        newNodes.push(closingDelim);

        const afterNode = after ? $createTextNode(after) : null;
        if (afterNode) newNodes.push(afterNode);

        anchorNode.replace(newNodes[0]!);
        let cur = newNodes[0]!;
        for (let i = 1; i < newNodes.length; i++) {
            const next = newNodes[i]!;
            cur.insertAfter(next);
            cur = next;
        }

        const focusNode = afterNode ?? closingDelim;
        const focusOffset = afterNode ? 0 : tag.length;
        focusNode.select(focusOffset, focusOffset);

        return true;
    }
    return false;
}

/**
 * The tag whose delimiters would have produced this node, or null if the node
 * isn't something this plugin formats.
 */
function $tagForContentNode(node: LexicalNode): string | null {
    if ($isSpoilerChipNode(node)) return '||';
    if (!$isTextNode(node)) return null;

    const active = FORMAT_TYPES.filter((fmt) => node.hasFormat(fmt));
    if (active.length === 0) return null;

    const match = TRANSFORMERS.find(
        (transformer) =>
            transformer.formats !== null &&
            transformer.formats.length === active.length &&
            transformer.formats.every((fmt) => active.includes(fmt)),
    );
    return match?.tag ?? null;
}

function $findBrokenFormatting(): LexicalNode[] {
    const broken: LexicalNode[] = [];

    for (const block of $getRoot().getChildren()) {
        if (!$isElementNode(block)) continue;

        for (const node of block.getChildren()) {
            const tag = $tagForContentNode(node);
            if (tag === null) continue;

            const prev = node.getPreviousSibling();
            const next = node.getNextSibling();
            const openOk =
                $isTextNode(prev) && prev.getTextContent().endsWith(tag);
            const closeOk =
                $isTextNode(next) && next.getTextContent().startsWith(tag);

            if (openOk !== closeOk) broken.push(node);
        }
    }

    return broken;
}

function $stripFormatting(node: LexicalNode): void {
    if ($isSpoilerChipNode(node)) {
        node.replace($createTextNode(node.getContent()));
    } else if ($isTextNode(node)) {
        node.setFormat(0);
    }
}

export function registerMarkdownFormatting(editor: LexicalEditor): () => void {
    return editor.registerUpdateListener(
        ({ tags, dirtyLeaves, editorState, prevEditorState }) => {
            if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG)) return;
            if (editor.isComposing()) return;

            // Editing a delimiter has to be able to take formatting back off
            if (editorState.read(() => $findBrokenFormatting().length > 0)) {
                editor.update(() => {
                    for (const node of $findBrokenFormatting()) {
                        $stripFormatting(node);
                    }
                });
            }

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
            const anchorNode = (editorState as any)._nodeMap.get(anchorKey);

            if (
                !$isTextNode(anchorNode) ||
                !dirtyLeaves.has(anchorKey) ||
                (anchorOffset !== 1 &&
                    anchorOffset > prevSelection.anchor.offset + 1)
            )
                return;

            editor.update(() => {
                if (anchorNode.getParent() === null) return;
                $applyVisualFormatting(anchorNode, selection.anchor.offset);
            });
        },
    );
}
