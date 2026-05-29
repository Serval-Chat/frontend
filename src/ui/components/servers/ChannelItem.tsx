import React from 'react';

import { motion } from 'framer-motion';
import {
    Copy,
    HeadphoneOff,
    MessageSquare,
    MicOff,
    Settings,
    User as UserIcon,
    Volume2,
} from 'lucide-react';

import { useFriends } from '@/api/friends/friends.queries';
import type { ChannelType } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedFriendId } from '@/store/slices/navSlice';
import { setUserVolume } from '@/store/slices/voiceSlice';
import {
    ContextMenu,
    type ContextMenuItem,
} from '@/ui/components/common/ContextMenu';
import { IconButton } from '@/ui/components/common/IconButton';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { buttonVariants } from '@/ui/components/common/buttonVariants';
import { cn } from '@/utils/cn';

import { ChannelIcon } from './ChannelIcon';

interface ChannelItemProps {
    name: string;
    type: ChannelType;
    icon?: string;
    iconComponent?: React.ComponentType<{ className?: string }>;
    emoji?: string;
    emojiType?: 'custom' | 'unicode';
    isActive?: boolean;
    isUnread?: boolean;
    pingCount?: number;
    connectedUserIds?: string[];
    disabled?: boolean;
    onClick?: () => void;
    onSettingsClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: () => void;
}

/**
 * @description Renders a single channel item with an icon.
 */
export const ChannelItem = React.memo(
    ({
        name,
        type,
        icon,
        iconComponent: IconComponent,
        emoji,
        emojiType,
        isActive,
        isUnread,
        pingCount,
        connectedUserIds,
        disabled,
        onClick,
        onSettingsClick,
        onMouseEnter,
    }: ChannelItemProps) => {
        const channelClasses = cn(
            'group flex w-full items-center justify-between rounded-md border-none px-2 py-1.5 shadow-none transition-all',
            disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-white/5',
            isActive
                ? 'bg-white/10 text-foreground'
                : isUnread
                  ? 'text-foreground'
                  : 'text-muted-foreground',
        );

        return (
            <div className="mb-[1px] flex flex-col">
                <motion.div
                    className={cn(
                        'relative select-none',
                        buttonVariants({ variant: 'ghost' }),
                        channelClasses,
                    )}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e): void => {
                        if (disabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onClick?.();
                        }
                    }}
                    onMouseEnter={disabled ? undefined : onMouseEnter}
                    onTap={disabled ? undefined : onClick}
                >
                    <div className="flex w-full items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center">
                            <ChannelIcon
                                className={cn(
                                    'mr-1.5 h-[18px] w-[18px] transition-colors',
                                    isActive || isUnread
                                        ? 'text-foreground'
                                        : 'text-muted-foreground group-hover:text-foreground/80',
                                )}
                                emoji={emoji}
                                emojiType={emojiType}
                                icon={icon}
                                iconComponent={IconComponent}
                                type={type}
                            />
                            <span
                                className={cn(
                                    'truncate text-left text-[15px] font-medium',
                                    (isActive || isUnread) && 'text-foreground',
                                )}
                            >
                                {name}
                            </span>
                            {disabled && type === 'voice' && (
                                <Settings className="ml-1 h-3 w-3 text-muted-foreground" />
                            )}
                            {pingCount
                                ? pingCount > 0 && (
                                      <div className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] leading-none font-bold text-white">
                                          {pingCount > 99 ? '99+' : pingCount}
                                      </div>
                                  )
                                : null}
                        </div>
                        {onSettingsClick && (
                            <IconButton
                                className="ml-1 shrink-0 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                                icon={Settings}
                                iconSize={14}
                                title="Edit Channel"
                                variant="ghost"
                                onClick={(e): void => {
                                    e.stopPropagation();
                                    onSettingsClick(e);
                                }}
                            />
                        )}
                    </div>
                </motion.div>
                {type === 'voice' &&
                    connectedUserIds &&
                    connectedUserIds.length > 0 && (
                        <div className="mt-0.5 mr-2 mb-1 ml-6 flex flex-col space-y-0.5">
                            {connectedUserIds.map((userId) => (
                                <VoiceParticipant
                                    key={userId}
                                    userId={userId}
                                />
                            ))}
                        </div>
                    )}
            </div>
        );
    },
);

