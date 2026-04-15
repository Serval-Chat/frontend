import React, { useCallback, useEffect, useRef, useState } from 'react';

import { motion } from 'framer-motion';
import { Pin, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { useMembers, useRoles } from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import { useAppDispatch } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

import { Message } from './Message';

interface PinsDrawerProps {
    serverId: string;
    channelId: string;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLElement | null>;
}

const PinnedMessageItem: React.FC<{
    pin: ChatMessage;
    serverId: string;
    channelId: string;
    onJump: (id: string) => void;
}> = ({ pin, serverId, channelId, onJump }) => {
    const { data: members } = useMembers(serverId, { enabled: !!serverId });
    const { data: serverRoles } = useRoles(serverId, { enabled: !!serverId });

    const processedPin = React.useMemo(() => {
        const member = members?.find((m) => m.userId === pin.senderId);
        const roles =
            serverRoles?.filter((r) => member?.roles.includes(r._id)) || [];
        const highestRole = [...roles].sort(
            (a, b) => (b.position || 0) - (a.position || 0),
        )[0];
        const iconRole = [...roles]
            .filter((r) => r.icon)
            .sort((a, b) => (b.position || 0) - (a.position || 0))[0];

        return {
            ...pin,
            serverId,
            channelId,
            user: member?.user || { _id: pin.senderId, username: 'Unknown' },
            role: highestRole,
            iconRole: iconRole,
        } as ProcessedChatMessage;
    }, [pin, members, serverRoles, serverId, channelId]);

    return (
        <Box
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--bg-subtle)] transition-colors hover:bg-[var(--bg-subtle-hover)]"
            onClick={() => onJump(pin._id)}
        >
            <Box className="pointer-events-none pb-2">
                <Message
                    disableActions
                    disableGlow={false}
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
                    onClick={(e) => {
                        e.stopPropagation();
                        onJump(pin._id);
                    }}
                >
                    Jump to message
                </Button>
            </Box>
        </Box>
    );
};

export const PinsDrawer: React.FC<PinsDrawerProps> = ({
    serverId,
    channelId,
    onClose,
    anchorRef,
}) => {
    const dispatch = useAppDispatch();
    const { data: pins, isLoading } = usePinnedMessages(serverId, channelId);
    const { data: me } = useMe();

    useEffect(() => {
        if (me?._id && channelId) {
            const key = `serchat_pins_last_viewed_${me._id}_${channelId}`;
            localStorage.setItem(key, Date.now().toString());
            window.dispatchEvent(new Event('storage'));
        }
    }, [me?._id, channelId]);

    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem('pins-drawer-width');
        return saved ? Math.min(Math.max(parseInt(saved, 10), 300), 800) : 400;
    });

    const [coords, setCoords] = useState<{ top: number; right: number } | null>(
        null,
    );

    useEffect(() => {
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
        (e: React.MouseEvent) => {
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

    useEffect(() => {
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

            <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="fixed z-[var(--z-index-top)] flex origin-top-right flex-col overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--tertiary-bg)] shadow-2xl"
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

                <Box className="relative z-20 flex h-12 items-center justify-between border-b border-[var(--divider)] bg-[var(--tertiary-bg)] px-4">
                    <Box className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-muted-foreground" />
                        <Text className="font-semibold" size="sm">
                            Pinned Messages
                        </Text>
                    </Box>
                    <button
                        className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </Box>

                <Box className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-[var(--tertiary-bg)] p-4">
                    {isLoading ? (
                        <Text className="py-8 text-center text-muted-foreground">
                            Loading pins...
                        </Text>
                    ) : pins && pins.length > 0 ? (
                        pins
                            .filter(
                                (p: ChatMessage) => p.isPinned || p.isSticky,
                            )
                            .map((pin: ChatMessage) => (
                                <PinnedMessageItem
                                    channelId={channelId}
                                    key={pin._id}
                                    pin={pin}
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
            </motion.div>
        </>,
        document.body,
    );
};
