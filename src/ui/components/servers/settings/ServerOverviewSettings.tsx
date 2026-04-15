import React, { useRef, useState } from 'react';

import {
    BadgeCheck,
    Plus,
    Tag,
    Trash2,
    Upload,
    UserPlus,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useDeleteServer,
    useMembers,
    useRequestServerVerification,
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
    const navigate = useNavigate();
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
    const [tags, setTags] = useState<string[]>(server?.tags || []);
    const [originalTags, setOriginalTags] = useState<string[]>(
        server?.tags || [],
    );
    const [tagInput, setTagInput] = useState('');

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<
        'avatar' | 'banner' | 'server-banner'
    >('avatar');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    React.useEffect(() => {
        if (server) {
            setName(server.name);
            setOriginalName(server.name);
            setTags(server.tags || []);
            setOriginalTags(server.tags || []);
        }
    }, [server]);

    const hasChanges =
        name !== originalName ||
        JSON.stringify(tags) !== JSON.stringify(originalTags);
    const isPending = isUpdatingServer || isUpdatingIcon || isUpdatingBanner;

    const handleSave = (): void => {
        if (!hasChanges) return;
        updateServer(
            { name, tags },
            {
                onSuccess: () => {
                    setOriginalName(name);
                    setOriginalTags(tags);
                },
            },
        );
    };

    const handleAddTag = (): void => {
        const trimmed = tagInput.trim();
        if (!trimmed || tags.includes(trimmed) || tags.length >= 8) return;
        setTags([...tags, trimmed]);
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string): void => {
        setTags(tags.filter((t) => t !== tagToRemove));
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
    const { mutate: requestVerification, isPending: isRequestingVerification } =
        useRequestServerVerification(serverId);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState('');

    const isOwner =
        !!server && !!me && server.ownerId.toString() === me._id.toString();

    const handleDeleteServer = (): void => {
        if (!server || confirmDeleteName !== server.name) return;
        deleteServer(serverId, {
            onSuccess: () => {
                void navigate('/chat/@me');
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
            <div className="flex h-full items-center justify-center">
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
                <Text variant="muted">
                    Update your server's identity and appearance.
                </Text>
            </div>

            <div className="flex flex-col gap-12 md:flex-row">
                {/* Visuals Section */}
                <div className="flex-shrink-0 space-y-8">
                    <div className="space-y-3">
                        <label
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            htmlFor="server-icon-upload"
                        >
                            Server Icon
                        </label>
                        <div
                            className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-border-subtle bg-bg-subtle transition-all hover:border-primary"
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
                                    className="h-full w-full object-cover transition-opacity group-hover:opacity-40"
                                    src={iconUrl}
                                />
                            ) : (
                                <Text className="text-2xl font-bold">
                                    {server.name.charAt(0).toUpperCase()}
                                </Text>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Upload className="mb-1 h-6 w-6 text-white" />
                                <Text
                                    size="2xs"
                                    transform="uppercase"
                                    variant="inverse"
                                    weight="bold"
                                >
                                    Change Icon
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            htmlFor="server-banner-upload"
                        >
                            Server Banner
                        </label>
                        <div
                            className="group relative flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-bg-subtle transition-all hover:border-primary md:w-64"
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
                                    className="h-full w-full object-cover transition-opacity group-hover:opacity-40"
                                    src={
                                        resolveApiUrl(server.banner.value) || ''
                                    }
                                />
                            ) : (
                                <div className="p-4 text-center">
                                    <Text size="xs" variant="muted">
                                        No Banner Set
                                    </Text>
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Upload className="mb-1 h-6 w-6 text-white" />
                                <Text
                                    size="2xs"
                                    transform="uppercase"
                                    variant="inverse"
                                    weight="bold"
                                >
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
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
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

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label
                                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                                htmlFor="serverTags"
                            >
                                Server Tags
                            </label>
                            <Text size="2xs" variant="muted" weight="bold">
                                {tags.length}/8 Tags
                            </Text>
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    className="flex-1"
                                    id="serverTags"
                                    maxLength={25}
                                    placeholder="Add a tag..."
                                    value={tagInput}
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button
                                    className="px-4"
                                    disabled={
                                        !tagInput.trim() || tags.length >= 8
                                    }
                                    size="sm"
                                    variant="primary"
                                    onClick={handleAddTag}
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <div
                                        className="group flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 py-1 pr-1 pl-3 text-xs font-bold text-primary"
                                        key={tag}
                                    >
                                        <Tag className="opacity-60" size={10} />
                                        {tag}
                                        <button
                                            className="rounded-full p-1 opacity-60 transition-all hover:bg-primary/20 hover:opacity-100"
                                            onClick={() => handleRemoveTag(tag)}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {tags.length === 0 && (
                                    <Text
                                        className="py-1 italic"
                                        size="xs"
                                        variant="muted"
                                    >
                                        No tags added yet. Try "Hangout" or
                                        "Gaming".
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            {isOwner && (
                <div className="space-y-6 pt-10">
                    <div className="border-b border-border-subtle pb-4">
                        <Heading
                            className="text-primary"
                            level={2}
                            variant="section"
                        >
                            Verification
                        </Heading>
                    </div>

                    <div className="divide-y divide-border-subtle rounded-lg border border-bg-secondary">
                        <div className="flex items-center justify-between gap-4 p-4">
                            <div className="space-y-1">
                                <Text as="p" weight="bold">
                                    Apply for Server Verification
                                </Text>
                                <Text as="p" size="xs" variant="muted">
                                    Verified servers get a badge to tell
                                    everyone this is the official community
                                    server.
                                </Text>
                            </div>
                            {server.verified ? (
                                <Text
                                    className="flex items-center gap-1.5 px-4 font-semibold text-primary"
                                    size="sm"
                                >
                                    <BadgeCheck size={16} /> Verified
                                </Text>
                            ) : server.verificationRequested ? (
                                <Text
                                    className="px-4 font-semibold"
                                    size="sm"
                                    variant="muted"
                                >
                                    Pending Review
                                </Text>
                            ) : (
                                <Button
                                    className="min-w-[120px]"
                                    loading={isRequestingVerification}
                                    variant="primary"
                                    onClick={() => requestVerification()}
                                >
                                    <BadgeCheck className="mr-2 h-4 w-4" />
                                    Apply
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="border-b border-border-subtle pt-4 pb-4">
                        <Heading
                            className="text-error"
                            level={2}
                            variant="section"
                        >
                            Danger Zone
                        </Heading>
                    </div>

                    <div className="divide-y divide-border-subtle rounded-lg border border-bg-secondary">
                        <div className="flex items-center justify-between gap-4 p-4">
                            <div className="space-y-1">
                                <Text as="p" weight="bold">
                                    Transfer Ownership
                                </Text>
                                <Text as="p" size="xs" variant="muted">
                                    Give this server to another member. This
                                    action cannot be undone.
                                </Text>
                            </div>
                            <Button
                                className="min-w-[120px]"
                                variant="danger"
                                onClick={() => setIsTransferModalOpen(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Transfer
                            </Button>
                        </div>

                        <div className="flex items-center justify-between gap-4 p-4">
                            <div className="space-y-1">
                                <Text as="p" variant="danger" weight="bold">
                                    Delete Server
                                </Text>
                                <Text as="p" size="xs" variant="muted">
                                    Permanently delete this server and all its
                                    data. This action is IRREVERSIBLE.
                                </Text>
                            </div>
                            <Button
                                className="min-w-[120px]"
                                variant="danger"
                                onClick={() => setIsDeleteModalOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
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
                    setTags(originalTags);
                    setTagInput('');
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
                    <div className="border-status-error bg-status-error-bg text-status-error rounded-md border p-4 text-sm">
                        Are you sure you want to delete{' '}
                        <strong>{server.name}</strong>? This action cannot be
                        undone. All messages, channels, and roles will be
                        permanently removed.
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-muted-foreground uppercase"
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

                    <div className="-mx-6 -mb-6 flex justify-end gap-3 bg-bg-secondary p-6 pt-4">
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
                    <Text size="sm" variant="muted">
                        Transferring ownership will make another member the
                        owner of this server. You will no longer have full
                        control over the server.
                    </Text>

                    <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto">
                        {members
                            ?.filter((m) => m.userId !== me?._id)
                            .map((member) => (
                                <div
                                    className="group flex items-center justify-between rounded-md p-2 transition-colors hover:bg-bg-subtle"
                                    key={member.userId}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 overflow-hidden rounded-full bg-bg-secondary">
                                            {member.user.profilePicture ? (
                                                <img
                                                    alt={member.user.username}
                                                    className="h-full w-full object-cover"
                                                    src={
                                                        resolveApiUrl(
                                                            member.user
                                                                .profilePicture,
                                                        ) || ''
                                                    }
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-bold">
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
                                            <Text size="xs" variant="muted">
                                                @{member.user.username}
                                            </Text>
                                        </div>
                                    </div>
                                    <Button
                                        className="opacity-0 transition-opacity group-hover:opacity-100"
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

                    <div className="-mx-6 -mb-6 flex justify-end p-6 pt-4">
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
