import { useEffect, useMemo, useReducer, useState } from 'react';

import { BadgeCheck, Loader2, Search, Tag, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useDiscoveryServers,
    useJoinServer,
    useServers,
} from '@/api/servers/servers.queries';
import type { DiscoveryServer } from '@/api/servers/servers.types';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ServerBannerMedia } from '@/ui/components/servers/ServerBannerMedia';
import { resolveApiUrl } from '@/utils/apiUrl';

interface ServerDiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DISCOVERY_LIMIT = 20;

const mergeServers = (
    current: DiscoveryServer[],
    incoming: DiscoveryServer[],
): DiscoveryServer[] => {
    const seen = new Set(current.map((server): string => server.id));
    return [
        ...current,
        ...incoming.filter((server): boolean => {
            if (seen.has(server.id)) return false;
            seen.add(server.id);
            return true;
        }),
    ];
};

interface DiscoveryPaginationState {
    resetKey: string;
    cursor?: string;
    items: DiscoveryServer[];
}

type DiscoveryPaginationAction =
    | { type: 'reset'; resetKey: string }
    | {
          type: 'receive';
          resetKey: string;
          cursor?: string;
          data: DiscoveryServer[];
      }
    | { type: 'loadMore'; cursor: string };

const discoveryPaginationReducer = (
    state: DiscoveryPaginationState,
    action: DiscoveryPaginationAction,
): DiscoveryPaginationState => {
    switch (action.type) {
        case 'reset': {
            if (state.resetKey === action.resetKey) return state;
            return { resetKey: action.resetKey, items: [] };
        }
        case 'receive': {
            if (state.resetKey !== action.resetKey) return state;
            return {
                ...state,
                items:
                    action.cursor === undefined
                        ? action.data
                        : mergeServers(state.items, action.data),
            };
        }
        case 'loadMore': {
            return { ...state, cursor: action.cursor };
        }
        default: {
            return state;
        }
    }
};

