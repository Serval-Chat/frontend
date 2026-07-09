import { useCallback, useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { CLEAR_EDITOR_COMMAND, type LexicalEditor } from 'lexical';

import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
import type { KeybindManager } from '@/keybinds/KeybindManager';
import { getDraft } from '@/utils/drafts';
import { WsEvents } from '@/ws';

interface UseMessageInputEffectsArgs {
    editor: LexicalEditor | null;
    keybindManager: KeybindManager;
    replyingTo: unknown;
    selectedFriendId: string | null;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    onIsMobileChange: (isMobile: boolean) => void;
    onCloseFloatingPickers: () => void;
}

/**
 * wires the composer's cross-cutting effects: mobile breakpoint tracking + the
 * global "focus composer" keybind, focusing on a new reply, invalidating
 * sticker caches on the sticker-updated websocket event, and loading the saved
 * draft into the editor when the active conversation changes.
 */
export const useMessageInputEffects = ({
    editor,
    keybindManager,
    replyingTo,
    selectedFriendId,
    selectedServerId,
    selectedChannelId,
    onIsMobileChange,
    onCloseFloatingPickers,
}: UseMessageInputEffectsArgs): void => {
    const queryClient = useQueryClient();

    useEffect((): (() => void) => {
        const mobileQuery = globalThis.matchMedia('(max-width: 768px)');
        const handleResize = (event: MediaQueryListEvent): void => {
            onIsMobileChange(event.matches);
        };
        mobileQuery.addEventListener('change', handleResize);

        const handleGlobalKeyDown = (e: KeyboardEvent): void => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (keybindManager.matches('composer.focus', e)) {
                e.preventDefault();
                editor?.focus();
                onCloseFloatingPickers();
            }
        };

        globalThis.addEventListener('keydown', handleGlobalKeyDown);

        return (): void => {
            mobileQuery.removeEventListener('change', handleResize);
            globalThis.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [editor, keybindManager, onIsMobileChange, onCloseFloatingPickers]);

    useEffect((): void => {
        if (replyingTo && editor) {
            editor.focus();
        }
    }, [replyingTo, editor]);

    useWebSocket(
        WsEvents.STICKER_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.stickers(payload.serverId),
                });
                void queryClient.invalidateQueries({
                    queryKey: ['stickers', 'all'],
                });
            },
            [queryClient],
        ),
    );

    useEffect((): void => {
        if (!editor) return;

        const draftJson = getDraft(
            selectedFriendId,
            selectedServerId,
            selectedChannelId,
        );

        if (draftJson) {
            try {
                const parsedState = editor.parseEditorState(draftJson);
                editor.setEditorState(parsedState);
            } catch (error) {
                console.error('Failed to parse draft state:', error);
                editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            }
        } else {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
        }
    }, [editor, selectedFriendId, selectedServerId, selectedChannelId]);
};
