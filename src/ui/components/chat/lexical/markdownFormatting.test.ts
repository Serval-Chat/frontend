import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    type LexicalEditor,
    type LexicalNode,
    createEditor,
} from 'lexical';
import { beforeEach, describe, expect, it } from 'vitest';

import { $isSpoilerChipNode, SpoilerChipNode } from './SpoilerChipNode';
import { registerMarkdownFormatting } from './markdownFormatting';

let editor: LexicalEditor;

const createTestEditor = (): LexicalEditor => {
    const testEditor = createEditor({
        namespace: 'test',
        nodes: [SpoilerChipNode],
        onError: (error: Error): void => {
            throw error;
        },
    });
    testEditor.setRootElement(document.createElement('div'));
    registerMarkdownFormatting(testEditor);

    testEditor.update(
        (): void => {
            const paragraph = $createParagraphNode();
            $getRoot().append(paragraph);
            paragraph.selectEnd();
        },
        { discrete: true },
    );

    return testEditor;
};

/**
 * The plugin reacts to an update by scheduling another one, so its work lands
 * a tick later. Draining with empty discrete updates makes that synchronous.
 */
const flush = (): void => {
    for (let i = 0; i < 3; i++) {
        editor.update((): void => {}, { discrete: true });
    }
};

/** Types one character at a time so plugin works ok */
const type = (text: string): void => {
    for (const char of text) {
        editor.update(
            (): void => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) selection.insertText(char);
            },
            { discrete: true },
        );
    }
    flush();
};

/**
 * Deletes the last character. Selects it and removes it.
 */
const backspace = (): void => {
    editor.update(
        (): void => {
            const last = $getRoot().getAllTextNodes().at(-1);
            if (!last) return;

            const end = last.getTextContent().length;
            last.select(end - 1, end);

            const selection = $getSelection();
            if ($isRangeSelection(selection)) selection.removeText();
        },
        { discrete: true },
    );
    flush();
};

const getTextNodes = (): {
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
}[] =>
    editor.getEditorState().read(() =>
        $getRoot()
            .getAllTextNodes()
            .map((node) => ({
                text: node.getTextContent(),
                bold: node.hasFormat('bold'),
                italic: node.hasFormat('italic'),
                underline: node.hasFormat('underline'),
            })),
    );

const findNode = (
    text: string,
):
    | { text: string; bold: boolean; italic: boolean; underline: boolean }
    | undefined => getTextNodes().find((node) => node.text.includes(text));

const getRawText = (): string =>
    editor.getEditorState().read(() => $getRoot().getTextContent());

const hasSpoilerChip = (): boolean =>
    editor.getEditorState().read((): boolean => {
        const walk = (node: LexicalNode): boolean => {
            if ($isSpoilerChipNode(node)) return true;
            return $isElementNode(node) ? node.getChildren().some(walk) : false;
        };
        return $getRoot().getChildren().some(walk);
    });

beforeEach((): void => {
    editor = createTestEditor();
});

describe('markdown formatting', (): void => {
    it('formats content between delimiters and keeps the delimiters as text', (): void => {
        type('**bold**');

        expect(findNode('bold')?.bold).toBe(true);
        expect(getRawText()).toBe('**bold**');
    });

    it('applies bold and italic for triple asterisks', (): void => {
        type('***test***');

        const content = findNode('test');
        expect(content?.bold).toBe(true);
        expect(content?.italic).toBe(true);
    });

    it('treats double underscores as underline, not bold', (): void => {
        type('__under__');

        const content = findNode('under');
        expect(content?.underline).toBe(true);
        expect(content?.bold).toBe(false);
    });

    it('renders the spoiler pill for double pipes, keeping the delimiters', (): void => {
        type('||secret||');

        expect(hasSpoilerChip()).toBe(true);
        expect(getRawText()).toContain('||');
    });

    it('drops the formatting when a closing delimiter is edited away', (): void => {
        type('***test***');
        expect(findNode('test')?.bold).toBe(true);

        // ***test*** -> ***test**
        backspace();

        expect(getRawText()).toBe('***test**');
        const content = findNode('test');
        expect(content?.bold).toBe(false);
        expect(content?.italic).toBe(false);
    });

    it('drops the formatting when an opening delimiter is edited away', (): void => {
        type('**bold**');

        editor.update(
            (): void => {
                const opening = $getRoot().getAllTextNodes()[0];
                opening?.setTextContent('*');
            },
            { discrete: true },
        );
        flush();

        expect(findNode('bold')?.bold).toBe(false);
    });

    it('leaves keyboard-shortcut formatting alone when there are no delimiters', (): void => {
        editor.update(
            (): void => {
                const paragraph = $getRoot().getFirstChild();
                if (!$isElementNode(paragraph)) return;

                const node = $createTextNode('shortcut');
                node.toggleFormat('bold');
                paragraph.append(node);
                node.selectEnd();
            },
            { discrete: true },
        );
        flush();

        type('!');

        expect(findNode('shortcut')?.bold).toBe(true);
    });
});
