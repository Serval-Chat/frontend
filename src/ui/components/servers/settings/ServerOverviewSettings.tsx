import React, { useReducer, useRef, useState } from 'react';

import {
    useServerDetails,
    useUpdateServer,
    useUpdateServerBanner,
    useUpdateServerIcon,
} from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { resolveApiUrl } from '@/utils/apiUrl';
import { mergeReducer } from '@/utils/mergeReducer';

import { ServerDangerZone } from './ServerDangerZone';
import { ServerInfoSection } from './ServerInfoSection';
import { ServerVisualsSection } from './ServerVisualsSection';

interface ServerOverviewSettingsProps {
    serverId: string;
}

interface ServerFormState {
    name: string;
    originalName: string;
    description: string;
    originalDescription: string;
    discoveryEnabled: boolean;
    originalDiscoveryEnabled: boolean;
    tags: string[];
    originalTags: string[];
    tagInput: string;
}

export const ServerOverviewSettings = ({
    serverId,
}: ServerOverviewSettingsProps) => {
    const { data: server, isLoading } = useServerDetails(serverId);
    const { data: me } = useMe();
    const { mutate: updateServer, isPending: isUpdatingServer } =
        useUpdateServer(serverId);
    const { mutate: updateIcon, isPending: isUpdatingIcon } =
        useUpdateServerIcon(serverId);
    const { mutate: updateBanner, isPending: isUpdatingBanner } =
        useUpdateServerBanner(serverId);

    const iconInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [form, patch] = useReducer(mergeReducer<ServerFormState>, {
        name: server?.name || '',
        originalName: server?.name || '',
        description: server?.description || '',
        originalDescription: server?.description || '',
        discoveryEnabled: server?.discoveryEnabled || false,
        originalDiscoveryEnabled: server?.discoveryEnabled || false,
        tags: server?.tags || [],
        originalTags: server?.tags || [],
        tagInput: '',
    });
    const {
        name,
        originalName,
        description,
        originalDescription,
        discoveryEnabled,
        originalDiscoveryEnabled,
        tags,
        originalTags,
        tagInput,
    } = form;

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<
        'avatar' | 'banner' | 'server-banner'
    >('avatar');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const [syncedServer, setSyncedServer] = useState(server);

    if (server !== syncedServer) {
        setSyncedServer(server);
        if (server) {
            patch({
                name: server.name,
                originalName: server.name,
                description: server.description || '',
                originalDescription: server.description || '',
                discoveryEnabled: server.discoveryEnabled || false,
                originalDiscoveryEnabled: server.discoveryEnabled || false,
                tags: server.tags || [],
                originalTags: server.tags || [],
            });
        }
    }

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
                    patch({
                        originalName: name,
                        originalDescription: description,
                        originalDiscoveryEnabled: discoveryEnabled,
                        originalTags: tags,
                    });
                },
            },
        );
    };

    const handleAddTag = (): void => {
        const trimmed = tagInput.trim();
        if (!trimmed || tags.includes(trimmed) || tags.length >= 8) return;
        patch({ tags: [...tags, trimmed], tagInput: '' });
    };

    const handleRemoveTag = (tagToRemove: string): void => {
        patch({ tags: tags.filter((t): boolean => t !== tagToRemove) });
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

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!server) return null;

    const isOwner = !!me && server.ownerId.toString() === me.id.toString();
    const iconUrl = resolveApiUrl(server.icon);

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <input
                accept="image/*"
                aria-label="Upload server icon"
                className="hidden"
                id="server-icon-upload"
                ref={iconInputRef}
                type="file"
                onChange={handleIconChange}
            />
            <input
                accept="image/*"
                aria-label="Upload server banner"
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
                <ServerVisualsSection
                    iconUrl={iconUrl}
                    server={server}
                    onBannerClick={(): void | undefined =>
                        bannerInputRef.current?.click()
                    }
                    onIconClick={(): void | undefined =>
                        iconInputRef.current?.click()
                    }
                />

                <ServerInfoSection
                    description={description}
                    discoveryEnabled={discoveryEnabled}
                    name={name}
                    serverId={serverId}
                    tagInput={tagInput}
                    tags={tags}
                    onAddTag={handleAddTag}
                    onChangeDescription={(value): void => {
                        patch({ description: value });
                    }}
                    onChangeName={(value): void => {
                        patch({ name: value });
                    }}
                    onChangeTagInput={(value): void => {
                        patch({ tagInput: value });
                    }}
                    onRemoveTag={handleRemoveTag}
                    onToggleDiscovery={(value): void => {
                        patch({ discoveryEnabled: value });
                    }}
                />
            </div>

            {isOwner ? (
                <ServerDangerZone server={server} serverId={serverId} />
            ) : null}

            <SettingsFloatingBar
                isPending={isPending}
                isVisible={hasChanges}
                onReset={(): void => {
                    patch({
                        name: originalName,
                        description: originalDescription,
                        discoveryEnabled: originalDiscoveryEnabled,
                        tags: originalTags,
                        tagInput: '',
                    });
                }}
                onSave={handleSave}
            />

            <ImageCropModal
                imageFile={cropFile}
                isOpen={isCropModalOpen}
                type={cropType}
                onClose={(): void => {
                    setIsCropModalOpen(false);
                }}
                onConfirm={handleCropConfirm}
            />
        </div>
    );
};
