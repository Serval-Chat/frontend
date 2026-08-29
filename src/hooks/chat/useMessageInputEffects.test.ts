import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KeybindManager } from '@/keybinds/KeybindManager';

import { useMessageInputEffects } from './useMessageInputEffects';

const insertText = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/utils/drafts', () => ({
    getDraft: () => null,
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
}));

vi.mock('lexical', () => ({
    $getSelection: () => ({ insertText }),
    $isRangeSelection: (): true => true,
    CLEAR_EDITOR_COMMAND: Symbol('clear-editor'),
}));

const createFakeEditor = () => ({
    focus: vi.fn((callback?: () => void): void => {
        callback?.();
    }),
    update: vi.fn((callback: () => void): void => {
        callback();
    }),
    dispatchCommand: vi.fn(),
    parseEditorState: vi.fn(),
    setEditorState: vi.fn(),
});

describe('useMessageInputEffects global "type to focus" keybind', (): void => {
    afterEach((): void => {
        vi.clearAllMocks();
    });

    it('focuses the editor and inserts the character that triggered the focus', (): void => {
        const editor = createFakeEditor();
        const keybindManager = new KeybindManager();

        renderHook(() =>
            useMessageInputEffects({
                editor: editor as any,
                keybindManager,
                replyingTo: null,
                selectedFriendId: null,
                selectedServerId: null,
                selectedChannelId: null,
                onIsMobileChange: vi.fn(),
                onCloseFloatingPickers: vi.fn(),
            }),
        );

        const event = new KeyboardEvent('keydown', {
            key: 'h',
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, 'target', {
            value: document.body,
            enumerable: true,
        });
        globalThis.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(editor.focus).toHaveBeenCalledTimes(1);
        expect(editor.update).toHaveBeenCalledTimes(1);
        expect(insertText).toHaveBeenCalledWith('h');
    });

    it('does not intercept keydowns already targeting an editable element', (): void => {
        const editor = createFakeEditor();
        const keybindManager = new KeybindManager();

        renderHook(() =>
            useMessageInputEffects({
                editor: editor as any,
                keybindManager,
                replyingTo: null,
                selectedFriendId: null,
                selectedServerId: null,
                selectedChannelId: null,
                onIsMobileChange: vi.fn(),
                onCloseFloatingPickers: vi.fn(),
            }),
        );

        const input = document.createElement('input');
        document.body.append(input);

        const event = new KeyboardEvent('keydown', {
            key: 'h',
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, 'target', {
            value: input,
            enumerable: true,
        });
        globalThis.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
        expect(editor.focus).not.toHaveBeenCalled();

        input.remove();
    });

    it('does not intercept modifier combinations such as Ctrl+key', (): void => {
        const editor = createFakeEditor();
        const keybindManager = new KeybindManager();

        renderHook(() =>
            useMessageInputEffects({
                editor: editor as any,
                keybindManager,
                replyingTo: null,
                selectedFriendId: null,
                selectedServerId: null,
                selectedChannelId: null,
                onIsMobileChange: vi.fn(),
                onCloseFloatingPickers: vi.fn(),
            }),
        );

        const event = new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, 'target', {
            value: document.body,
            enumerable: true,
        });
        globalThis.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
        expect(editor.focus).not.toHaveBeenCalled();
    });
});
