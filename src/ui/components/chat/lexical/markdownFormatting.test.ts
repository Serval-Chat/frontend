import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    FORMAT_TEXT_COMMAND,
    type LexicalEditor,
    type TextFormatType,
    createEditor,
} from 'lexical';
import { beforeEach, describe, expect, it } from 'vitest';

import { $createSpoilerChipNode, SpoilerChipNode } from './SpoilerChipNode';
import { $getRawMessageText } from './lexicalUtils';
import { $reformatAll, registerMarkdownFormatting } from './markdownFormatting';

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
    // What RichTextPlugin does with the shortcut when nothing intercepts it
    testEditor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format): boolean => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) selection.formatText(format);
            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );
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

/** Drains follow-up updates so assertions see settled state */
const flush = (): void => {
    for (let i = 0; i < 3; i++) {
        editor.update((): void => {}, { discrete: true });
    }
};

/** Types one character per update, like a keyboard does */
const type = (text: string): void => {
    for (const char of text) {
        editor.update(
            (): void => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) selection.insertText(char);
            },
            { discrete: true },
        );
        flush();
    }
};

const paste = (text: string): void => {
    editor.update(
        (): void => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) selection.insertText(text);
        },
        { discrete: true },
    );
    flush();
};

/** Absolute caret offset within the paragraph's text */
const caretOffset = (): number =>
    editor.getEditorState().read((): number => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return -1;
        let offset = 0;
        for (const node of $getRoot().getAllTextNodes()) {
            if (node.getKey() === selection.anchor.key)
                return offset + selection.anchor.offset;
            offset += node.getTextContentSize();
        }
        return -1;
    });

/**
 * Puts the caret at an absolute offset. `side` picks which node gets it when
 * the offset is a node boundary, since browsers can report either.
 */
const moveCaret = (
    offset: number,
    side: 'before' | 'after' = 'before',
): void => {
    editor.update(
        (): void => {
            let remaining = offset;
            const nodes = $getRoot().getAllTextNodes();
            for (const [i, node] of nodes.entries()) {
                const size = node.getTextContentSize();
                const isLast = i === nodes.length - 1;
                if (
                    remaining < size ||
                    (remaining === size && (side === 'before' || isLast))
                ) {
                    const selection = node.select(remaining, remaining);
                    selection.format = node.getFormat();
                    return;
                }
                remaining -= size;
            }
        },
        { discrete: true },
    );
    flush();
};

/** Deletes the character before the caret (jsdom can't run deleteCharacter) */
const deleteBackward = (): void => {
    const offset = caretOffset();
    editor.update(
        (): void => {
            let remaining = offset - 1;
            for (const node of $getRoot().getAllTextNodes()) {
                const size = node.getTextContentSize();
                if (remaining < size) {
                    node.select(remaining, remaining + 1).removeText();
                    return;
                }
                remaining -= size;
            }
        },
        { discrete: true },
    );
    flush();
};

const sentText = (): string => editor.getEditorState().read($getRawMessageText);

const formatsOf = (text: string): TextFormatType[] =>
    editor.getEditorState().read((): TextFormatType[] => {
        const node = $getRoot()
            .getAllTextNodes()
            .find((n) => n.getTextContent() === text);
        if (!node) throw new Error(`no node with text ${JSON.stringify(text)}`);
        const all: TextFormatType[] = [
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code',
            'highlight',
        ];
        return all.filter((format) => node.hasFormat(format));
    });

const isPlain = (): boolean =>
    editor.getEditorState().read((): boolean =>
        $getRoot()
            .getAllTextNodes()
            .every((node) => node.getFormat() === 0),
    );

beforeEach((): void => {
    editor = createTestEditor();
});

