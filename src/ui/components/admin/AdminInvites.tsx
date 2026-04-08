import { type ReactNode, useState } from 'react';

import { Copy, Download, Layers, Plus, Ticket } from 'lucide-react';

import { adminInvitesApi } from '@/api/admin/invites.api';
import {
    useAdminInvites,
    useCreateAdminInvite,
    useCreateBatchAdminInvites,
} from '@/hooks/admin/useAdminInvites';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';

export const AdminInvites = (): ReactNode => {
    const { data: invites, isLoading, error } = useAdminInvites();
    const { mutate: createInvite, isPending: isCreating } =
        useCreateAdminInvite();
    const { mutate: createBatch, isPending: isBatchCreating } =
        useCreateBatchAdminInvites();
    const { showToast } = useToast();

    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchCount, setBatchCount] = useState('10');
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    const handleCreateInvite = (): void => {
        createInvite(undefined, {
            onSuccess: (data: { token: string }) => {
                setGeneratedToken(data.token);
            },
            onError: (e: Error) => {
                showToast(e.message || 'Failed to create invite', 'error');
            },
        });
    };

    const handleBatchCreate = (): void => {
        const count = parseInt(batchCount, 10);
        if (isNaN(count) || count <= 0 || count > 1000) {
            showToast('Please enter a count between 1 and 1000', 'error');
            return;
        }

        createBatch(
            { count },
            {
                onSuccess: (data: { tokens: string[] }) => {
                    showToast(
                        `Successfully generated ${data.tokens.length} invites`,
                        'success',
                    );
                    setIsBatchModalOpen(false);

                    const blob = new Blob([data.tokens.join('\n')], {
                        type: 'text/plain',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `new_invites_${new Date().toISOString().split('T')[0]}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                },
                onError: (e: Error) => {
                    showToast(e.message || 'Failed to generate batch', 'error');
                },
            },
        );
    };

    const handleExportAll = (): void => {
        const url = adminInvitesApi.getExportInvitesUrl();
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invites.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Heading level={2} variant="admin-page">
                        Invite Tokens
                    </Heading>
                    <Text as="p" variant="muted">
                        Generate tokens used during registration.
                    </Text>
                </div>
                <div className="flex gap-2">
                    <Button
                        disabled={isLoading}
                        variant="normal"
                        onClick={handleExportAll}
                    >
                        <Download size={16} /> Export All
                    </Button>
                    <Button
                        disabled={isCreating || isBatchCreating}
                        variant="normal"
                        onClick={() => setIsBatchModalOpen(true)}
                    >
                        <Layers size={16} /> Batch Generate
                    </Button>
                    <Button
                        disabled={isCreating || isBatchCreating}
                        loading={isCreating}
                        variant="primary"
                        onClick={handleCreateInvite}
                    >
                        <Plus size={16} /> Generate Invite
                    </Button>
                </div>
            </div>

            <Modal
                isOpen={isBatchModalOpen}
                title="Batch Generate Invites"
                onClose={() => setIsBatchModalOpen(false)}
            >
                <div className="space-y-4 py-2">
                    <Text as="p" size="sm" variant="muted">
                        Enter the number of invite tokens you want to generate.
                        New tokens will be automatically downloaded as a .txt
                        file.
                    </Text>
                    <div className="space-y-2">
                        <Input
                            max={1000}
                            min={1}
                            placeholder="Count (1-1000)"
                            type="number"
                            value={batchCount}
                            onChange={(e) => setBatchCount(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleBatchCreate();
                            }}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBatchModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={isBatchCreating}
                            variant="primary"
                            onClick={handleBatchCreate}
                        >
                            Generate & Download
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!generatedToken}
                title="Invite Created"
                onClose={() => setGeneratedToken(null)}
            >
                <div className="space-y-4 py-4">
                    <Text as="p" weight="medium">
                        Here's the token:
                    </Text>

                    <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-secondary/50 p-4 transition-colors hover:bg-bg-secondary">
                        <code className="flex-1 font-mono text-lg font-bold tracking-widest break-all text-primary">
                            {generatedToken}
                        </code>
                        <IconButton
                            icon={Copy}
                            iconSize={18}
                            title="Copy to clipboard"
                            variant="ghost"
                            onClick={() => {
                                if (generatedToken) {
                                    void navigator.clipboard.writeText(
                                        generatedToken,
                                    );
                                    showToast(
                                        'Token copied to clipboard!',
                                        'success',
                                    );
                                }
                            }}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            variant="primary"
                            onClick={() => setGeneratedToken(null)}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="grid gap-6 md:grid-cols-1">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary/30 p-12 text-center transition-colors hover:bg-bg-secondary/50">
                    {isLoading ? (
                        <div className="py-10 text-muted-foreground">
                            Loading invites...
                        </div>
                    ) : error ? (
                        <div className="py-10 text-danger">{error.message}</div>
                    ) : (
                        <>
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform hover:scale-110">
                                    <Ticket size={32} />
                                </div>
                            </div>
                            <Heading className="mb-2" level={3}>
                                {invites?.length || 0} Active Invites
                            </Heading>
                            <Text as="p" size="sm" variant="muted">
                                There are currently {invites?.length || 0}{' '}
                                tokens available for registration.
                                <br />
                                You can generate more or export the full list
                                below.
                            </Text>
                            {!invites?.length && !isLoading && (
                                <div className="mt-8 flex flex-col items-center gap-4">
                                    <div className="h-1 w-12 rounded-full bg-border-subtle" />
                                    <Text as="p" size="xs" variant="muted">
                                        No active invites found. Start by
                                        generating one!
                                    </Text>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
