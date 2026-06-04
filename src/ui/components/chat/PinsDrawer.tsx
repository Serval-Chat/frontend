import React, { useCallback, useEffect, useRef, useState } from 'react';

import { m } from 'framer-motion';
import { Pin, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role, Server } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppDispatch } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Message } from '@/ui/components/chat/Message';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { resolveWebhookUser } from '@/ui/utils/chat';

interface PinsDrawerProps {
    serverId: string;
    channelId: string;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLElement | null>;
}

const getHighestRole = (roles: Role[]): Role | undefined =>
    roles.reduce<Role | undefined>(
        (highest, role): Role =>
            !highest || role.position > highest.position ? role : highest,
        undefined,
    );

const getHighestIconRole = (roles: Role[]): Role | undefined =>
    roles.reduce<Role | undefined>((highest, role): Role | undefined => {
        if (!role.icon) return highest;
        return !highest || role.position > highest.position ? role : highest;
    }, undefined);

const PinnedMessageItem = ({
    pin,
    serverId,
    channelId,
    me,
    serverDetails,
    onJump,
}: {
    pin: ChatMessage;
    serverId: string;
    channelId: string;
    me?: User | null;
    serverDetails?: Server | null;
    onJump: (id: string) => void;
}) => {
    const { data: members } = useMembers(serverId, { enabled: !!serverId });
    const { data: serverRoles } = useRoles(serverId, { enabled: !!serverId });

    const processedPin = React.useMemo((): ProcessedChatMessage => {
        const webhookUser = resolveWebhookUser(pin);
        const member = webhookUser
            ? undefined
            : members?.find((m): boolean => m.userId === pin.senderId);
        const roles =
            serverRoles?.filter((r): boolean | undefined =>
                member?.roles.includes(r.id),
            ) || [];
        const highestRole = getHighestRole(roles);
        const iconRole = getHighestIconRole(roles);

        return {
            ...pin,
            serverId,
            channelId,
            user: webhookUser ||
                member?.user || { id: pin.senderId, username: 'Unknown' },
            role: highestRole,
            iconRole: iconRole,
        } as ProcessedChatMessage;
    }, [pin, members, serverRoles, serverId, channelId]);

    return (
        <Box
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--bg-subtle)] transition-colors hover:bg-[var(--bg-subtle-hover)]"
            onClick={(): void => onJump(pin.id)}
        >
            <Box className="pointer-events-none pb-2">
                <Message
                    disableActions
                    disableColors={
                        me?.settings?.disableCustomUsernameColors ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    disableCustomFonts={
                        me?.settings?.disableCustomUsernameFonts ||
                        serverDetails?.disableCustomFonts
                    }
                    disableGlow={
                        me?.settings?.disableCustomUsernameGlow ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    iconRole={processedPin.iconRole}
                    message={processedPin}
                    role={processedPin.role}
                    user={processedPin.user}
                />
            </Box>
            <Box className="flex justify-end px-4 pb-2">
                <Button
                    className="h-6 text-[10px] text-[var(--primary)] hover:bg-[var(--primary-muted)]"
                    size="sm"
                    variant="ghost"
                    onClick={(e): void => {
                        e.stopPropagation();
                        onJump(pin.id);
                    }}
                >
                    Jump to message
                </Button>
            </Box>
        </Box>
    );
};

export const PinsDrawer = ({
    serverId,
    channelId,
    onClose,
    anchorRef,
}: PinsDrawerProps): React.ReactPortal | null => {
    const dispatch = useAppDispatch();
    const { data: pins, isLoading } = usePinnedMessages(serverId, channelId);
    const { data: me } = useMe();
    const { data: serverDetails } = useServerDetails(serverId, {
        enabled: !!serverId,
    });

    useEffect((): void => {
        if (me?.id && channelId) {
            const key = `serchat_pins_last_viewed_${me.id}_${channelId}`;
            localStorage.setItem(key, Date.now().toString());
            window.dispatchEvent(new Event('storage'));
        }
    }, [me?.id, channelId]);

    const [width, setWidth] = useState((): number => {
        const saved = localStorage.getItem('pins-drawer-width');
        return saved ? Math.min(Math.max(parseInt(saved, 10), 300), 800) : 400;
    });

    const [coords, setCoords] = useState<{ top: number; right: number } | null>(
        null,
    );

    useEffect((): void => {
        if (anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [anchorRef]);

    const isResizing = useRef(false);

    const startResizing = useCallback(
        (e: React.MouseEvent): void => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent: MouseEvent): void => {
                if (!isResizing.current) return;
                const newWidth =
                    window.innerWidth -
                    (coords?.right || 0) -
                    moveEvent.clientX;
                const clampedWidth = Math.min(Math.max(newWidth, 300), 800);
                setWidth(clampedWidth);
            };

            const onMouseUp = (): void => {
                isResizing.current = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        [coords],
    );

    useEffect((): void => {
        localStorage.setItem('pins-drawer-width', width.toString());
    }, [width]);

    const handleJump = (messageId: string): void => {
        dispatch(setTargetMessageId(messageId));
        onClose();
    };

    if (!coords) return null;

    return createPortal(
        <>
            <Box
                className="fixed inset-0 z-[var(--z-index-top)]"
                onClick={onClose}
            />

            <m.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="pride-glass-strong fixed z-[var(--z-index-top)] flex origin-top-right flex-col overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--tertiary-bg)] shadow-2xl"
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                    width,
                    top: coords.top,
                    right: coords.right,
                    maxHeight: 'calc(100vh - ' + (coords.top + 24) + 'px)',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <Box
                    className="absolute top-0 bottom-0 left-0 z-30 w-1 cursor-col-resize transition-colors hover:bg-[var(--primary)]/50"
                    onMouseDown={startResizing}
                />

                <Box className="pride-glass relative z-20 flex h-12 items-center justify-between border-b border-[var(--divider)] bg-[var(--tertiary-bg)] px-4">
                    <Box className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-muted-foreground" />
                        <Text className="font-semibold" size="sm">
                            Pinned Messages
                        </Text>
                    </Box>
                    <button
                        className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                        type="button"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </Box>

                <Box className="custom-scrollbar pride-glass flex-1 space-y-4 overflow-y-auto bg-[var(--tertiary-bg)] p-4">
                    {isLoading ? (
                        <Text className="py-8 text-center text-muted-foreground">
                            Loading pins...
                        </Text>
                    ) : pins && pins.length > 0 ? (
                        pins
                            .filter(
                                (p: ChatMessage): boolean =>
                                    p.isPinned || p.isSticky,
                            )
                            .map((pin: ChatMessage) => (
                                <PinnedMessageItem
                                    channelId={channelId}
                                    key={pin.id}
                                    me={me}
                                    pin={pin}
                                    serverDetails={serverDetails}
                                    serverId={serverId}
                                    onJump={handleJump}
                                />
                            ))
                    ) : (
                        <Box className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                            <Pin className="mb-4 h-12 w-12 text-muted-foreground" />
                            <Text className="text-muted-foreground">
                                No pinned messages yet.
                            </Text>
                        </Box>
                    )}
                </Box>
            </m.div>
        </>,
        document.body,
    );
};
