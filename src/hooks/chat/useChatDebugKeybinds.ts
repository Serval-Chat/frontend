import { useEffect } from 'react';

import type { QueryClient } from '@tanstack/react-query';

import type { User } from '@/api/users/users.types';
import type { KeybindManager } from '@/keybinds/KeybindManager';
import type { Theme } from '@/providers/ThemeProvider';
import { showInAppNotification } from '@/ui/notifications/inAppNotifications';
import { WsEvents, wsClient } from '@/ws';

const THEMES: Theme[] = [
    'serval',
    'dark',
    'deep-ocean',
    'light',
    'cherry',
    'high-contrast',
    'violet',
    'forest-green',
    'pride',
];

interface UseChatDebugKeybindsArgs {
    keybindManager: KeybindManager;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentUser: User | undefined;
    queryClient: QueryClient;
    onAdjustTypingCount: (delta: number) => void;
}

/**
 * registers the debug-only keybinds used during development (cycle themes,
 * fake typing indicators, simulate DM/mention notifications). Extracted from
 * MainChat purely to keep that component focused on real chat wiring.
 */
export const useChatDebugKeybinds = ({
    keybindManager,
    theme,
    setTheme,
    currentUser,
    queryClient,
    onAdjustTypingCount,
}: UseChatDebugKeybindsArgs): void => {
    useEffect((): (() => void) => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (keybindManager.matches('debug.typing.more', e)) {
                e.preventDefault();
                e.stopPropagation();
                onAdjustTypingCount(1);
            }
            if (keybindManager.matches('debug.typing.less', e)) {
                e.preventDefault();
                e.stopPropagation();
                onAdjustTypingCount(-1);
            }
            if (keybindManager.matches('debug.theme.previous', e)) {
                e.preventDefault();
                e.stopPropagation();
                const currentIndex = THEMES.indexOf(theme);
                const nextIndex =
                    (currentIndex - 1 + THEMES.length) % THEMES.length;
                setTheme(THEMES[nextIndex] ?? theme);
            }
            if (keybindManager.matches('debug.theme.next', e)) {
                e.preventDefault();
                e.stopPropagation();
                const currentIndex = THEMES.indexOf(theme);
                const nextIndex = (currentIndex + 1) % THEMES.length;
                setTheme(THEMES[nextIndex] ?? theme);
            }
            if (keybindManager.matches('debug.notification.example', e)) {
                e.preventDefault();
                e.stopPropagation();
                showInAppNotification({
                    title: 'Example Notification',
                    message: 'This is what a notification looks like!',
                    type: 'info',
                });
            }
            if (keybindManager.matches('debug.notification.dm', e)) {
                e.preventDefault();
                e.stopPropagation();
                const dmId = `__debug_dm_${Date.now()}`;
                const debugSenderId = `${currentUser?.id ?? '__debug'}_debug`;
                if (currentUser) {
                    queryClient.setQueryData(['user', debugSenderId], {
                        ...currentUser,
                        id: debugSenderId,
                    });
                }
                wsClient.simulateEvent(WsEvents.MESSAGE_DM, {
                    id: dmId,
                    messageId: dmId,
                    senderId: debugSenderId,
                    senderUsername: currentUser?.username ?? 'Unknown',
                    senderProfilePicture: currentUser?.profilePicture ?? null,
                    receiverId: currentUser?.id ?? '__debug_me__',
                    receiverUsername: currentUser?.username ?? 'Unknown',
                    text: 'Hey, how are you doing?',
                    createdAt: new Date().toISOString(),
                    isEdited: false,
                    isPinned: false,
                    isSticky: false,
                    isWebhook: false,
                    stickerId: null,
                    poll: null,
                    embeds: [],
                    attachments: [],
                    reactions: [],
                    interaction: null,
                    senderIsBot: false,
                });
            }
            if (keybindManager.matches('debug.notification.mention', e)) {
                e.preventDefault();
                e.stopPropagation();
                const mentionId = `__debug_mention_${Date.now()}`;
                const debugSenderId = `${currentUser?.id ?? '__debug'}_debug`;
                if (currentUser) {
                    queryClient.setQueryData(['user', debugSenderId], {
                        ...currentUser,
                        id: debugSenderId,
                    });
                }
                wsClient.simulateEvent(WsEvents.MENTION, {
                    type: 'mention',
                    senderId: debugSenderId,
                    sender:
                        currentUser?.displayName ??
                        currentUser?.username ??
                        'Unknown',
                    serverId: '__debug_server__',
                    channelId: '__debug_channel__',
                    message: {
                        id: mentionId,
                        messageId: mentionId,
                        serverId: '__debug_server__',
                        channelId: '__debug_channel__',
                        senderId: debugSenderId,
                        senderUsername: currentUser?.username ?? 'Unknown',
                        senderProfilePicture:
                            currentUser?.profilePicture ?? null,
                        text: `Hey @${currentUser?.username ?? 'you'}, check this out!`,
                        createdAt: new Date().toISOString(),
                        isEdited: false,
                        isPinned: false,
                        isSticky: false,
                        isWebhook: false,
                        embeds: [],
                        attachments: [],
                        reactions: [],
                        interaction: null,
                        stickerId: null,
                        poll: null,
                        senderIsBot: false,
                    },
                });
            }
        };
        globalThis.addEventListener('keydown', handleKeyDown, true);
        return (): void => {
            globalThis.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [
        keybindManager,
        theme,
        setTheme,
        currentUser,
        queryClient,
        onAdjustTypingCount,
    ]);
};
