import React from 'react';

import { MessageSquare, Search } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useFriendProfiles } from '@/api/friends/friends.queries';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import type { UserStatus } from '@/ui/components/common/UserProfileStatusIndicator';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

const FriendProfileRow = React.memo(
    ({
        friend,
        onOpenDm,
    }: {
        friend: User;
        onOpenDm: (friendId: string) => void;
    }) => {
        const userId = String(friend.id);
        const presenceStatus = useAppSelector(
            (state): UserStatus =>
                state.presence.users[userId]?.status ?? 'offline',
        );
        const presenceCustomText = useAppSelector(
            (state): string | undefined =>
                state.presence.users[userId]?.customStatus?.text,
        );
        const presenceCustomEmoji = useAppSelector(
            (state): string | null | undefined =>
                state.presence.users[userId]?.customStatus?.emoji,
        );
        const displayName = friend.displayName || friend.username;
        const customText = presenceCustomText ?? friend.customStatus?.text;
        const customEmoji = presenceCustomEmoji ?? friend.customStatus?.emoji;

        const handleOpenDm = React.useCallback((): void => {
            onOpenDm(userId);
        }, [onOpenDm, userId]);

        return (
            <Box className="group flex items-center justify-between gap-4">
                <button
                    className={cn(
                        'flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-md px-3 text-left transition-colors',
                        'text-foreground-muted hover:bg-bg-subtle',
                    )}
                    type="button"
                    onClick={handleOpenDm}
                >
                    <UserProfilePicture
                        size="sm"
                        src={friend.profilePicture}
                        status={presenceStatus}
                        username={displayName}
                    />
                    <Box className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <StyledUserName className="truncate" user={friend}>
                            {displayName}
                        </StyledUserName>
                        {(customText || customEmoji) && (
                            <Box className="flex min-w-0 items-center gap-1">
                                {customEmoji && (
                                    <span className="flex shrink-0 items-center">
                                        {/^[0-9a-fA-F]{24}$/.test(
                                            customEmoji,
                                        ) ? (
                                            <ParsedEmoji
                                                className="h-3.5 w-3.5"
                                                emojiId={customEmoji}
                                            />
                                        ) : (
                                            <ParsedUnicodeEmoji
                                                className="text-xs"
                                                content={customEmoji}
                                            />
                                        )}
                                    </span>
                                )}
                                {customText && (
                                    <Text className="text-foreground-muted truncate text-xs">
                                        {customText}
                                    </Text>
                                )}
                            </Box>
                        )}
                    </Box>
                </button>
                <button
                    className="text-foreground-muted flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-bg-secondary transition-colors hover:bg-bg-subtle hover:text-foreground"
                    type="button"
                    onClick={handleOpenDm}
                >
                    <MessageSquare size={18} />
                </button>
            </Box>
        );
    },
);

FriendProfileRow.displayName = 'FriendProfileRow';

export const FriendListMain = React.memo(() => {
    const { data: friends, isLoading } = useFriendProfiles();
    const navigate = useNavigate();
    const [search, setSearch] = React.useState('');
    const handleOpenDm = React.useCallback(
        (friendId: string): void => {
            void navigate(`/chat/@user/${friendId}`);
        },
        [navigate],
    );

    const filteredFriends = React.useMemo(() => {
        if (!friends) return [];
        const query = search.toLowerCase();
        return friends.filter((f): boolean => {
            const name = (f.displayName || f.username).toLowerCase();
            return name.includes(query);
        });
    }, [friends, search]);

    const sortedFriends = React.useMemo(
        () =>
            filteredFriends.toSorted((a, b) => {
                const nameA = (a.displayName || a.username).toLowerCase();
                const nameB = (b.displayName || b.username).toLowerCase();
                return nameA.localeCompare(nameB);
            }),
        [filteredFriends],
    );

    const groupedFriends = React.useMemo(() => {
        const groups: Record<string, typeof friends> = {};
        sortedFriends.forEach((friend): void => {
            const name = (friend.displayName || friend.username).toUpperCase();
            let firstChar = name.charAt(0);
            if (!/[A-Z]/.test(firstChar)) {
                firstChar = '#';
            }
            if (!groups[firstChar]) {
                groups[firstChar] = [];
            }
            groups[firstChar]?.push(friend);
        });
        return groups;
    }, [sortedFriends]);

    const groupKeys = React.useMemo(
        () =>
            Object.keys(groupedFriends).sort((a, b): number => {
                if (a === '#') return -1;
                if (b === '#') return 1;
                return a.localeCompare(b);
            }),
        [groupedFriends],
    );

    if (isLoading) {
        return (
            <Box className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((id) => (
                    <Box
                        className="flex items-center justify-between p-3"
                        key={`friend-skeleton-${id}`}
                    >
                        <Box className="flex items-center gap-3">
                            <Skeleton
                                height={40}
                                variant="circular"
                                width={40}
                            />
                            <Box className="space-y-1">
                                <Skeleton height={16} width={100} />
                                <Skeleton height={12} width={140} />
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    }

    if (!friends || friends.length === 0) {
        return (
            <Box className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Box className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle">
                    <CheckCircle className="text-foreground-muted h-8 w-8 opacity-20" />
                </Box>
                <Heading className="mb-2" level={3}>
                    No friends yet
                </Heading>
                <MutedText>
                    Try adding some friends to start chatting!
                </MutedText>
            </Box>
        );
    }

    return (
        <Box className="space-y-4 p-4">
            <Box className="flex items-center justify-between gap-4 px-3">
                <Text className="text-xs font-bold tracking-wider uppercase opacity-50">
                    All Friends - {friends.length}
                </Text>
                <Box className="flex max-w-[200px] flex-1 items-center gap-2 rounded-md bg-bg-subtle/50 px-2 py-1 focus-within:bg-bg-subtle">
                    <Search className="text-foreground-muted" size={14} />
                    <input
                        aria-label="Search friends"
                        className="placeholder:text-foreground-muted w-full bg-transparent text-xs font-medium outline-none"
                        placeholder="Search username"
                        type="text"
                        value={search}
                        onChange={(e): void => setSearch(e.target.value)}
                    />
                </Box>
            </Box>
            {groupKeys.length === 0 && search && (
                <Box className="flex h-32 flex-col items-center justify-center text-center">
                    <MutedText>No friends found for "{search}"</MutedText>
                </Box>
            )}
            {groupKeys.map((key) => (
                <Box className="flex flex-col gap-1" key={key}>
                    <Box className="flex items-center gap-2 px-3 pt-2 pb-1">
                        <Text className="text-foreground-muted text-[10px] font-bold uppercase">
                            {key}
                        </Text>
                        <Box className="h-[1px] flex-1 bg-bg-subtle/30" />
                    </Box>
                    {groupedFriends[key]?.map((friend) => (
                        <FriendProfileRow
                            friend={friend}
                            key={String(friend.id)}
                            onOpenDm={handleOpenDm}
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
});

FriendListMain.displayName = 'FriendListMain';