describe('markdown formatting', (): void => {
    it('formats content between delimiters and keeps the delimiters as text', (): void => {
        type('**bold**');

        expect(formatsOf('bold')).toEqual(['bold']);
        expect(sentText()).toBe('**bold**');
    });

    it('applies bold and italic for triple asterisks', (): void => {
        type('***test***');

        expect(formatsOf('test')).toEqual(['bold', 'italic']);
    });

    it('treats double underscores as underline, not bold', (): void => {
        type('__under__');

        expect(formatsOf('under')).toEqual(['underline']);
    });

    it('shows spoilers as editable highlighted text', (): void => {
        type('||secret||');

        expect(formatsOf('secret')).toEqual(['highlight']);
        expect(sentText()).toBe('||secret||');
    });

    it('follows the renderer when a closing delimiter is edited away', (): void => {
        type('***test***');
        deleteBackward();

        // `***test**` renders as `*` followed by bold `test`
        expect(sentText()).toBe('***test**');
        expect(formatsOf('test')).toEqual(['bold']);
    });

    it('drops the formatting when an opening delimiter is edited away', (): void => {
        type('**bold**');
        moveCaret(1);
        deleteBackward();

        expect(sentText()).toBe('*bold**');
        expect(isPlain()).toBe(true);
    });

    describe('sent text matches what was typed', (): void => {
        it.each([
            ['inline code', '`abc`'],
            ['two code spans', '`a` `b`'],
            ['underline', '__u__'],
            ['dunder identifiers', 'call __init__ now'],
            ['urls with underscores', 'https://example.com/__init__ '],
            ['mixed', '~~s~~ **b** *i* ***bi*** ||sp||'],
        ])('%s', (_label, text): void => {
            type(text);

            expect(sentText()).toBe(text);
        });

        it('does not underline inside a url', (): void => {
            type('https://example.com/__init__ ');

            expect(isPlain()).toBe(true);
        });
    });

    describe('formats no matter where the caret was when the span completed', (): void => {
        it('typing inside an empty pair of backticks', (): void => {
            type('``');
            moveCaret(1);
            type('abc');

            expect(formatsOf('abc')).toEqual(['code']);
            expect(caretOffset()).toBe(4);
        });

        it('typing inside an empty pair of double asterisks', (): void => {
            type('****');
            moveCaret(2);
            type('bold');

            expect(formatsOf('bold')).toEqual(['bold']);
        });

        it('typing the opening delimiter last', (): void => {
            type('abc`');
            moveCaret(0);
            type('`');

            expect(formatsOf('abc')).toEqual(['code']);
        });

        it('pasting a whole span at once', (): void => {
            paste('**a**');

            expect(formatsOf('a')).toEqual(['bold']);
        });
    });

    describe('editing inside formatted text', (): void => {
        it.each([
            ['end of the opening delimiter', 2, 'before'],
            ['start of the content', 2, 'after'],
            ['end of the content', 6, 'before'],
            ['start of the closing delimiter', 6, 'after'],
        ] as const)(
            'keeps the format when typing at the %s',
            (_label, offset, side): void => {
                type('**bold**');
                moveCaret(offset, side);
                type('X');

                expect(sentText()).toBe(
                    `**${'bold'.slice(0, offset - 2)}X${'bold'.slice(offset - 2)}**`,
                );
                expect(formatsOf(offset === 2 ? 'Xbold' : 'boldX')).toEqual([
                    'bold',
                ]);
            },
        );

        it('nests a span typed inside bold without corrupting the message', (): void => {
            type('**ab cd**');
            moveCaret(4);
            type(' *x* ');

            expect(sentText()).toBe('**ab *x*  cd**');
            expect(formatsOf('x')).toEqual(['bold', 'italic']);
        });

        it('nests a span typed inside code as literal code', (): void => {
            type('`ab cd`');
            moveCaret(3);
            type(' *x* ');

            expect(sentText()).toBe('`ab *x*  cd`');
            expect(formatsOf('ab *x*  cd')).toEqual(['code']);
        });
    });

    describe('agrees with the message renderer', (): void => {
        it('previews nested formatting', (): void => {
            type('**a *b* c**');

            expect(formatsOf('a *')).toEqual(['bold']);
            expect(formatsOf('b')).toEqual(['bold', 'italic']);
        });

        it('does not format inside inline code', (): void => {
            type('`a*b*c`');

            expect(formatsOf('a*b*c')).toEqual(['code']);
        });

        it('respects escapes', (): void => {
            type('\\*a\\*');

            expect(isPlain()).toBe(true);
        });

        it('allows spaces inside inline code', (): void => {
            type('` a `');

            expect(formatsOf(' a ')).toEqual(['code']);
        });

        it('formats underscore italics and double underlines', (): void => {
            type('___x___');

            expect(formatsOf('x')).toEqual(['underline']);
        });
    });

    describe('keyboard shortcuts', (): void => {
        it('wraps the selection in delimiters', (): void => {
            type('make this bold');
            editor.update(
                (): void => {
                    const node = $getRoot().getAllTextNodes()[0]!;
                    node.select(5, 9);
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                },
                { discrete: true },
            );

            expect(sentText()).toBe('make **this** bold');
            expect(formatsOf('this')).toEqual(['bold']);
            expect(
                editor
                    .getEditorState()
                    .read(() => $getSelection()?.getTextContent()),
            ).toBe('this');
        });

        it('wraps text that already has delimiters without mangling them', (): void => {
            type('`ab`');
            editor.update(
                (): void => {
                    const nodes = $getRoot().getAllTextNodes();
                    const last = nodes.at(-1)!;
                    const selection = nodes[0]!.select(0, 0);
                    selection.focus.set(
                        last.getKey(),
                        last.getTextContentSize(),
                        'text',
                    );
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                },
                { discrete: true },
            );

            expect(sentText()).toBe('**`ab`**');
            expect(formatsOf('ab')).toEqual(['bold', 'code']);
        });

        it('inserts an empty pair with the caret inside when nothing is selected', (): void => {
            type('a ');
            editor.update(
                (): void => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
                },
                { discrete: true },
            );
            type('x');

            expect(sentText()).toBe('a `x`');
            expect(formatsOf('x')).toEqual(['code']);
        });

        it('never leaves formatting the sent text cannot carry', (): void => {
            type('word');
            editor.update(
                (): void => {
                    $getRoot().getAllTextNodes()[0]!.select(0, 4);
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
                },
                { discrete: true },
            );

            expect(sentText()).toBe('word');
            expect(isPlain()).toBe(true);
        });
    });

    it('formats text inserted programmatically, like the edit box seeding', (): void => {
        editor.update(
            (): void => {
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode('**bold** and `code`'));
                $getRoot().clear().append(paragraph);
            },
            { discrete: true },
        );

        expect(formatsOf('bold')).toEqual(['bold']);
        expect(formatsOf('code')).toEqual(['code']);
    });

    it('converts a legacy spoiler chip back into editable text', (): void => {
        editor.update(
            (): void => {
                const paragraph = $createParagraphNode();
                paragraph.append(
                    $createTextNode('||'),
                    $createSpoilerChipNode('old'),
                    $createTextNode('||'),
                );
                $getRoot().clear().append(paragraph);
            },
            { discrete: true },
        );
        editor.update($reformatAll, { discrete: true });

        expect(formatsOf('old')).toEqual(['highlight']);
        expect(sentText()).toBe('||old||');
    });
});
