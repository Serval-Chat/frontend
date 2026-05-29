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
    useServerDiscoveryStatus,
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
import { TextArea } from '@/ui/components/common/TextArea';
import { Toggle } from '@/ui/components/common/Toggle';
import { ServerBannerMedia } from '@/ui/components/servers/ServerBannerMedia';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { resolveApiUrl } from '@/utils/apiUrl';

interface ServerOverviewSettingsProps {
    serverId: string;
}

const DESCRIPTION_BLOCKER = 'Server must have a description.';
const TAGS_BLOCKER = 'Server must have at least one tag.';
const OPT_IN_BLOCKER = 'Server must opt in to discovery.';

export const ServerOverviewSettings = ({
    serverId,
}: ServerOverviewSettingsProps) => {
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
    const [description, setDescription] = useState(server?.description || '');
    const [originalDescription, setOriginalDescription] = useState(
        server?.description || '',
    );
    const [discoveryEnabled, setDiscoveryEnabled] = useState(
        server?.discoveryEnabled || false,
    );
    const [originalDiscoveryEnabled, setOriginalDiscoveryEnabled] = useState(
        server?.discoveryEnabled || false,
    );
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

    React.useEffect((): void => {
        if (server) {
            setName(server.name);
            setOriginalName(server.name);
            setDescription(server.description || '');
            setOriginalDescription(server.description || '');
            setDiscoveryEnabled(server.discoveryEnabled || false);
            setOriginalDiscoveryEnabled(server.discoveryEnabled || false);
            setTags(server.tags || []);
            setOriginalTags(server.tags || []);
        }
    }, [server]);

    const hasChanges =
        name !== originalName ||
        description !== originalDescription ||
        discoveryEnabled !== originalDiscoveryEnabled ||
        JSON.stringify(tags) !== JSON.stringify(originalTags);
    const isPending = isUpdatingServer || isUpdatingIcon || isUpdatingBanner;

    const handleSave = (): void => {
        if (!hasChanges) return;
        updateServer(
            { name, description, discoveryEnabled, tags },
            {
                onSuccess: (): void => {
                    setOriginalName(name);
                    setOriginalDescription(description);
                    setOriginalDiscoveryEnabled(discoveryEnabled);
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
        setTags(tags.filter((t): boolean => t !== tagToRemove));
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
    const { data: discoveryStatus } = useServerDiscoveryStatus(serverId);
    const effectiveDiscoveryBlockers = React.useMemo((): string[] => {
        if (!discoveryStatus) return [];

        const blockers = discoveryStatus.blockers.filter((blocker): boolean => {
            if (blocker === DESCRIPTION_BLOCKER) {
                return description.trim() === '';
            }
            if (blocker === TAGS_BLOCKER) {
                return tags.length === 0;
            }
            if (blocker === OPT_IN_BLOCKER) {
                return !discoveryEnabled;
            }
            return true;
        });

        if (
            discoveryEnabled &&
            description.trim() === '' &&
            !blockers.includes(DESCRIPTION_BLOCKER)
        ) {
            blockers.push(DESCRIPTION_BLOCKER);
        }

        if (
            discoveryEnabled &&
            tags.length === 0 &&
            !blockers.includes(TAGS_BLOCKER)
        ) {
            blockers.push(TAGS_BLOCKER);
        }

        return blockers;
    }, [description, discoveryEnabled, discoveryStatus, tags]);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState('');

    const isOwner =
        !!server && !!me && server.ownerId.toString() === me._id.toString();

    const handleDeleteServer = (): void => {
        if (!server || confirmDeleteName !== server.name) return;
        deleteServer(serverId, {
            onSuccess: (): void => {
                void navigate('/chat/@me');
            },
        });
    };

    const handleTransferOwnership = (newOwnerId: string): void => {
        transferOwnership(newOwnerId, {
            onSuccess: (): void => {
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
                            onClick={(): void | undefined =>
                                iconInputRef.current?.click()
                            }
                            onKeyDown={(e): void => {
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
                            onClick={(): void | undefined =>
                                bannerInputRef.current?.click()
                            }
                            onKeyDown={(e): void => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    bannerInputRef.current?.click();
                                }
                            }}
                        >
                            {server.banner?.value ? (
                                <ServerBannerMedia
                                    alt="Banner"
                                    banner={server.banner}
                                    className="transition-opacity group-hover:opacity-40"
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
                            onChange={(e): void => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label
                                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                                htmlFor="serverDescription"
                            >
                                Server Description
                            </label>
                            <Text size="2xs" variant="muted" weight="bold">
                                {description.length}/500
                            </Text>
                        </div>
                        <TextArea
                            autoResize
                            id="serverDescription"
                            maxLength={500}
                            placeholder="Tell people what your server is about..."
                            value={description}
                            onChange={(e): void =>
                                setDescription(e.target.value.slice(0, 500))
                            }
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
                                    onChange={(e): void =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={(e): void => {
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
                                            onClick={(): void =>
                                                handleRemoveTag(tag)
                                            }
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

                    <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <Text as="p" weight="bold">
                                    Show in Server Discovery
                                </Text>
                                <Text as="p" size="xs" variant="muted">
                                    Discovery requires a description, at least
                                    one tag, verification, and a vanity invite
                                    with unlimited uses and no expiry.
                                </Text>
                            </div>
                            <Toggle
                                aria-label="Show in Server Discovery"
                                checked={discoveryEnabled}
                                onCheckedChange={setDiscoveryEnabled}
                            />
                        </div>
                        {discoveryEnabled &&
                            effectiveDiscoveryBlockers.length > 0 && (
                                <div className="rounded-md border border-caution/30 bg-caution/10 p-3">
                                    <Text
                                        className="mb-2 text-caution"
                                        size="xs"
                                        weight="bold"
                                    >
                                        Discovery blockers
                                    </Text>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        {effectiveDiscoveryBlockers.map(
                                            (blocker) => (
                                                <li key={blocker}>{blocker}</li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}
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
                                    onClick={(): void => requestVerification()}
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
                                onClick={(): void =>
                                    setIsTransferModalOpen(true)
                                }
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
                                onClick={(): void => setIsDeleteModalOpen(true)}
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
                onReset={(): void => {
                    setName(originalName);
                    setDescription(originalDescription);
                    setDiscoveryEnabled(originalDiscoveryEnabled);
                    setTags(originalTags);
                    setTagInput('');
                }}
                onSave={handleSave}
            />

            <ImageCropModal
                imageFile={cropFile}
                isOpen={isCropModalOpen}
                type={cropType}
                onClose={(): void => setIsCropModalOpen(false)}
                onConfirm={handleCropConfirm}
            />

            {/* Delete Server Modal */}
            <Modal
                className="max-w-md"
                isOpen={isDeleteModalOpen}
                title={`Delete '${server.name}'`}
                onClose={(): void => {
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
                            onChange={(e): void =>
                                setConfirmDeleteName(e.target.value)
                            }
                        />
                    </div>

                    <div className="-mx-6 -mb-6 flex justify-end gap-3 bg-bg-secondary p-6 pt-4">
                        <Button
                            className="min-w-[96px]"
                            variant="ghost"
                            onClick={(): void => setIsDeleteModalOpen(false)}
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
                onClose={(): void => setIsTransferModalOpen(false)}
            >
                <div className="space-y-6">
                    <Text size="sm" variant="muted">
                        Transferring ownership will make another member the
                        owner of this server. You will no longer have full
                        control over the server.
                    </Text>

                    <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto">
                        {members
                            ?.filter((m): boolean => m.userId !== me?._id)
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
                                        onClick={(): void =>
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
                            onClick={(): void => setIsTransferModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
