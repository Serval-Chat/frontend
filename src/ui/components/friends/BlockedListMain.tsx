import React from 'react';

import { Search, UserX } from 'lucide-react';

import { useBlocks, useRemoveBlock } from '@/api/blocks/blocks.queries';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { Box } from '@/ui/components/layout/Box';

export const BlockedListMain = () => {
    const { data: blocks, isLoading } = useBlocks();
    const { mutate: unblock } = useRemoveBlock();
    const [search, setSearch] = React.useState('');

    const filteredBlocks = React.useMemo(() => {
        if (!blocks) return [];
        const query = search.toLowerCase();
        return blocks.filter((b): boolean => {
            const name = b.targetUsername.toLowerCase();
            return name.includes(query);
        });
    }, [blocks, search]);

    if (isLoading) {
        return (
            <Box className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((id) => (
                    <Box
                        className="flex items-center justify-between p-3"
                        key={`block-skeleton-${id}`}
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

    if (!blocks || blocks.length === 0) {
        return (
            <Box className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Box className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle">
                    <UserX className="text-foreground-muted h-8 w-8 opacity-20" />
                </Box>
                <Heading className="mb-2" level={3}>
                    No blocked users
                </Heading>
                <MutedText>You haven't blocked anyone yet.</MutedText>
            </Box>
        );
    }

    return (
        <Box className="space-y-4 p-4">
            <Box className="flex items-center justify-between gap-4 px-3">
                <Text className="text-xs font-bold tracking-wider uppercase opacity-50">
                    Blocked Users - {blocks.length}
                </Text>
                <Box className="flex max-w-[200px] flex-1 items-center gap-2 rounded-md bg-bg-subtle/50 px-2 py-1 focus-within:bg-bg-subtle">
                    <Search className="text-foreground-muted" size={14} />
                    <input
                        aria-label="Search blocked users"
                        className="placeholder:text-foreground-muted w-full bg-transparent text-xs font-medium outline-none"
                        placeholder="Search username"
                        type="text"
                        value={search}
                        onChange={(e): void => {
                            setSearch(e.target.value);
                        }}
                    />
                </Box>
            </Box>
            {filteredBlocks.length === 0 && search ? (
                <Box className="flex h-32 flex-col items-center justify-center text-center">
                    <MutedText>No blocked users found for "{search}"</MutedText>
                </Box>
            ) : null}
            <Box className="flex flex-col gap-1">
                {filteredBlocks.map((block) => (
                    <Box
                        className="group flex items-center justify-between gap-4"
                        key={block.targetUserId}
                    >
                        <UserItem
                            className="flex-1"
                            userId={block.targetUserId}
                        />
                        <Box
                            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-bg-secondary text-danger transition-colors hover:bg-danger hover:text-white"
                            title="Unblock"
                            onClick={(): void => {
                                unblock(block.targetUserId);
                            }}
                        >
                            <UserX size={18} />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