export const ServerDiscoveryModal = ({
    isOpen,
    onClose,
}: ServerDiscoveryModalProps) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 350);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [joiningServerId, setJoiningServerId] = useState<string | null>(null);

    const normalizedTags = useMemo(
        (): string[] =>
            selectedTags.toSorted((a, b): number => a.localeCompare(b)),
        [selectedTags],
    );
    const { data: joinedServers = [] } = useServers();
    const joinedServerIds = useMemo(
        (): Set<string> =>
            new Set(joinedServers.map((server): string => server.id)),
        [joinedServers],
    );
    const { mutate: joinServer, isPending: isJoining } = useJoinServer();

    const resetKey = useMemo(
        (): string =>
            JSON.stringify({
                q: debouncedSearch.trim().toLowerCase(),
                tags: normalizedTags.map((tag): string => tag.toLowerCase()),
            }),
        [debouncedSearch, normalizedTags],
    );
    const [pagination, dispatchPagination] = useReducer(
        discoveryPaginationReducer,
        { resetKey, items: [] },
    );
    const activeCursor =
        pagination.resetKey === resetKey ? pagination.cursor : undefined;
    const items = useMemo(
        (): DiscoveryServer[] =>
            pagination.resetKey === resetKey ? pagination.items : [],
        [pagination.resetKey, pagination.items, resetKey],
    );

    const { data, isFetching } = useDiscoveryServers({
        q: debouncedSearch,
        tags: normalizedTags,
        limit: DISCOVERY_LIMIT,
        cursor: activeCursor,
    });

    useEffect((): void => {
        dispatchPagination({ type: 'reset', resetKey });
    }, [resetKey]);

    useEffect((): void => {
        if (data === undefined) return;
        dispatchPagination({
            type: 'receive',
            resetKey,
            cursor: activeCursor,
            data: data.items,
        });
    }, [activeCursor, data, resetKey]);

    const visibleTags = useMemo((): string[] => {
        const fromFacets =
            data?.tagFacets.map((facet): string => facet.tag) ?? [];
        const fromItems = items.flatMap((server): string[] => server.tags);
        return [...new Set([...selectedTags, ...fromFacets, ...fromItems])]
            .filter(Boolean)
            .slice(0, 24);
    }, [data?.tagFacets, items, selectedTags]);

    const toggleTag = (tag: string): void => {
        setSelectedTags((current): string[] =>
            current.includes(tag)
                ? current.filter((item): boolean => item !== tag)
                : [...current, tag],
        );
    };

    const handleJoin = (server: DiscoveryServer): void => {
        if (joinedServerIds.has(server.id)) {
            onClose();
            void navigate(`/chat/@server/${server.id}`);
            return;
        }

        setJoiningServerId(server.id);
        joinServer(server.inviteCode, {
            onSuccess: (): void => {
                onClose();
                void navigate(`/chat/@server/${server.id}`);
            },
            onSettled: (): void => {
                setJoiningServerId(null);
            },
        });
    };

    return (
        <Modal
            fullScreen
            noPadding
            isOpen={isOpen}
            title="Server Discovery"
            onClose={onClose}
        >
            <div className="flex h-full flex-col bg-background">
                <div className="border-b border-border-subtle bg-bg-subtle/60 px-4 py-4 md:px-8">
                    <div className="mx-auto flex max-w-6xl flex-col gap-4">
                        <div className="relative">
                            <Input
                                icon={<Search size={16} />}
                                placeholder="Search by server name, description, or tag"
                                size="lg"
                                style={{ paddingRight: '2.75rem' }}
                                value={search}
                                onChange={(event): void => {
                                    setSearch(event.target.value);
                                }}
                            />
                            {search === '' ? null : (
                                <button
                                    className="absolute top-1/2 right-3 rounded p-1 text-muted-foreground hover:bg-bg-secondary hover:text-foreground"
                                    type="button"
                                    onClick={(): void => {
                                        setSearch('');
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {visibleTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {visibleTags.map((tag) => {
                                    const selected = selectedTags.includes(tag);
                                    return (
                                        <button
                                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold transition-colors ${
                                                selected
                                                    ? 'border-primary bg-primary text-foreground-inverse'
                                                    : 'border-border-subtle bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                            }`}
                                            key={tag}
                                            type="button"
                                            onClick={(): void => {
                                                toggleTag(tag);
                                            }}
                                        >
                                            <Tag size={12} />
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 md:px-8">
                    <div className="mx-auto max-w-6xl">
                        {items.length === 0 && isFetching ? (
                            <div className="flex h-[40vh] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex h-[40vh] flex-col items-center justify-center text-center">
                                <Text size="lg" weight="bold">
                                    No servers found
                                </Text>
                                <Text className="mt-1" variant="muted">
                                    Try a different search or clear selected
                                    tags.
                                </Text>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {items.map((server) => (
                                    <DiscoveryServerCard
                                        isJoined={joinedServerIds.has(
                                            server.id,
                                        )}
                                        isJoining={
                                            isJoining
                                                ? joiningServerId === server.id
                                                : false
                                        }
                                        key={server.id}
                                        server={server}
                                        onJoin={handleJoin}
                                        onTagClick={toggleTag}
                                    />
                                ))}
                            </div>
                        )}

                        {data?.nextCursor ? (
                            <div className="flex justify-center pt-6">
                                <Button
                                    loading={isFetching}
                                    variant="normal"
                                    onClick={(): void => {
                                        if (data.nextCursor !== undefined) {
                                            dispatchPagination({
                                                type: 'loadMore',
                                                cursor: data.nextCursor,
                                            });
                                        }
                                    }}
                                >
                                    Load More
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

interface DiscoveryServerCardProps {
    server: DiscoveryServer;
    isJoined: boolean;
    isJoining: boolean;
    onJoin: (server: DiscoveryServer) => void;
    onTagClick: (tag: string) => void;
}

const DiscoveryServerCard = ({
    server,
    isJoined,
    isJoining,
    onJoin,
    onTagClick,
}: DiscoveryServerCardProps) => {
    const iconUrl = resolveApiUrl(server.icon);
    const initials = server.name
        .split(' ')
        .map((word): string => word[0] ?? '')
        .join('')
        .slice(0, 3)
        .toUpperCase();

    return (
        <Box className="flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-subtle">
            <div className="relative h-28 bg-bg-secondary">
                <ServerBannerMedia alt="" banner={server.banner} />
                <div className="absolute -bottom-8 left-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-bg-subtle bg-background text-lg font-black">
                    {iconUrl ? (
                        <img
                            alt={server.name}
                            className="h-full w-full object-cover"
                            src={iconUrl}
                        />
                    ) : (
                        initials
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-10">
                <div>
                    <div className="flex min-w-0 items-center gap-2">
                        {server.verified ? (
                            <BadgeCheck
                                className="shrink-0 text-primary"
                                size={18}
                            />
                        ) : null}
                        <Text className="truncate" size="lg" weight="bold">
                            {server.name}
                        </Text>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users size={13} />
                        {server.memberCount.toLocaleString()} members
                    </div>
                </div>

                <Text className="line-clamp-3 min-h-[3.75rem]" size="sm">
                    {server.description || 'No description yet.'}
                </Text>

                <div className="flex flex-wrap gap-1.5">
                    {server.tags.map((tag) => (
                        <button
                            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20"
                            key={tag}
                            type="button"
                            onClick={(): void => {
                                onTagClick(tag);
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <div className="mt-auto">
                    <Button
                        className="w-full"
                        loading={isJoined ? undefined : isJoining}
                        variant={isJoined ? 'normal' : 'primary'}
                        onClick={(): void => {
                            onJoin(server);
                        }}
                    >
                        {isJoined ? 'Open Server' : 'Join Server'}
                    </Button>
                </div>
            </div>
        </Box>
    );
};
