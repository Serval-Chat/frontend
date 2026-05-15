import React, { useMemo, useState } from 'react';

import { Check, Copy, Globe, Trash2 } from 'lucide-react';

import {
    useCreateWebsiteConnection,
    useMe,
    useRemoveConnection,
    useVerifyConnection,
} from '@/api/users/users.queries';
import type { CreateWebsiteConnectionResponse } from '@/api/users/users.types';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Link } from '@/ui/components/common/Link';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { extractApiError } from '@/utils/extractApiError';

export const WebsiteConnectionsSettings: React.FC = () => {
    const { data: user } = useMe();
    const { showToast } = useToast();
    const [website, setWebsite] = useState('');
    const [instructions, setInstructions] =
        useState<CreateWebsiteConnectionResponse | null>(null);

    const { mutate: createWebsiteConnection, isPending: isCreating } =
        useCreateWebsiteConnection();
    const { mutate: verifyConnection, isPending: isVerifying } =
        useVerifyConnection();
    const { mutate: removeConnection, isPending: isRemoving } =
        useRemoveConnection();

    const pendingConnections = useMemo(
        () =>
            (user?.connections ?? []).filter(
                (connection) => connection.status === 'pending',
            ),
        [user?.connections],
    );
    const verifiedConnections = useMemo(
        () =>
            (user?.connections ?? []).filter(
                (connection) => connection.status === 'verified',
            ),
        [user?.connections],
    );

    const handleCreate = (): void => {
        if (website.trim() === '') {
            showToast('Enter a website first.', 'error');
            return;
        }

        createWebsiteConnection(website, {
            onSuccess: (data) => {
                setInstructions(data);
                setWebsite('');
                showToast('DNS record generated.', 'success');
            },
            onError: (error) => {
                showToast(
                    extractApiError(
                        error,
                        'Could not add website. Please verify the URL and try again.',
                    ),
                    'error',
                );
            },
        });
    };

    const handleVerify = (connectionId: string): void => {
        verifyConnection(connectionId, {
            onSuccess: () => {
                setInstructions(null);
                showToast('Website verified.', 'success');
            },
            onError: (error) => {
                showToast(
                    extractApiError(
                        error,
                        "We couldn't find the DNS record yet. It may take a few minutes for changes to propagate.",
                    ),
                    'error',
                );
            },
        });
    };

    const handleRemove = (connectionId: string): void => {
        removeConnection(connectionId, {
            onSuccess: () => {
                setInstructions((current) =>
                    current?.connectionId === connectionId ? null : current,
                );
                showToast('Connection removed.', 'success');
            },
            onError: (error) => {
                showToast(
                    extractApiError(error, 'Failed to remove connection'),
                    'error',
                );
            },
        });
    };

    const copyValue = async (value: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(value);
            showToast('Copied.', 'success');
        } catch {
            showToast('Failed to copy value.', 'error');
        }
    };

    return (
        <div className="space-y-4 border-t border-border-subtle pt-6">
            <div>
                <Text weight="bold">Website Connections</Text>
                <br />
                <Text className="mt-1" size="xs" variant="muted">
                    Add a website you own to your public profile.
                </Text>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    placeholder="ser.chat"
                    type="text"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') handleCreate();
                    }}
                />
                <Button
                    retainSize
                    icon={Globe}
                    loading={isCreating}
                    type="button"
                    variant="normal"
                    onClick={handleCreate}
                >
                    Add website
                </Button>
            </div>

            {instructions && (
                <div className="space-y-3 rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <Text size="sm" weight="bold">
                        Add this TXT record to your DNS records.
                    </Text>
                    <DnsRecordRow
                        label="Type"
                        value={instructions.recordType}
                        onCopy={copyValue}
                    />
                    <DnsRecordRow
                        label="Name"
                        value={instructions.recordName}
                        onCopy={copyValue}
                    />
                    <DnsRecordRow
                        label="Value"
                        value={instructions.recordValue}
                        onCopy={copyValue}
                    />
                    <div className="flex justify-end">
                        <Button
                            icon={Check}
                            loading={isVerifying}
                            size="sm"
                            type="button"
                            variant="normal"
                            onClick={() =>
                                handleVerify(instructions.connectionId)
                            }
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            )}

            {pendingConnections.length > 0 && (
                <ConnectionList
                    connections={pendingConnections}
                    isRemoving={isRemoving}
                    isVerifying={isVerifying}
                    statusLabel="Pending"
                    onRemove={handleRemove}
                    onVerify={handleVerify}
                />
            )}

            {verifiedConnections.length > 0 && (
                <ConnectionList
                    connections={verifiedConnections}
                    isRemoving={isRemoving}
                    isVerifying={false}
                    statusLabel="Verified"
                    onRemove={handleRemove}
                />
            )}
        </div>
    );
};

interface DnsRecordRowProps {
    label: string;
    value: string;
    onCopy: (value: string) => Promise<void>;
}

const DnsRecordRow: React.FC<DnsRecordRowProps> = ({
    label,
    value,
    onCopy,
}) => (
    <div className="grid gap-2 sm:grid-cols-[80px_1fr_auto] sm:items-center">
        <Text size="xs" variant="muted">
            {label}
        </Text>
        <code className="min-w-0 overflow-x-auto rounded bg-background px-2 py-1 text-xs text-foreground">
            {value}
        </code>
        <Button
            icon={Copy}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => void onCopy(value)}
        >
            Copy
        </Button>
    </div>
);

interface ConnectionListProps {
    connections: Array<{
        id: string;
        type: 'Website';
        value: string;
        status?: 'pending' | 'verified';
    }>;
    statusLabel: string;
    isRemoving: boolean;
    isVerifying: boolean;
    onRemove: (connectionId: string) => void;
    onVerify?: (connectionId: string) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({
    connections,
    statusLabel,
    isRemoving,
    isVerifying,
    onRemove,
    onVerify,
}) => (
    <div className="space-y-2">
        <Text size="xs" variant="muted">
            {statusLabel}
        </Text>
        {connections.map((connection) => (
            <div
                className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-subtle p-3"
                key={connection.id}
            >
                <div className="min-w-0">
                    {connection.status === 'verified' ? (
                        <Link
                            external
                            className="block truncate text-sm"
                            href={`https://${connection.value}`}
                        >
                            {connection.value}
                        </Link>
                    ) : (
                        <Text className="truncate" size="sm">
                            {connection.value}
                        </Text>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {connection.status === 'pending' && onVerify && (
                        <Button
                            loading={isVerifying}
                            size="sm"
                            type="button"
                            variant="normal"
                            onClick={() => onVerify(connection.id)}
                        >
                            Verify
                        </Button>
                    )}
                    <Button
                        icon={Trash2}
                        loading={isRemoving}
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => onRemove(connection.id)}
                    >
                        Remove
                    </Button>
                </div>
            </div>
        ))}
    </div>
);
