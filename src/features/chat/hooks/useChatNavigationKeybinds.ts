import { useEffect } from 'react';

import type { KeybindManager } from '@/keybinds/KeybindManager';

interface UseChatNavigationKeybindsArgs {
    keybindManager: KeybindManager;
    onJumpToBottom: () => void;
}

export const useChatNavigationKeybinds = ({
    keybindManager,
    onJumpToBottom,
}: UseChatNavigationKeybindsArgs): void => {
    useEffect((): (() => void) => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (keybindManager.matches('chat.jumpToBottom', e)) {
                onJumpToBottom();
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return (): void => {
            globalThis.removeEventListener('keydown', handleKeyDown);
        };
    }, [keybindManager, onJumpToBottom]);
};
