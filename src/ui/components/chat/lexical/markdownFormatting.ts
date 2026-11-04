import {
    $createTextNode,
    $getRoot,
    $getSelection,
    $isLineBreakNode,
    $isParagraphNode,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    COMPOSITION_END_TAG,
    FORMAT_TEXT_COMMAND,
    HISTORY_MERGE_TAG,
    IS_BOLD,
    IS_CODE,
    IS_HIGHLIGHT,
    IS_ITALIC,
    IS_STRIKETHROUGH,
    IS_UNDERLINE,
    type LexicalEditor,
    type LexicalNode,
    ParagraphNode,
    type PointType,
    type TextFormatType,
    TextNode,
} from 'lexical';

import {
    ParserPresets,
    type SourceMap,
    parseTextWithSourceMap,
} from '@/utils/textParser/parser';
import type { ASTNode } from '@/utils/textParser/types';

import { $isSpoilerChipNode } from './SpoilerChipNode';

interface DelimitedFormat {
    open: number;
    close: number;
    format: number;
}

const DELIMITED_FORMATS: Partial<Record<ASTNode['type'], DelimitedFormat>> = {
    bold: { open: 2, close: 2, format: IS_BOLD },
    italic: { open: 1, close: 1, format: IS_ITALIC },
    bold_italic: { open: 3, close: 3, format: IS_BOLD | IS_ITALIC },
    underline: { open: 2, close: 2, format: IS_UNDERLINE },
    double_underline: { open: 3, close: 3, format: IS_UNDERLINE },
    strikethrough: { open: 2, close: 2, format: IS_STRIKETHROUGH },
    spoiler: { open: 2, close: 2, format: IS_HIGHLIGHT },
    inline_code: { open: 1, close: 1, format: IS_CODE },
};

const SHORTCUT_DELIMITERS: Partial<Record<TextFormatType, string>> = {
    bold: '**',
    italic: '*',
    underline: '__',
    strikethrough: '~~',
    code: '`',
};

const CHIP_PLACEHOLDER = '￼';

function paintFormats(
    nodes: ASTNode[],
    base: number,
    text: string,
    sourceMap: SourceMap,
    formats: number[],
): void {
    for (const node of nodes) {
        const span = sourceMap.spans.get(node);
        if (!span) continue;
        const start = base + span.start;
        const end = base + span.end;

        const delimited = DELIMITED_FORMATS[node.type];
        if (delimited) {
            const contentStart = start + delimited.open;
            for (let i = contentStart; i < end - delimited.close; i++) {
                formats[i] = (formats[i] ?? 0) | delimited.format;
            }
            if ('content' in node && Array.isArray(node.content)) {
                paintFormats(
                    node.content,
                    contentStart,
                    text,
                    sourceMap,
                    formats,
                );
            }
            continue;
        }

        for (const value of Object.values(node)) {
            if (!Array.isArray(value)) continue;
            const source = sourceMap.sources.get(value as ASTNode[]);
            if (source === undefined) continue;
            const offset = text.indexOf(source, start);
            if (offset < 0 || offset + source.length > end) continue;
            paintFormats(value as ASTNode[], offset, text, sourceMap, formats);
        }
    }
}

let lastComputed: { text: string; formats: number[] } | null = null;

export function computeFormats(text: string): number[] {
    if (lastComputed?.text === text) return lastComputed.formats;

    const formats = Array.from<number>({ length: text.length }).fill(0);
    const { nodes, sourceMap } = parseTextWithSourceMap(
        text,
        ParserPresets.MESSAGE,
    );
    paintFormats(nodes, 0, text, sourceMap, formats);

    lastComputed = { text, formats };
    return formats;
}

interface Piece {
    node: LexicalNode;
    start: number;
    length: number;
    editable: boolean;
}

function $collectPieces(paragraph: ParagraphNode): {
    pieces: Piece[];
    text: string;
} {
    const pieces: Piece[] = [];
    let text = '';

    for (const node of paragraph.getChildren()) {
        let content = CHIP_PLACEHOLDER;
        let editable = false;
        if ($isTextNode(node) && node.isSimpleText()) {
            content = node.getTextContent();
            editable = true;
        } else if ($isSpoilerChipNode(node)) {
            content = node.getContent();
            editable = true;
        } else if ($isLineBreakNode(node)) {
            content = '\n';
        }
        pieces.push({
            node,
            start: text.length,
            length: content.length,
            editable,
        });
        text += content;
    }

    return { pieces, text };
}

function isPieceFormatted(piece: Piece, formats: number[]): boolean {
    if (!$isTextNode(piece.node)) return piece.length === 0;
    const format = piece.node.getFormat();
    for (let i = piece.start; i < piece.start + piece.length; i++) {
        if (formats[i] !== format) return false;
    }
    return true;
}

function $rebuildRun(run: Piece[], text: string, formats: number[]): void {
    const first = run[0]!;
    const last = run.at(-1)!;
    const end = last.start + last.length;
    if (end === first.start) return;

    const segments: { text: string; format: number }[] = [];
    for (let i = first.start; i < end; i++) {
        const current = segments.at(-1);
        if (current && current.format === formats[i]) current.text += text[i];
        else segments.push({ text: text[i]!, format: formats[i]! });
    }

    const reusable = run
        .map((piece) => piece.node)
        .filter((node): node is TextNode => $isTextNode(node));
    let previous: LexicalNode | null = null;

    for (const [i, segment] of segments.entries()) {
        const existing = reusable[i];
        const node = existing ?? $createTextNode();
        node.setTextContent(segment.text);
        node.setFormat(segment.format);
        if (!existing) {
            if (previous) previous.insertAfter(node);
            else first.node.insertBefore(node);
        }
        previous = node;
    }

    const kept = new Set<LexicalNode>(reusable.slice(0, segments.length));
    for (const piece of run) {
        if (!kept.has(piece.node)) piece.node.remove();
    }
}

