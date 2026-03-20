import React, { useState } from 'react';
import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { useServerAuditLog } from '@/api/auditLog/auditLog.queries';
import type {
    AuditLogEntry as IAuditLogEntry,
    AuditLogFilters as IAuditLogFilters,
} from '@/api/auditLog/auditLog.types';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { WsEvents, wsMessages } from '@/ws';

import { AuditLogEntry } from './AuditLogEntry';
import { AuditLogFilters } from './AuditLogFilters';

interface AuditLogSettingsProps {
    serverId: string;
}

export const AuditLogSettings: React.FC<AuditLogSettingsProps> = ({
    serverId,
}) => {
    const [filters, setFilters] = useState<IAuditLogFilters>({});
    const [globalExpandState, setGlobalExpandState] = useState<
        'expanded' | 'collapsed' | null
    >(null);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useServerAuditLog(serverId, filters);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (serverId) {
            wsMessages.joinServer(serverId);
        }
    }, [serverId]);

    const handleAuditLogEntry = React.useCallback(
        (payload: { serverId: string; entry: IAuditLogEntry }) => {
            if (payload.serverId !== serverId) {
                return;
            }

            void queryClient.invalidateQueries({
                queryKey: ['server', 'auditLog', serverId],
            });
        },
        [serverId, queryClient],
    );

    useWebSocket(WsEvents.AUDIT_LOG_ENTRY_CREATED, handleAuditLogEntry);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
                <Heading className="text-red-500" level={3}>
                    Failed to load audit logs
                </Heading>
                <Text variant="muted">
                    You might not have permission, or there was a server error.
                </Text>
            </div>
        );
    }

    const entries =
        data?.pages.flatMap((page) => page?.entries || []).filter(Boolean) ??
        [];

    return (
        <div className="max-w-5xl space-y-6 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Server Audit Log
                </Heading>
                <Text variant="muted">
                    A record of moderation actions and server changes. Only
                    visible to users with the Manage Server permission.
                </Text>
            </div>

            <AuditLogFilters filters={filters} onFiltersChange={setFilters} />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner />
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-subtle py-12 text-center opacity-50">
                    <ShieldAlert className="mb-3 h-12 w-12 text-muted-foreground" />
                    <Text className="mb-1" size="lg" weight="medium">
                        No audit log entries found
                    </Text>
                    <Text size="sm">
                        Try adjusting your filters, or check back later after
                        some actions have occurred.
                    </Text>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Text size="sm" variant="muted">
                            Showing {entries.length} entries
                        </Text>
                        <div className="flex items-center gap-2">
                            <Button
                                className="h-8 px-3 text-xs"
                                variant="ghost"
                                onClick={() => {
                                    setGlobalExpandState(null);
                                    setTimeout(
                                        () => setGlobalExpandState('expanded'),
                                        0,
                                    );
                                }}
                            >
                                <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                                Expand All
                            </Button>
                            <Button
                                className="h-8 px-3 text-xs"
                                variant="ghost"
                                onClick={() => {
                                    setGlobalExpandState(null);
                                    setTimeout(
                                        () => setGlobalExpandState('collapsed'),
                                        0,
                                    );
                                }}
                            >
                                <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                                Collapse All
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {entries.map((entry) => (
                            <AuditLogEntry
                                entry={entry}
                                globalExpandState={globalExpandState}
                                key={entry.id}
                                serverId={serverId}
                            />
                        ))}
                    </div>

                    {hasNextPage && (
                        <div className="flex justify-center pt-4">
                            <Button
                                disabled={isFetchingNextPage}
                                variant="ghost"
                                onClick={() => void fetchNextPage()}
                            >
                                {isFetchingNextPage
                                    ? 'Loading more...'
                                    : 'Load More'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
