import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LexicalPastePlugin } from './LexicalPastePlugin';

const insertText = vi.fn();
const update = vi.fn((callback: () => void): void => {
    callback();
});
let pasteHandler: ((event: ClipboardEvent) => boolean) | undefined;

vi.mock('@lexical/react/LexicalComposerContext', () => ({
    useLexicalComposerContext: () => [
        {
            registerCommand: vi.fn((_command, handler) => {
                pasteHandler = handler;
                return vi.fn();
            }),
            update,
        },
    ],
}));

vi.mock('lexical', () => ({
    $getSelection: () => ({ insertText }),
    $isRangeSelection: (): true => true,
    COMMAND_PRIORITY_CRITICAL: 4,
    PASTE_COMMAND: Symbol('paste'),
}));

describe('LexicalPastePlugin', (): void => {
    afterEach((): void => {
        vi.clearAllMocks();
        pasteHandler = undefined;
    });

    it('inserts text/plain and ignores text/html formatting on rich paste', async (): Promise<void> => {
        const preventDefault = vi.fn();

        render(<LexicalPastePlugin onPasteFiles={vi.fn()} />);

        await waitFor((): void => {
            expect(pasteHandler).toBeDefined();
        });

        const handled = pasteHandler?.({
            clipboardData: {
                files: [],
                items: [],
                getData: (
                    type: string,
                ):
                    | 'const value = true;'
                    | '<span style="font-style: italic">const value = true;</span>' =>
                    type === 'text/plain'
                        ? 'const value = true;'
                        : '<span style="font-style: italic">const value = true;</span>',
            },
            preventDefault,
        } as unknown as ClipboardEvent);

        expect(handled).toBe(true);
        expect(preventDefault).toHaveBeenCalled();
        expect(update).toHaveBeenCalled();
        expect(insertText).toHaveBeenCalledWith('const value = true;');
    });
});