ChannelItem.displayName = 'ChannelItem';

export const VoiceParticipant = React.memo(({ userId }: { userId: string }) => {
    const { data: user } = useUserById(userId);
    const { speakingUsers, voiceUserStates, userVolumes } = useAppSelector(
        (state) => state.voice,
    );
    const { data: currentUser } = useMe();
    const { data: friends } = useFriends();
    const dispatch = useAppDispatch();

    const isSpeaking = speakingUsers.includes(userId);
    const userState = voiceUserStates[userId];
    const isMe = currentUser?._id === userId;
    const isFriend = friends?.some((f): boolean => f._id === userId);

    if (!user) {
        return (
            <div className="group/voice mt-0.5 flex flex-row items-center gap-2 rounded-md py-1 pr-2 pl-2 transition-colors hover:bg-white/5">
                <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-bg-secondary" />
                <span className="flex-1 animate-pulse truncate text-xs font-medium text-muted-foreground">
                    Connecting...
                </span>
            </div>
        );
    }

    const items: ContextMenuItem[] = [];

    if (!isMe) {
        const volume = userVolumes[userId] ?? 1;
        items.push({
            type: 'custom',
            content: (
                <div className="flex min-w-[180px] flex-col gap-2 p-1">
                    <div className="flex items-center justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <div className="flex items-center gap-1.5">
                            <Volume2 size={12} />
                            User Volume
                        </div>
                        <span>
                            {Math.round((isNaN(volume) ? 1.0 : volume) * 100)}%
                        </span>
                    </div>
                    <input
                        className="w-full cursor-pointer accent-primary"
                        max="2"
                        min="0"
                        step="0.01"
                        type="range"
                        value={volume}
                        onChange={(e): void => {
                            dispatch(
                                setUserVolume({
                                    userId,
                                    volume: parseFloat(e.target.value),
                                }),
                            );
                        }}
                    />
                </div>
            ),
        });
        items.push({ type: 'divider' });
    }

    items.push({
        label: 'Show Profile',
        icon: UserIcon,
        onClick: (): void => {
            /* Profile logic usually handled by popups */
        },
    });

    if (isFriend && !isMe) {
        items.push({
            label: 'Message',
            icon: MessageSquare,
            onClick: (): {
                payload: string | null;
                type: 'nav/setSelectedFriendId';
            } => dispatch(setSelectedFriendId(userId)),
        });
    }

    items.push({
        label: 'Copy User ID',
        icon: Copy,
        onClick: (): void => {
            void navigator.clipboard.writeText(userId);
        },
    });

    return (
        <ContextMenu className="w-full" items={items}>
            <div className="group/voice mt-0.5 flex cursor-pointer flex-row items-center gap-2 rounded-md py-1 pr-2 pl-2 transition-colors hover:bg-white/5">
                <UserProfilePicture
                    noIndicator
                    className={cn(
                        'rounded-full ring-2 ring-offset-1 ring-offset-[var(--secondary-bg)] transition-all duration-200',
                        isSpeaking ? 'ring-success' : 'ring-transparent',
                    )}
                    size="xs"
                    src={user.profilePicture}
                    username={user.username}
                />
                <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
                    {user.displayName || user.username}
                </span>
                {userState && (userState.isMuted || userState.isDeafened) && (
                    <div className="mr-1 ml-auto flex shrink-0 items-center gap-1">
                        {userState.isMuted && (
                            <MicOff className="text-destructive" size={10} />
                        )}
                        {userState.isDeafened && (
                            <HeadphoneOff
                                className="text-destructive"
                                size={10}
                            />
                        )}
                    </div>
                )}
            </div>
        </ContextMenu>
    );
});

VoiceParticipant.displayName = 'VoiceParticipant';
