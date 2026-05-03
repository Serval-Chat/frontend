import React, { useMemo, useRef, useState } from 'react';

import {
    ArrowLeft,
    Check,
    CheckCircle,
    Copy,
    RefreshCw,
    Trash2,
} from 'lucide-react';

import type { User } from '@/api/users/users.types';
import {
    useBot,
    useBotServers,
    useDeleteBot,
    useResetBotSecret,
    useResetBotToken,
    useUpdateBot,
    useUpdateBotPermissions,
    useUploadBotBanner,
    useUploadBotPicture,
} from '@/hooks/developer/useBots';
import type { BotPermissions } from '@/types/bot';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { permissionsToBitmask } from '@/utils/botPermissions';

interface DevBotDetailProps {
    clientId: string;
    onBack: () => void;
}

const PERMISSION_LABELS: Record<keyof BotPermissions, string> = {
    readMessages: 'Read Messages',
    sendMessages: 'Send Messages',
    manageMessages: 'Manage Messages',
    readUsers: 'Read Users',
    joinServers: 'Join Servers',
    manageServer: 'Manage Server',
    manageChannels: 'Manage Channels',
    manageMembers: 'Manage Members',
    readReactions: 'Read Reactions',
    addReactions: 'Add Reactions',
};

const PermissionRow = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
}): React.ReactNode => (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg-subtle">
        <input
            checked={value}
            className="h-4 w-4 accent-primary"
            type="checkbox"
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm text-foreground">{label}</span>
    </label>
);

const Section = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}): React.ReactNode => (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
        <p className="mb-4 font-semibold text-foreground">{title}</p>
        {children}
    </div>
);

const CopyButton = ({
    text,
    value,
}: {
    text: string;
    value: string;
}): React.ReactNode => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (): void => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            icon={copied ? Check : Copy}
            size="sm"
            variant="normal"
            onClick={handleCopy}
        >
            <span className="hidden sm:inline">
                {copied ? 'Copied!' : text}
            </span>
        </Button>
    );
};

