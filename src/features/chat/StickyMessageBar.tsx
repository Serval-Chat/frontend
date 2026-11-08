import React, { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { Message } from '@/features/chat/Message';
import { useAppDispatch } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { resolveWebhookUser } from '@/ui/utils/chat';
import { cn } from '@/utils/cn';

interface StickyMessageBarProps {
    serverId: string;
    channelId: string;
    onVisibilityChange?: (isVisible: boolean) => void;
}

type ViewState = 'expanded' | 'compact' | 'hidden';

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

export const StickyMessageBar = ({
    serverId,
    channelId,
    onVisibilityChange,
}: StickyMessageBarProps) => {
    const dispatch = useAppDispatch();
    const [viewState, setViewState] = useState<ViewState>('expanded');
    const contentRef = React.useRef<HTMLDivElement>(null);
    const lastStickyId = React.useRef<string | null>(null);

    const { data: pins } = usePinnedMessages(serverId, channelId);
    const { data: members } = useMembers(serverId, { enabled: !!serverId });
    const { data: serverRoles } = useRoles(serverId, { enabled: !!serverId });
    const { data: server } = useServerDetails(serverId, {
        enabled: !!serverId,
    });

    const latestSticky = React.useMemo((): ProcessedChatMessage | null => {
        if (!pins) return null;
        const raw = pins.reduce<ChatMessage | null>((latest, pin) => {
            if (!pin.isSticky) return latest;
            if (!latest) return pin;
            return new Date(pin.createdAt).getTime() >
                new Date(latest.createdAt).getTime()
                ? pin
                : latest;
        }, null);
        if (!raw) return null;

        const webhookUser = resolveWebhookUser(raw);
        const member = webhookUser
            ? undefined
            : members?.find((m): boolean => m.userId === raw.senderId);
        const roles =
            serverRoles?.filter((r): boolean | undefined =>
                member?.roles.includes(r.id),
            ) || [];
        const highestRole = getHighestRole(roles);
        const iconRole = getHighestIconRole(roles);

        return {
            ...raw,
            serverId,
            channelId,
            user: webhookUser ||
                member?.user || { id: raw.senderId, username: 'Unknown' },
            role: highestRole,
            iconRole: iconRole,
        } as ProcessedChatMessage;
    }, [pins, members, serverRoles, serverId, channelId]);

    React.useLayoutEffect((): void => {
        if (!latestSticky) return;

        if (lastStickyId.current !== latestSticky.id) {
            if (contentRef.current && contentRef.current.scrollHeight > 80) {
                setViewState('compact');
            } else {
                setViewState('expanded');
            }
            lastStickyId.current = latestSticky.id;
        }
    }, [latestSticky]);

    const hasVisibleStickyMessage = Boolean(
        latestSticky && viewState !== 'hidden',
    );
    const lastReportedVisibility = React.useRef<boolean | null>(null);

    React.useLayoutEffect((): void => {
        if (lastReportedVisibility.current === hasVisibleStickyMessage) return;
        lastReportedVisibility.current = hasVisibleStickyMessage;
        onVisibilityChange?.(hasVisibleStickyMessage);
    }, [hasVisibleStickyMessage, onVisibilityChange]);

    if (!latestSticky) return null;

    const isExceeding = (): boolean =>
        Boolean(contentRef.current && contentRef.current.scrollHeight > 80);

    const handleNext = (): void => {
        if (viewState === 'expanded') {
            setViewState(isExceeding() ? 'compact' : 'hidden');
        } else if (viewState === 'compact') {
            setViewState('hidden');
        }
    };

    const handlePrev = (): void => {
        if (viewState === 'hidden') {
            setViewState(isExceeding() ? 'compact' : 'expanded');
        } else if (viewState === 'compact') {
            setViewState('expanded');
        }
    };

    return (
        <Box
            className={cn(
                'group relative flex flex-col bg-[var(--bg-chat-header)]',
                viewState === 'hidden'
                    ? 'h-0 min-h-0'
                    : 'border-b border-[var(--divider)]',
            )}
        >
            <Box
                className={cn(
                    'relative flex',
                    viewState === 'expanded' &&
                        'min-h-[52px] items-center opacity-100',
                    viewState === 'compact' &&
                        'max-h-[80px] items-start overflow-hidden opacity-90',
                    viewState === 'hidden' &&
                        'h-0 max-h-0 min-h-0 overflow-hidden opacity-0',
                )}
            >
                <Box className="min-w-0 flex-1" ref={contentRef}>
                    <Message
                        disableActions
                        disableGlow={server?.disableUsernameGlowAndCustomColor}
                        iconRole={latestSticky.iconRole}
                        message={latestSticky}
                        role={latestSticky.role}
                        user={latestSticky.user}
                        onReplyClick={(
                            id,
                        ): {
                            payload: string | null;
                            type: 'nav/setTargetMessageId';
                        } => dispatch(setTargetMessageId(id))}
                    />
                </Box>

                {viewState === 'expanded' ? (
                    <Box className="flex shrink-0 items-center self-center px-4">
                        <Button
                            className="h-7 border border-[var(--divider)] px-3 text-[10px] font-bold tracking-widest text-[var(--primary)] uppercase"
                            size="sm"
                            variant="ghost"
                            onClick={(): {
                                payload: string | null;
                                type: 'nav/setTargetMessageId';
                            } => dispatch(setTargetMessageId(latestSticky.id))}
                        >
                            Jump
                        </Button>
                    </Box>
                ) : null}

                {viewState === 'compact' ? (
                    <Box
                        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8"
                        style={{
                            background:
                                'linear-gradient(transparent, var(--bg-chat-header))',
                        }}
                    />
                ) : null}
            </Box>

            <Box
                className={cn(
                    'absolute left-1/2 z-20 flex -translate-x-1/2',
                    viewState !== 'hidden' && '-bottom-[14px]',
                )}
                style={
                    viewState === 'hidden'
                        ? {
                              top: 'calc(0px - var(--chat-header-hidden-tab-offset, 0px))',
                          }
                        : undefined
                }
            >
                <Box className="flex items-center justify-center overflow-hidden rounded-b-sm border-x border-b border-[var(--divider)] bg-[var(--bg-chat-header)]">
                    {viewState === 'compact' || viewState === 'hidden' ? (
                        <button
                            aria-label="Show previous message"
                            className="flex h-3 w-5 items-center justify-center bg-[var(--background)] text-foreground transition-colors hover:bg-white/5"
                            type="button"
                            onClick={handlePrev}
                        >
                            <ChevronDown size={10} />
                        </button>
                    ) : null}
                    {viewState === 'compact' || viewState === 'expanded' ? (
                        <button
                            aria-label="Show next message"
                            className="flex h-3 w-5 items-center justify-center bg-[var(--background)] text-foreground transition-colors hover:bg-white/5"
                            type="button"
                            onClick={handleNext}
                        >
                            <ChevronUp size={10} />
                        </button>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
};
