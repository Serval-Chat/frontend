import React, { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useAppDispatch } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { Message } from './Message';

interface StickyMessageBarProps {
    serverId: string;
    channelId: string;
}

type ViewState = 'expanded' | 'compact' | 'hidden';

export const StickyMessageBar: React.FC<StickyMessageBarProps> = ({
    serverId,
    channelId,
}) => {
    const dispatch = useAppDispatch();
    const [viewState, setViewState] = useState<ViewState>('expanded');
    const contentRef = React.useRef<HTMLDivElement>(null);
    const lastStickyId = React.useRef<string | null>(null);

    const { data: pins } = usePinnedMessages(serverId, channelId);
    const { data: members } = useMembers(serverId);
    const { data: serverRoles } = useRoles(serverId);
    const { data: server } = useServerDetails(serverId);

    const latestSticky = React.useMemo(() => {
        if (!pins) return null;
        const stickies = pins.filter((p: ChatMessage) => p.isSticky);
        if (stickies.length === 0) return null;
        const raw = [...stickies].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )[0];

        const member = members?.find((m) => m.userId === raw.senderId);
        const roles =
            serverRoles?.filter((r) => member?.roles.includes(r._id)) || [];
        const highestRole = [...roles].sort(
            (a, b) => (b.position || 0) - (a.position || 0),
        )[0];
        const iconRole = [...roles]
            .filter((r) => r.icon)
            .sort((a, b) => (b.position || 0) - (a.position || 0))[0];

        return {
            ...raw,
            serverId,
            channelId,
            user: member?.user || { _id: raw.senderId, username: 'Unknown' },
            role: highestRole,
            iconRole: iconRole,
        } as ProcessedChatMessage;
    }, [pins, members, serverRoles, serverId, channelId]);

    React.useLayoutEffect(() => {
        if (!latestSticky) return;

        if (lastStickyId.current !== latestSticky._id) {
            if (contentRef.current && contentRef.current.scrollHeight > 80) {
                setViewState('compact');
            } else {
                setViewState('expanded');
            }
            lastStickyId.current = latestSticky._id;
        }
    }, [latestSticky]);

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
                'group relative flex flex-col bg-[var(--bg-secondary)]',
                viewState !== 'hidden'
                    ? 'border-b border-[var(--divider)]'
                    : '',
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
                        'max-h-0 overflow-hidden opacity-0',
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
                        onReplyClick={(id) => dispatch(setTargetMessageId(id))}
                    />
                </Box>

                {viewState === 'expanded' && (
                    <Box className="flex shrink-0 items-center self-center px-4">
                        <Button
                            className="h-7 border border-[var(--divider)] px-3 text-[10px] font-bold tracking-widest text-[var(--primary)] uppercase"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                                dispatch(setTargetMessageId(latestSticky._id))
                            }
                        >
                            Jump
                        </Button>
                    </Box>
                )}

                {viewState === 'compact' && (
                    <Box
                        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8"
                        style={{
                            background:
                                'linear-gradient(transparent, var(--bg-secondary))',
                        }}
                    />
                )}
            </Box>

            <Box
                className={cn(
                    'absolute left-1/2 z-20 flex -translate-x-1/2',
                    viewState === 'expanded'
                        ? '-bottom-[12px]'
                        : '-bottom-[11px]',
                )}
            >
                <Box className="flex items-center justify-center overflow-hidden rounded-b-sm border-x border-b border-[var(--divider)] bg-[var(--bg-secondary)]">
                    {(viewState === 'compact' || viewState === 'hidden') && (
                        <button
                            className="flex h-3 w-5 items-center justify-center text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            onClick={handlePrev}
                        >
                            <ChevronDown size={10} />
                        </button>
                    )}
                    {(viewState === 'compact' || viewState === 'expanded') && (
                        <button
                            className="flex h-3 w-5 items-center justify-center text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                            onClick={handleNext}
                        >
                            <ChevronUp size={10} />
                        </button>
                    )}
                </Box>
            </Box>
        </Box>
    );
};