export const DevBotDetail = ({
    clientId,
    onBack,
}: DevBotDetailProps): React.ReactNode => {
    const { data: bot, isLoading } = useBot(clientId);
    const { data: servers } = useBotServers(clientId);

    const updateBot = useUpdateBot();
    const uploadPicture = useUploadBotPicture();
    const uploadBanner = useUploadBotBanner();
    const resetSecret = useResetBotSecret();
    const resetToken = useResetBotToken();
    const deleteBot = useDeleteBot();

    const user = useMemo(
        () =>
            bot
                ? typeof bot.userId === 'object'
                    ? bot.userId
                    : bot.user
                : undefined,
        [bot],
    );
    const profilePreviewUser = useMemo(
        () =>
            user
                ? ({
                      ...user,
                      createdAt: user.createdAt
                          ? new Date(user.createdAt)
                          : undefined,
                  } as Partial<User>)
                : undefined,
        [user],
    );

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<BotPermissions | null>(null);
    const [bannerColor, setBannerColor] = useState('');

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');

    const [secret, setSecret] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [tokenReset, setTokenReset] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    React.useEffect(() => {
        if (bot && user) {
            setDescription(user.bio ?? '');
            setPermissions(bot.botPermissions);
            setBannerColor(user.bannerColor ?? '');
        }
    }, [bot, user]);

    const hasDescriptionChanged =
        description.trim() !== (user?.bio ?? '').trim();
    const hasBannerColorChanged =
        bannerColor.trim() !== (user?.bannerColor ?? '').trim();
    const hasPermissionsChanged =
        bot &&
        permissions &&
        JSON.stringify(permissions) !== JSON.stringify(bot.botPermissions);
    const hasChanges =
        hasDescriptionChanged || hasPermissionsChanged || hasBannerColorChanged;

    const updatePermissions = useUpdateBotPermissions();

    const handleSaveProfile = (): void => {
        if (hasDescriptionChanged || hasBannerColorChanged) {
            updateBot.mutate({ clientId, patch: { description, bannerColor } });
        }
        if (hasPermissionsChanged && permissions) {
            updatePermissions.mutate({ clientId, permissions });
        }
    };

    const handleResetSecret = (): void => {
        resetSecret.mutate(
            { clientId },
            {
                onSuccess: (data) => {
                    setSecret(data.clientSecret);
                    setTokenReset(false);
                },
            },
        );
    };

    const handleResetToken = (): void => {
        resetToken.mutate(
            { clientId },
            {
                onSuccess: (data) => {
                    setToken(data.token);
                    setTokenReset(true);
                    setSecret(null);
                },
            },
        );
    };

    const handleDelete = (): void => {
        deleteBot.mutate({ clientId }, { onSuccess: () => onBack() });
    };

    const handleCropConfirm = (file: File): void => {
        if (cropType === 'avatar') {
            uploadPicture.mutate({ clientId, file });
        } else {
            uploadBanner.mutate({ clientId, file });
        }
        setCropFile(null);
    };

    if (isLoading || !bot || !user || !permissions) {
        return (
            <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        className="h-36 animate-pulse rounded-xl bg-bg-secondary"
                        key={`skeleton-${i}`}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-start gap-12 pb-12">
            <div className="flex max-w-2xl flex-1 flex-col gap-5">
                <button
                    className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    type="button"
                    onClick={onBack}
                >
                    <ArrowLeft size={14} />
                    Back to bots
                </button>

                <Section title="About Bot">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-sm font-medium text-foreground"
                                htmlFor="bot-desc"
                            >
                                Description
                            </label>
                            <Input
                                id="bot-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label
                                className="text-sm font-medium text-foreground"
                                htmlFor="bot-banner-color"
                            >
                                Banner Color (Hex)
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="w-32"
                                    id="bot-banner-color"
                                    placeholder="#5865F2"
                                    value={bannerColor}
                                    onChange={(e) =>
                                        setBannerColor(e.target.value)
                                    }
                                />
                                {bannerColor && (
                                    <div
                                        className="h-8 w-8 rounded-md border border-border-subtle"
                                        style={{ backgroundColor: bannerColor }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            {servers && (
                                <div className="flex items-center gap-2">
                                    <Text as="p" size="sm" variant="muted">
                                        Servers:
                                    </Text>
                                    <Text
                                        className="font-bold text-foreground"
                                        size="sm"
                                    >
                                        {servers.count}
                                    </Text>
                                </div>
                            )}
                            {hasChanges && (
                                <Button
                                    className="self-end"
                                    loading={
                                        updateBot.isPending ||
                                        updatePermissions.isPending
                                    }
                                    variant="primary"
                                    onClick={handleSaveProfile}
                                >
                                    Save Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </Section>

                <Section title="Credentials">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <Text as="p" size="sm" variant="muted">
                                Client ID
                            </Text>
                            <div className="flex gap-2">
                                <code className="flex-1 rounded-md bg-bg-subtle px-3 py-2 font-mono text-sm text-foreground">
                                    {clientId}
                                </code>
                                <CopyButton text="Copy" value={clientId} />
                            </div>
                        </div>
                        {secret && (
                            <div className="flex flex-col gap-1">
                                <Text as="p" size="sm" variant="muted">
                                    Client Secret - copy now, it won&apos;t be
                                    shown again
                                </Text>
                                <div className="flex gap-2">
                                    <code className="flex-1 rounded-md bg-caution/10 px-3 py-2 font-mono text-sm break-all text-caution">
                                        {secret}
                                    </code>
                                    <CopyButton text="Copy" value={secret} />
                                </div>
                            </div>
                        )}
                        {tokenReset && (
                            <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                                <CheckCircle size={14} />
                                Bot token invalidated. Any active sessions have
                                been revoked.
                            </div>
                        )}
                        {token && (
                            <div className="flex flex-col gap-1">
                                <Text as="p" size="sm" variant="muted">
                                    Bot Token - copy now, it won&apos;t be shown
                                    again
                                </Text>
                                <div className="flex gap-2">
                                    <code className="flex-1 rounded-md bg-bg-subtle px-3 py-2 font-mono text-sm break-all text-foreground">
                                        {token}
                                    </code>
                                    <CopyButton text="Copy" value={token} />
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                icon={RefreshCw}
                                loading={resetSecret.isPending}
                                variant="normal"
                                onClick={handleResetSecret}
                            >
                                Reset Client Secret
                            </Button>
                            <Button
                                icon={RefreshCw}
                                loading={resetToken.isPending}
                                variant="normal"
                                onClick={handleResetToken}
                            >
                                Reset Bot Token
                            </Button>
                        </div>
                    </div>
                </Section>

                <Section title="OAuth2">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <Text as="p" size="sm" variant="muted">
                                Invite Link
                            </Text>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    className="flex-1 font-mono text-sm"
                                    value={`${window.location.origin}/authorize?client_id=${clientId}${permissions ? `&permissions=${permissionsToBitmask(permissions)}` : ''}`}
                                    onClick={(e) => {
                                        (e.target as HTMLInputElement).select();
                                    }}
                                />
                                <CopyButton
                                    text="Copy"
                                    value={`${window.location.origin}/authorize?client_id=${clientId}${permissions ? `&permissions=${permissionsToBitmask(permissions)}` : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Permissions">
                    <div className="grid grid-cols-2 gap-1">
                        {(
                            Object.keys(
                                PERMISSION_LABELS,
                            ) as (keyof BotPermissions)[]
                        ).map((key) => (
                            <PermissionRow
                                key={key}
                                label={PERMISSION_LABELS[key]}
                                value={permissions[key]}
                                onChange={(v) =>
                                    setPermissions(
                                        (prev) => prev && { ...prev, [key]: v },
                                    )
                                }
                            />
                        ))}
                    </div>
                </Section>

                <Section title="Danger Zone">
                    <Button
                        icon={Trash2}
                        variant="danger"
                        onClick={() => setShowDelete(true)}
                    >
                        Delete Bot
                    </Button>
                </Section>
            </div>

            <div className="sticky top-6 hidden shrink-0 lg:block">
                <Text
                    as="p"
                    className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
                >
                    Profile Preview
                </Text>
                <UserProfileCard
                    user={
                        {
                            ...profilePreviewUser,
                            bio: description,
                            bannerColor: bannerColor || undefined,
                        } as Partial<User>
                    }
                    onAvatarClick={() => avatarInputRef.current?.click()}
                    onBannerClick={() => bannerInputRef.current?.click()}
                />
                <input
                    hidden
                    accept="image/*"
                    ref={avatarInputRef}
                    type="file"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setCropType('avatar');
                            setCropFile(file);
                        }
                        e.target.value = '';
                    }}
                />
                <input
                    hidden
                    accept="image/*"
                    ref={bannerInputRef}
                    type="file"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setCropType('banner');
                            setCropFile(file);
                        }
                        e.target.value = '';
                    }}
                />
            </div>

            <ImageCropModal
                imageFile={cropFile}
                isOpen={!!cropFile}
                type={cropType}
                onClose={() => setCropFile(null)}
                onConfirm={handleCropConfirm}
            />

            {showDelete && (
                <Modal
                    isOpen={showDelete}
                    title="Delete Bot"
                    onClose={() => setShowDelete(false)}
                >
                    <div className="flex flex-col gap-4 p-4">
                        <Text as="p" variant="muted">
                            Are you sure? This cannot be undone. The bot will be
                            removed from all servers.
                        </Text>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDelete(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                loading={deleteBot.isPending}
                                variant="danger"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
