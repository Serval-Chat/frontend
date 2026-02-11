import React, { useRef, useState } from 'react';

import { Trash2, Upload, UserPlus } from 'lucide-react';

import {
    useDeleteServer,
    useMembers,
    useServerDetails,
    useTransferOwnership,
    useUpdateServer,
    useUpdateServerBanner,
    useUpdateServerIcon,
} from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { resolveApiUrl } from '@/utils/apiUrl';

interface ServerOverviewSettingsProps {
    serverId: string;
}

export const ServerOverviewSettings: React.FC<ServerOverviewSettingsProps> = ({
    serverId,
}) => {
    const { data: server, isLoading } = useServerDetails(serverId);
    const { mutate: updateServer, isPending: isUpdatingServer } =
        useUpdateServer(serverId);
    const { mutate: updateIcon, isPending: isUpdatingIcon } =
        useUpdateServerIcon(serverId);
    const { mutate: updateBanner, isPending: isUpdatingBanner } =
        useUpdateServerBanner(serverId);

    const iconInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(server?.name || '');
    const [originalName, setOriginalName] = useState(server?.name || '');

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<
        'avatar' | 'banner' | 'server-banner'
    >('avatar');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    React.useEffect(() => {
        if (server) {
            setName(server.name);
            setOriginalName(server.name);
        }
    }, [server]);

    const hasChanges = name !== originalName;
    const isPending = isUpdatingServer || isUpdatingIcon || isUpdatingBanner;

    const handleSave = (): void => {
        if (!hasChanges) return;
        updateServer(
            { name },
            {
                onSuccess: () => {
                    setOriginalName(name);
                },
            },
        );
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            setCropFile(file);
            setCropType('avatar'); // for 1:1 ratio
            setIsCropModalOpen(true);
            e.target.value = '';
        }
    };

    const handleBannerChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = e.target.files?.[0];
        if (file) {
            setCropFile(file);
            setCropType('server-banner');
            setIsCropModalOpen(true);
            e.target.value = '';
        }
    };

    const handleCropConfirm = (processedFile: File): void => {
        if (cropType === 'avatar') {
            updateIcon(processedFile);
        } else {
            updateBanner(processedFile);
        }
    };

    const { data: me } = useMe();
    const { data: members } = useMembers(serverId);
    const { mutate: deleteServer, isPending: isDeleting } = useDeleteServer();
    const { mutate: transferOwnership, isPending: isTransferring } =
        useTransferOwnership(serverId);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState('');

    const isOwner =
        !!server && !!me && server.ownerId.toString() === me._id.toString();

    const handleDeleteServer = (): void => {
        if (!server || confirmDeleteName !== server.name) return;
        deleteServer(serverId, {
            onSuccess: () => {
                window.location.href = '/';
            },
        });
    };

    const handleTransferOwnership = (newOwnerId: string): void => {
        transferOwnership(newOwnerId, {
            onSuccess: () => {
                setIsTransferModalOpen(false);
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (!server) return null;

    const iconUrl = resolveApiUrl(server.icon);

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <input
                accept="image/*"
                className="hidden"
                id="server-icon-upload"
                ref={iconInputRef}
                type="file"
                onChange={handleIconChange}
            />
            <input
                accept="image/*"
                className="hidden"
                id="server-banner-upload"
                ref={bannerInputRef}
                type="file"
                onChange={handleBannerChange}
            />

            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Server Overview
                </Heading>
                <Text className="text-[var(--color-muted-foreground)]">
                    Update your server's identity and appearance.
                </Text>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
                {/* Visuals Section */}
                <div className="space-y-8 flex-shrink-0">
                    <div className="space-y-3">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="server-icon-upload"
                        >
                            Server Icon
                        </label>
                        <div
                            className="group relative w-32 h-32 rounded-3xl bg-[var(--color-bg-subtle)] flex items-center justify-center border border-[var(--color-border-subtle)] overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-all"
                            role="button"
                            tabIndex={0}
                            onClick={() => iconInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    iconInputRef.current?.click();
                                }
                            }}
                        >
                            {iconUrl ? (
                                <img
                                    alt={server.name}
                                    className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                                    src={iconUrl}
                                />
                            ) : (
                                <Text className="text-2xl font-bold">
                                    {server.name.charAt(0).toUpperCase()}
                                </Text>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <Text className="text-[10px] text-white font-bold uppercase">
                                    Change Icon
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="server-banner-upload"
                        >
                            Server Banner
                        </label>
                        <div
                            className="group relative w-full aspect-[16/9] md:w-64 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center border border-[var(--color-border-subtle)] overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-all"
                            role="button"
                            tabIndex={0}
                            onClick={() => bannerInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    bannerInputRef.current?.click();
                                }
                            }}
                        >
                            {server.banner?.value ? (
                                <img
                                    alt="Banner"
                                    className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                                    src={
                                        resolveApiUrl(server.banner.value) || ''
                                    }
                                />
                            ) : (
                                <div className="p-4 text-center">
                                    <Text className="text-[var(--color-muted-foreground)] text-xs">
                                        No Banner Set
                                    </Text>
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <Text className="text-[10px] text-white font-bold uppercase">
                                    Change Banner
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="serverName"
                        >
                            Server Name
                        </label>
                        <Input
                            id="serverName"
                            placeholder="Enter server name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            {isOwner && (
                <div className="pt-10 space-y-6">
                    <div className="pb-4 border-b border-[var(--color-border-subtle)]">
                        <Heading
                            className="text-[var(--color-error)]"
                            level={2}
                            variant="section"
                        >
                            Danger Zone
                        </Heading>
                    </div>

                    <div className="rounded-lg border border-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-subtle)]">
                        <div className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Text as="p" weight="bold">
                                    Transfer Ownership
                                </Text>
                                <Text
                                    as="p"
                                    className="text-[var(--color-muted-foreground)]"
                                    size="xs"
                                >
                                    Give this server to another member. This
                                    action cannot be undone.
                                </Text>
                            </div>
                            <Button
                                className="min-w-[120px]"
                                variant="danger"
                                onClick={() => setIsTransferModalOpen(true)}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Transfer
                            </Button>
                        </div>

                        <div className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <Text
                                    as="p"
                                    className="text-[var(--color-status-error)]"
                                    weight="bold"
                                >
                                    Delete Server
                                </Text>
                                <Text
                                    as="p"
                                    className="text-[var(--color-muted-foreground)]"
                                    size="xs"
                                >
                                    Permanently delete this server and all its
                                    data. This action is IRREVERSIBLE.
                                </Text>
                            </div>
                            <Button
                                className="min-w-[120px]"
                                variant="danger"
                                onClick={() => setIsDeleteModalOpen(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Server
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <SettingsFloatingBar
                isPending={isPending}
                isVisible={hasChanges}
                onReset={() => {
                    setName(originalName);
                }}
                onSave={handleSave}
            />

            <ImageCropModal
                imageFile={cropFile}
                isOpen={isCropModalOpen}
                type={cropType}
                onClose={() => setIsCropModalOpen(false)}
                onConfirm={handleCropConfirm}
            />

            {/* Delete Server Modal */}
            <Modal
                className="max-w-md"
                isOpen={isDeleteModalOpen}
                title={`Delete '${server.name}'`}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setConfirmDeleteName('');
                }}
            >
                <div className="space-y-6">
                    <div className="p-4 bg-[var(--color-status-error-bg)] border border-[var(--color-status-error)] rounded-md text-[var(--color-status-error)] text-sm">
                        Are you sure you want to delete{' '}
                        <strong>{server.name}</strong>? This action cannot be
                        undone. All messages, channels, and roles will be
                        permanently removed.
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase"
                            htmlFor="confirm-delete-name"
                        >
                            Enter Server Name
                        </label>
                        <Input
                            id="confirm-delete-name"
                            placeholder={server.name}
                            value={confirmDeleteName}
                            onChange={(e) =>
                                setConfirmDeleteName(e.target.value)
                            }
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 bg-[var(--color-bg-secondary)] -mx-6 -mb-6 p-6">
                        <Button
                            className="min-w-[96px]"
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="min-w-[96px]"
                            disabled={confirmDeleteName !== server.name}
                            loading={isDeleting}
                            variant="danger"
                            onClick={handleDeleteServer}
                        >
                            Delete Server
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Transfer Ownership Modal */}
            <Modal
                className="max-w-md"
                isOpen={isTransferModalOpen}
                title="Transfer Ownership"
                onClose={() => setIsTransferModalOpen(false)}
            >
                <div className="space-y-6">
                    <Text
                        className="text-[var(--color-muted-foreground)]"
                        size="sm"
                    >
                        Transferring ownership will make another member the
                        owner of this server. You will no longer have full
                        control over the server.
                    </Text>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                        {members
                            ?.filter((m) => m.userId !== me?._id)
                            .map((member) => (
                                <div
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--color-bg-subtle)] transition-colors group"
                                    key={member.userId}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                                            {member.user.profilePicture ? (
                                                <img
                                                    alt={member.user.username}
                                                    className="w-full h-full object-cover"
                                                    src={
                                                        resolveApiUrl(
                                                            member.user
                                                                .profilePicture,
                                                        ) || ''
                                                    }
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                                    {member.user.username
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <Text size="sm" weight="semibold">
                                                {member.user.displayName ||
                                                    member.user.username}
                                            </Text>
                                            <Text
                                                className="text-[var(--color-muted-foreground)]"
                                                size="xs"
                                            >
                                                @{member.user.username}
                                            </Text>
                                        </div>
                                    </div>
                                    <Button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        loading={isTransferring}
                                        size="sm"
                                        variant="primary"
                                        onClick={() =>
                                            handleTransferOwnership(
                                                member.userId,
                                            )
                                        }
                                    >
                                        Transfer
                                    </Button>
                                </div>
                            ))}
                    </div>

                    <div className="flex justify-end pt-4 -mx-6 -mb-6 p-6">
                        <Button
                            variant="ghost"
                            onClick={() => setIsTransferModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
