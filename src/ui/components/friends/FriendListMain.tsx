import React from 'react';

import { MessageSquare, Search } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useFriendProfiles } from '@/api/friends/friends.queries';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { Box } from '@/ui/components/layout/Box';

export const FriendListMain: React.FC = () => {
    const { data: friends, isLoading } = useFriendProfiles();
    const navigate = useNavigate();
    const [search, setSearch] = React.useState('');

    const filteredFriends = React.useMemo(() => {
        if (!friends) return [];
        const query = search.toLowerCase();
        return friends.filter((f) => {
            const name = (f.displayName || f.username).toLowerCase();
            return name.includes(query);
        });
    }, [friends, search]);

    const sortedFriends = React.useMemo(
        () =>
            [...filteredFriends].sort((a, b) => {
                const nameA = (a.displayName || a.username).toLowerCase();
                const nameB = (b.displayName || b.username).toLowerCase();
                return nameA.localeCompare(nameB);
            }),
        [filteredFriends],
    );

    const groupedFriends = React.useMemo(() => {
        const groups: Record<string, typeof friends> = {};
        sortedFriends.forEach((friend) => {
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

    const groupKeys = Object.keys(groupedFriends).sort((a, b) => {
        if (a === '#') return -1;
        if (b === '#') return 1;
        return a.localeCompare(b);
    });

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
                    All Friends — {friends.length}
                </Text>
                <Box className="flex max-w-[200px] flex-1 items-center gap-2 rounded-md bg-bg-subtle/50 px-2 py-1 focus-within:bg-bg-subtle">
                    <Search className="text-foreground-muted" size={14} />
                    <input
                        className="placeholder:text-foreground-muted w-full bg-transparent text-xs font-medium outline-none"
                        placeholder="Search username"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                        <Box
                            className="group flex items-center justify-between gap-4"
                            key={String(friend._id)}
                        >
                            <UserItem
                                className="flex-1"
                                user={friend}
                                userId={String(friend._id)}
                                onClick={() => {
                                    void navigate(`/chat/@user/${friend._id}`);
                                }}
                            />
                            <Box
                                className="text-foreground-muted flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-bg-secondary transition-colors hover:bg-bg-subtle hover:text-foreground"
                                onClick={() => {
                                    void navigate(`/chat/@user/${friend._id}`);
                                }}
                            >
                                <MessageSquare size={18} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            ))}
        </Box>
    );
};