function offsetOfPoint(
    point: PointType,
    paragraph: ParagraphNode,
    pieces: Piece[],
    textLength: number,
): number | null {
    if (point.type === 'text') {
        const piece = pieces.find((p) => p.node.getKey() === point.key);
        return piece ? piece.start + point.offset : null;
    }
    if (point.key !== paragraph.getKey()) return null;
    return pieces[point.offset]?.start ?? textLength;
}

function $placePoint(
    point: PointType,
    offset: number,
    paragraph: ParagraphNode,
    pieces: Piece[],
): void {
    // At a boundary, stay at the end of the earlier node so typing extends it
    const target = pieces.find(
        (p) =>
            $isTextNode(p.node) &&
            offset >= p.start &&
            offset <= p.start + p.length,
    );
    if (target) {
        point.set(target.node.getKey(), offset - target.start, 'text');
        return;
    }
    const index = pieces.filter((p) => p.start + p.length <= offset).length;
    point.set(paragraph.getKey(), index, 'element');
}

function $reformatParagraph(paragraph: ParagraphNode): void {
    const { pieces, text } = $collectPieces(paragraph);
    const formats = computeFormats(text);

    const runs: Piece[][] = [];
    let run: Piece[] = [];
    for (const piece of pieces) {
        if (piece.editable) {
            run.push(piece);
            continue;
        }
        if (run.length > 0) runs.push(run);
        run = [];
    }
    if (run.length > 0) runs.push(run);

    const stale = runs.filter(
        (r) => !r.every((piece) => isPieceFormatted(piece, formats)),
    );
    if (stale.length === 0) return;

    const selection = $getSelection();
    const range = $isRangeSelection(selection) ? selection : null;
    const anchorOffset = range
        ? offsetOfPoint(range.anchor, paragraph, pieces, text.length)
        : null;
    const focusOffset = range
        ? offsetOfPoint(range.focus, paragraph, pieces, text.length)
        : null;

    for (const r of stale) $rebuildRun(r, text, formats);

    if (!range) return;
    const rebuilt = $collectPieces(paragraph).pieces;
    if (anchorOffset !== null)
        $placePoint(range.anchor, anchorOffset, paragraph, rebuilt);
    if (focusOffset !== null)
        $placePoint(range.focus, focusOffset, paragraph, rebuilt);
    if (range.isCollapsed() && range.anchor.type === 'text') {
        range.format = range.anchor.getNode().getFormat();
    }
}

export function $reformatAll(): void {
    for (const block of $getRoot().getChildren()) {
        if ($isParagraphNode(block)) $reformatParagraph(block);
    }
}

/**
 * Keyboard shortcuts insert the delimiters rather than formatting invisibly,
 * because only the delimiters survive into the sent message.
 */
function $wrapSelection(format: TextFormatType): void {
    const delimiter = SHORTCUT_DELIMITERS[format];
    const selection = $getSelection();
    if (!delimiter || !$isRangeSelection(selection)) return;

    const [start, end] = selection.isBackward()
        ? [selection.focus, selection.anchor]
        : [selection.anchor, selection.focus];

    if (start.type !== 'text' || end.type !== 'text') {
        selection.insertText(
            delimiter + selection.getTextContent() + delimiter,
        );
        return;
    }

    const startNode = start.getNode() as TextNode;
    const endNode = end.getNode() as TextNode;
    const startOffset = start.offset;
    const endOffset = end.offset;

    endNode.spliceText(endOffset, 0, delimiter);
    startNode.spliceText(startOffset, 0, delimiter);

    const shift = startNode.is(endNode) ? delimiter.length : 0;
    selection.setTextNodeRange(
        startNode,
        startOffset + delimiter.length,
        endNode,
        endOffset + shift,
    );
}

export function registerMarkdownFormatting(editor: LexicalEditor): () => void {
    const $reformatParent = (node: TextNode): void => {
        if (editor.isComposing()) return;
        const parent = node.getParent();
        if ($isParagraphNode(parent)) $reformatParagraph(parent);
    };

    const unregisters = [
        editor.registerNodeTransform(TextNode, $reformatParent),
        editor.registerNodeTransform(ParagraphNode, (paragraph): void => {
            if (!editor.isComposing()) $reformatParagraph(paragraph);
        }),
        editor.registerCommand(
            FORMAT_TEXT_COMMAND,
            (format): boolean => {
                $wrapSelection(format);
                return true;
            },
            COMMAND_PRIORITY_LOW,
        ),
        // Transforms were skipped while the IME was composing
        editor.registerUpdateListener(({ tags }): void => {
            if (!tags.has(COMPOSITION_END_TAG)) return;
            editor.update($reformatAll, { tag: HISTORY_MERGE_TAG });
        }),
    ];

    return (): void => {
        for (const unregister of unregisters) unregister();
    };
}
