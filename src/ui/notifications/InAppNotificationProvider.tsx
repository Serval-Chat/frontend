import React from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';

import { Message } from '@/ui/components/chat/Message';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import {
    IN_APP_NOTIFICATION_EVENT,
    type InAppNotification,
} from '@/ui/notifications/inAppNotifications';

interface RenderedNotification extends InAppNotification {
    id: string;
}

interface NotificationState {
    active: RenderedNotification | null;
    queue: RenderedNotification[];
}

const NOTIFICATION_TIMEOUT_MS = 4000;

export const InAppNotificationProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [notificationState, setNotificationState] =
        React.useState<NotificationState>({
            active: null,
            queue: [],
        });
    const activeNotification = notificationState.active;

    const showNextNotification = React.useCallback((): void => {
        setNotificationState((prev): NotificationState => {
            const [next, ...remaining] = prev.queue;
            return {
                active: next ?? null,
                queue: remaining,
            };
        });
    }, []);

    React.useEffect((): (() => void) => {
        const handleInAppNotification = (event: Event): void => {
            const notification = (event as CustomEvent<InAppNotification>)
                .detail;
            const id =
                notification.id ??
                `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
            const renderedNotification = { ...notification, id };

            setNotificationState((prev): NotificationState => {
                if (!prev.active) {
                    return {
                        active: renderedNotification,
                        queue: prev.queue,
                    };
                }

                if (prev.active.id === id) {
                    return {
                        active: renderedNotification,
                        queue: prev.queue,
                    };
                }

                return {
                    active: prev.active,
                    queue: [
                        ...prev.queue.filter(
                            (existing): boolean => existing.id !== id,
                        ),
                        renderedNotification,
                    ],
                };
            });
        };

        globalThis.addEventListener(
            IN_APP_NOTIFICATION_EVENT,
            handleInAppNotification,
        );

        return (): void => {
            globalThis.removeEventListener(
                IN_APP_NOTIFICATION_EVENT,
                handleInAppNotification,
            );
        };
    }, []);

    React.useEffect((): (() => void) | undefined => {
        if (!activeNotification) return undefined;

        const timeoutId = globalThis.setTimeout((): void => {
            showNextNotification();
        }, NOTIFICATION_TIMEOUT_MS);

        return (): void => {
            globalThis.clearTimeout(timeoutId);
        };
    }, [activeNotification, showNextNotification]);

    return (
        <>
            {children}
            <Box className="pointer-events-none fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-3 left-3 z-[var(--z-index-toast)] flex items-start justify-center md:right-auto md:left-1/2 md:w-[min(520px,calc(100vw-2rem))] md:-translate-x-1/2">
                <AnimatePresence mode="wait">
                    {activeNotification ? (
                        <InAppNotificationCard
                            key={activeNotification.id}
                            notification={activeNotification}
                            onClose={showNextNotification}
                        />
                    ) : null}
                </AnimatePresence>
            </Box>
        </>
    );
};

const InAppNotificationCard = ({
    notification,
    onClose,
}: {
    notification: RenderedNotification;
    onClose: () => void;
}) => {
    const title =
        notification.title ??
        (notification.kind === 'mention' ? 'New mention' : '');
    const hasHeader = Boolean(title.trim() || notification.serverName);

    return (
        <m.article
            layout
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto relative w-full overflow-hidden rounded-lg border border-primary/25 bg-background/95 shadow-2xl ring-1 ring-white/5 backdrop-blur-md"
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <div
                className={`flex items-center gap-2 px-3 py-1${hasHeader ? ' border-b border-border-subtle' : ''}`}
            >
                {notification.serverName ? (
                    <ServerIcon
                        className="pointer-events-none shrink-0"
                        server={{
                            name: notification.serverName,
                            icon: notification.serverIcon,
                        }}
                        size="xxs"
                    />
                ) : null}
                <div className="min-w-0 flex-1">
                    {title ? (
                        <Text
                            className="text-foreground"
                            size="sm"
                            weight="bold"
                        >
                            {title}
                        </Text>
                    ) : null}
                </div>
                <Button
                    aria-label="Close notification"
                    className="h-6 w-6 shrink-0 border-none p-0 hover:bg-white/5"
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                >
                    <X size={13} />
                </Button>
            </div>
            <div className="max-h-[18vh] overflow-y-auto py-1">
                {notification.chatMessage ? (
                    <Message
                        disableActions
                        isGroupStart
                        message={notification.chatMessage}
                        user={notification.chatMessage.user}
                    />
                ) : (
                    <Text
                        className="block px-4 break-words whitespace-pre-wrap text-foreground/90"
                        size="sm"
                    >
                        {notification.message}
                    </Text>
                )}
            </div>
            <m.div
                animate={{ scaleX: 0 }}
                className="h-0.5 bg-primary/50"
                initial={{ scaleX: 1 }}
                style={{ originX: 0 }}
                transition={{
                    duration: NOTIFICATION_TIMEOUT_MS / 1000,
                    ease: 'linear',
                }}
            />
        </m.article>
    );
};
