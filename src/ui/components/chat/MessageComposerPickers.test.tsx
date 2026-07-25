import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/ui/components/emoji/EmojiPicker', () => {
    const EmojiPicker = ({
        onEmojiSelect,
        onCustomEmojiSelect,
    }: {
        onEmojiSelect: (emoji: string) => void;
        onCustomEmojiSelect?: (emoji: { id: string; name: string; url: string }) => void;
    }) => (
        <>
            <button
                type="button"
                data-testid="pick-unicode"
                onClick={() => onEmojiSelect('😀')}
            >
                pick-emoji
            </button>
            <button
                type="button"
                data-testid="pick-custom"
                onClick={() =>
                    onCustomEmojiSelect?.({
                        id: 'custom1',
                        name: 'parrot',
                        url: '/parrot.gif',
                    })
                }
            >
                pick-custom
            </button>
        </>
    );
    return { EmojiPicker };
});

vi.mock('@/ui/components/emoji/StickerPicker', () => ({
    StickerPicker: () => <div>sticker-picker</div>,
}));

const $createChipNodeMock = vi.fn((..._args: unknown[]) => ({ __type: 'chip-mock' }));
vi.mock('@/ui/components/chat/lexical/ChipNode', () => ({
    $createChipNode: (type: unknown, data: unknown) => $createChipNodeMock(type, data),
}));

const mockInsertNodes = vi.fn();
const mockInsertText = vi.fn();

const mockRangeSelection = {
    __isRangeSelection: true,
    insertNodes: mockInsertNodes,
    insertText: mockInsertText,
};

vi.mock('lexical', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lexical')>();
    return {
        ...actual,
        $getSelection: vi.fn(() => mockRangeSelection),
        $isRangeSelection: vi.fn((s: unknown) =>
            s !== null && typeof s === 'object' && '__isRangeSelection' in (s as object),
        ),
    };
});

function makeMockEditor() {
    return {
        focus: vi.fn((callback?: () => void) => {
            callback?.();
        }),
        update: vi.fn((callback: () => void) => callback()),
        getEditorState: vi.fn(() => ({
            read: vi.fn((callback: () => unknown) => callback()),
        })),
    };
}

import { MessageComposerPickers } from './MessageComposerPickers';
import type { LexicalEditor } from 'lexical';

function renderPickers(editor: LexicalEditor) {
    return render(
        <MessageComposerPickers
            editor={editor}
            showEmojiPicker={true}
            showStickerPicker={false}
            customCategories={[]}
            stickerCategories={[]}
            sendMessage={vi.fn()}
            onClickAway={vi.fn()}
            onStickerSelected={vi.fn()}
        />,
    );
}

describe('MessageComposerPickers – emoji insertion focus bug', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    async function findPickButton(testId: 'pick-unicode' | 'pick-custom') {
        return screen.findByTestId(testId, {}, { timeout: 3000 });
    }

    it('inserts a unicode emoji when the editor was NEVER focused before (no prior selection)', async () => {
        const editor = makeMockEditor();
        renderPickers(editor as unknown as LexicalEditor);

        const btn = await findPickButton('pick-unicode');

        await act(async () => {
            fireEvent.click(btn);
        });

        expect(editor.focus).toHaveBeenCalled();

        expect($createChipNodeMock).toHaveBeenCalledWith('unicode-emoji', { id: '😀' });
        expect(mockInsertNodes).toHaveBeenCalled();
    });

    it('inserts a unicode emoji when the editor was focused first (happy path)', async () => {
        const editor = makeMockEditor();
        renderPickers(editor as unknown as LexicalEditor);

        await act(async () => {
            fireEvent.click(await findPickButton('pick-unicode'));
        });

        expect(editor.focus).toHaveBeenCalled();
        expect($createChipNodeMock).toHaveBeenCalledWith('unicode-emoji', { id: '😀' });
        expect(mockInsertNodes).toHaveBeenCalled();
    });

    it('inserts a custom emoji when the editor was NEVER focused before (no prior selection)', async () => {
        const editor = makeMockEditor();
        renderPickers(editor as unknown as LexicalEditor);

        await act(async () => {
            fireEvent.click(await findPickButton('pick-custom'));
        });

        expect(editor.focus).toHaveBeenCalled();
        expect($createChipNodeMock).toHaveBeenCalledWith('emoji', {
            id: 'custom1',
            label: 'parrot',
            imageUrl: '/parrot.gif',
        });
        expect(mockInsertNodes).toHaveBeenCalled();
    });

    it('inserts a custom emoji when the editor was focused first (happy path)', async () => {
        const editor = makeMockEditor();
        renderPickers(editor as unknown as LexicalEditor);

        await act(async () => {
            fireEvent.click(await findPickButton('pick-custom'));
        });

        expect(editor.focus).toHaveBeenCalled();
        expect($createChipNodeMock).toHaveBeenCalledWith('emoji', {
            id: 'custom1',
            label: 'parrot',
            imageUrl: '/parrot.gif',
        });
        expect(mockInsertNodes).toHaveBeenCalled();
    })
    it('does nothing gracefully when editor is null', async () => {
        renderPickers(null as unknown as LexicalEditor);

        await act(async () => {
            fireEvent.click(await findPickButton('pick-unicode'));
        });

        expect($createChipNodeMock).not.toHaveBeenCalled();
        expect(mockInsertNodes).not.toHaveBeenCalled();
    });
});
