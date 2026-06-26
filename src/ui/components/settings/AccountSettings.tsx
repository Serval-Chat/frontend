import React, { useMemo, useRef, useState } from 'react';

import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import QRCode from 'qrcode';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';

import { authApi } from '@/api/auth/auth.api';
import { useFriends } from '@/api/friends/friends.queries';
import {
    useMe,
    useUpdateAppearance,
    useUpdateBanner,
    useUpdateBio,
    useUpdateDisplayName,
    useUpdateProfilePicture,
    useUpdatePronouns,
    useUpdateUsername,
} from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { ChipNode } from '@/ui/components/chat/lexical/ChipNode';
import { LexicalAutocompletePlugin } from '@/ui/components/chat/lexical/LexicalAutocompletePlugin';
import { LexicalInitPlugin } from '@/ui/components/chat/lexical/LexicalInitPlugin';
import { $getRawMessageText } from '@/ui/components/chat/lexical/lexicalUtils';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';

import { ChangeLoginModal } from './ChangeLoginModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ImageCropModal } from './ImageCropModal';
import { WebsiteConnectionsSettings } from './WebsiteConnectionsSettings';

const bioContentEditable = (
    <ContentEditable className="custom-scrollbar h-full max-h-[300px] min-h-[100px] w-full resize-none overflow-y-auto px-3 py-2 text-sm text-foreground outline-none" />
);

export const AccountSettings = () => {
    const { data: user } = useMe();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const { mutate: updateBio, isPending: isUpdatingBio } = useUpdateBio();
    const { mutate: updatePronouns, isPending: isUpdatingPronouns } =
        useUpdatePronouns();
    const { mutate: updateDisplayName, isPending: isUpdatingDisplayName } =
        useUpdateDisplayName();
    const { mutate: updateUsername, isPending: isUpdatingUsername } =
        useUpdateUsername();
    const { mutate: updateProfilePicture, isPending: isUpdatingAvatar } =
        useUpdateProfilePicture();
    const { mutate: updateBanner, isPending: isUpdatingBanner } =
        useUpdateBanner();
    const { mutate: updateAppearance, isPending: isUpdatingAppearance } =
        useUpdateAppearance();

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const isAutocompleteOpenRef = useRef<boolean>(false);

    const [activeColorPicker, setActiveColorPicker] = useState<
        'primary' | 'accent' | null
    >(null);
    const [hexDraft, setHexDraft] = useState('');
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const colorPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
    const colorPickerCoords = useSmartPosition({
        isOpen: !!activeColorPicker,
        elementRef: colorPickerRef,
        triggerRef: colorPickerTriggerRef,
        padding: 16,
        offset: 12,
    });

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false);
    const [isTwoFactorConfirmLoading, setIsTwoFactorConfirmLoading] =
        useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [twoFactorSetupUri, setTwoFactorSetupUri] = useState('');
    const [twoFactorQrDataUrl, setTwoFactorQrDataUrl] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorBackupCode, setTwoFactorBackupCode] = useState('');
    const [showDisableBackupInput, setShowDisableBackupInput] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const { data: friendsList = [] } = useFriends();
    const { customCategories } = useCustomEmojis({ enabled: true });

    const friendUsers = useMemo(
        (): User[] => friendsList as unknown as User[],
        [friendsList],
    );

    const allServerEmojis = useMemo(
        () =>
            customCategories.flatMap((cat) =>
                cat.emojis.map((e) => ({
                    id: e.id,
                    name: e.name,
                    imageUrl: e.url,
                    serverId: cat.id,
                    createdBy: '',
                    createdAt: '',
                })),
            ),
        [customCategories],
    );

    const isPending =
        isUpdatingBio ||
        isUpdatingPronouns ||
        isUpdatingDisplayName ||
        isUpdatingUsername ||
        isUpdatingAvatar ||
        isUpdatingBanner ||
        isUpdatingAppearance;

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [originalDisplayName, setOriginalDisplayName] = useState(
        user?.displayName || '',
    );

    const [username, setUsername] = useState(user?.username || '');
    const [originalUsername, setOriginalUsername] = useState(
        user?.username || '',
    );

    const [pronouns, setPronouns] = useState(user?.pronouns || '');
    const [originalPronouns, setOriginalPronouns] = useState(
        user?.pronouns || '',
    );

    const [bio, setBio] = useState(user?.bio || '');
    const [originalBio, setOriginalBio] = useState(user?.bio || '');

    const [profilePrimaryColor, setProfilePrimaryColor] = useState<
        string | null
    >(user?.profilePrimaryColor ?? null);
    const [originalProfilePrimaryColor, setOriginalProfilePrimaryColor] =
        useState<string | null>(user?.profilePrimaryColor ?? null);
    const [profileAccentColor, setProfileAccentColor] = useState<string | null>(
        user?.profileAccentColor ?? null,
    );
    const [originalProfileAccentColor, setOriginalProfileAccentColor] =
        useState<string | null>(user?.profileAccentColor ?? null);

    const accentWithoutPrimary =
        profileAccentColor !== null && profilePrimaryColor === null;

    const handleSave = (): void => {
        if (accentWithoutPrimary) {
            showToast(
                'Accent color requires a primary color to be set',
                'error',
            );
            return;
        }
        if (displayName !== originalDisplayName) {
            updateDisplayName(displayName, {
                onSuccess: (): void => setOriginalDisplayName(displayName),
            });
        }
        if (pronouns !== originalPronouns) {
            updatePronouns(pronouns, {
                onSuccess: (): void => setOriginalPronouns(pronouns),
            });
        }
        if (bio !== originalBio) {
            updateBio(bio, {
                onSuccess: (): void => setOriginalBio(bio),
            });
        }
        if (username !== originalUsername) {
            updateUsername(username, {
                onSuccess: (): void => setOriginalUsername(username),
            });
        }
        const appearanceUpdate: {
            profilePrimaryColor?: string | null;
            profileAccentColor?: string | null;
        } = {};
        if (profilePrimaryColor !== originalProfilePrimaryColor)
            appearanceUpdate.profilePrimaryColor = profilePrimaryColor;
        if (profileAccentColor !== originalProfileAccentColor)
            appearanceUpdate.profileAccentColor = profileAccentColor;
        if (Object.keys(appearanceUpdate).length > 0) {
            updateAppearance(appearanceUpdate, {
                onSuccess: (): void => {
                    setOriginalProfilePrimaryColor(profilePrimaryColor);
                    setOriginalProfileAccentColor(profileAccentColor);
                },
            });
        }
    };

    const handleAvatarChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = e.target.files?.[0];
        if (file) {
            setCropFile(file);
            setCropType('avatar');
            setIsCropModalOpen(true);
            // Reset input so the same file can be selected again
            e.target.value = '';
        }
    };

    const handleBannerChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = e.target.files?.[0];
        if (file) {
            setCropFile(file);
            setCropType('banner');
            setIsCropModalOpen(true);
            // Reset input so the same file can be selected again
            e.target.value = '';
        }
    };

    const handleCropConfirm = (processedFile: File): void => {
        if (cropType === 'avatar') {
            updateProfilePicture(processedFile);
        } else {
            updateBanner(processedFile);
        }
    };

    const hasChanges =
        displayName !== originalDisplayName ||
        username !== originalUsername ||
        pronouns !== originalPronouns ||
        bio !== originalBio ||
        profilePrimaryColor !== originalProfilePrimaryColor ||
        profileAccentColor !== originalProfileAccentColor;

    const handleStartTwoFactorSetup = async (): Promise<void> => {
        setIsTwoFactorLoading(true);
        try {
            const data = await authApi.setupTwoFactor();
            setTwoFactorSetupUri(data.otpauthUri);
            const dataUrl = await QRCode.toDataURL(data.otpauthUri, {
                width: 220,
                margin: 1,
            });
            setTwoFactorQrDataUrl(dataUrl);
            setTwoFactorCode('');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to start 2FA setup';
            showToast(message, 'error');
        } finally {
            setIsTwoFactorLoading(false);
        }
    };

    const handleConfirmTwoFactorSetup = async (): Promise<void> => {
        if (!twoFactorCode.trim()) {
            showToast(
                'Enter the 6-digit code from your authenticator app.',
                'error',
            );
            return;
        }
        setIsTwoFactorConfirmLoading(true);
        try {
            const data = await authApi.confirmTwoFactorSetup({
                code: twoFactorCode.trim(),
            });
            setBackupCodes(data.backupCodes);
            setIsBackupModalOpen(true);
            setTwoFactorSetupUri('');
            setTwoFactorQrDataUrl('');
            setTwoFactorCode('');
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            showToast('Two-factor authentication enabled.', 'success');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Invalid authentication code';
            showToast(message, 'error');
        } finally {
            setIsTwoFactorConfirmLoading(false);
        }
    };

    const handleRegenerateBackupCodes = async (): Promise<void> => {
        if (!twoFactorCode.trim()) {
            showToast(
                'Enter a valid authenticator code to regenerate backup codes.',
                'error',
            );
            return;
        }
        setIsTwoFactorConfirmLoading(true);
        try {
            const data = await authApi.regenerateBackupCodes({
                code: twoFactorCode.trim(),
            });
            setBackupCodes(data.backupCodes);
            setIsBackupModalOpen(true);
            setTwoFactorCode('');
            showToast('Backup codes regenerated.', 'success');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to regenerate backup codes';
            showToast(message, 'error');
        } finally {
            setIsTwoFactorConfirmLoading(false);
        }
    };

    const handleDisableTwoFactor = async (): Promise<void> => {
        const payload = showDisableBackupInput
            ? { backupCode: twoFactorBackupCode.trim() }
            : { code: twoFactorCode.trim() };
        if (
            (!showDisableBackupInput && !twoFactorCode.trim()) ||
            (showDisableBackupInput && !twoFactorBackupCode.trim())
        ) {
            showToast(
                'Provide a valid authentication code to disable 2FA.',
                'error',
            );
            return;
        }
        setIsTwoFactorConfirmLoading(true);
        try {
            await authApi.disableTwoFactor(payload);
            setTwoFactorCode('');
            setTwoFactorBackupCode('');
            setShowDisableBackupInput(false);
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            showToast('Two-factor authentication disabled.', 'success');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to disable two-factor authentication';
            showToast(message, 'error');
        } finally {
            setIsTwoFactorConfirmLoading(false);
        }
    };

    if (!user) return null;

    const previewUser = {
        ...user,
        displayName: displayName || user.displayName,
        username: username || user.username,
        pronouns: pronouns || user.pronouns,
        bio: bio || user.bio,
        profilePrimaryColor: profilePrimaryColor ?? undefined,
        profileAccentColor: profileAccentColor ?? undefined,
    };

    return (
        <div className="max-w-3xl">
            {/* Hidden file inputs */}
            <input
                accept="image/webp,image/gif,image/png,image/jpeg"
                aria-label="Upload avatar"
                className="hidden"
                ref={avatarInputRef}
                type="file"
                onChange={handleAvatarChange}
            />
            <input
                accept="image/webp,image/gif,image/png,image/jpeg"
                aria-label="Upload banner"
                className="hidden"
                ref={bannerInputRef}
                type="file"
                onChange={handleBannerChange}
            />

            <Heading className="mb-6" level={3}>
                My Account
            </Heading>

            <div className="flex flex-col gap-8 md:flex-row">
                {/* Preview Section */}
                <div className="flex-shrink-0">
                    <Heading
                        className="mb-3 text-sm font-bold text-muted-foreground uppercase"
                        level={4}
                    >
                        Preview
                    </Heading>
                    <UserProfileCard
                        presenceStatus="online"
                        user={previewUser}
                        onAvatarClick={(): void | undefined =>
                            avatarInputRef.current?.click()
                        }
                        onBannerClick={(): void | undefined =>
                            bannerInputRef.current?.click()
                        }
                    />
                </div>

                {/* Form Section */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-muted-foreground uppercase"
                            htmlFor="displayName"
                        >
                            Display Name
                        </label>
                        <Input
                            id="displayName"
                            placeholder="Display Name"
                            type="text"
                            value={displayName}
                            onChange={(e): void =>
                                setDisplayName(e.target.value)
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-muted-foreground uppercase"
                            htmlFor="username"
                        >
                            Username
                        </label>
                        <Input
                            id="username"
                            placeholder="Username"
                            type="text"
                            value={username}
                            onChange={(e): void => setUsername(e.target.value)}
                        />
                        <Text as="p" size="xs" variant="muted">
                            Changing your username might require a fresh login.
                        </Text>
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-muted-foreground uppercase"
                            htmlFor="pronouns"
                        >
                            Pronouns
                        </label>
                        <Input
                            id="pronouns"
                            placeholder="He/Him, They/Them, etc."
                            type="text"
                            value={pronouns}
                            onChange={(e): void => setPronouns(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-muted-foreground uppercase"
                            htmlFor="bio"
                        >
                            About Me
                        </label>
                        <div className="relative flex min-h-[100px] items-start rounded-md border border-border-subtle bg-bg-secondary transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:outline-none">
                            <LexicalComposer
                                initialConfig={{
                                    namespace: 'BioEditor',
                                    nodes: [ChipNode],
                                    onError: (error): void =>
                                        console.error(error),
                                    theme: {
                                        paragraph: 'mb-0',
                                        text: {
                                            bold: 'font-bold',
                                            italic: 'italic',
                                            underline: 'underline',
                                            strikethrough: 'line-through',
                                        },
                                    },
                                }}
                            >
                                <LexicalInitPlugin
                                    initialText={user.bio || ''}
                                />
                                <RichTextPlugin
                                    ErrorBoundary={LexicalErrorBoundary}
                                    contentEditable={bioContentEditable}
                                    placeholder={
                                        <div className="pointer-events-none absolute top-[9px] left-3 text-sm text-placeholder select-none">
                                            Tell us about yourself...
                                        </div>
                                    }
                                />
                                <HistoryPlugin />
                                <ClearEditorPlugin />
                                <LexicalAutocompletePlugin
                                    friends={friendUsers}
                                    serverEmojis={allServerEmojis}
                                    onOpenChange={(isOpen): void => {
                                        isAutocompleteOpenRef.current = isOpen;
                                    }}
                                />
                                <OnChangePlugin
                                    onChange={(editorState): void => {
                                        editorState.read((): void => {
                                            const rawText =
                                                $getRawMessageText();
                                            if (rawText.length <= 190) {
                                                setBio(rawText);
                                            }
                                        });
                                    }}
                                />
                            </LexicalComposer>
                        </div>
                        <Text
                            as="p"
                            className="text-right"
                            size="xs"
                            variant="muted"
                        >
                            {bio.length}/190
                        </Text>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-bold text-muted-foreground uppercase">
                            Profile Colors
                        </p>
                        <div className="flex flex-wrap gap-6">
                            {(
                                [
                                    {
                                        key: 'primary' as const,
                                        label: 'Primary',
                                        value: profilePrimaryColor,
                                    },
                                    {
                                        key: 'accent' as const,
                                        label: 'Accent',
                                        value: profileAccentColor,
                                    },
                                ] as const
                            ).map(({ key, label, value }) => (
                                <div
                                    className="flex items-center gap-3"
                                    key={key}
                                >
                                    <div className="group relative">
                                        <button
                                            aria-label={`Pick ${label} color`}
                                            className="h-10 w-10 rounded-full border-2 border-border-subtle shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            ref={
                                                activeColorPicker === key
                                                    ? colorPickerTriggerRef
                                                    : undefined
                                            }
                                            style={{
                                                backgroundColor:
                                                    value ?? undefined,
                                            }}
                                            type="button"
                                            onClick={(e): void => {
                                                colorPickerTriggerRef.current =
                                                    e.currentTarget;
                                                const next =
                                                    activeColorPicker === key
                                                        ? null
                                                        : key;
                                                setActiveColorPicker(next);
                                                if (next !== null)
                                                    setHexDraft(
                                                        value ?? '#313338',
                                                    );
                                            }}
                                        />
                                        {value !== null && (
                                            <button
                                                aria-label={`Clear ${label} color`}
                                                className="absolute -top-1 -right-1 h-4 w-4 min-w-0 rounded-full border-none bg-bg-secondary p-0.5 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                                                type="button"
                                                onClick={(): void => {
                                                    if (key === 'primary') {
                                                        setProfilePrimaryColor(
                                                            null,
                                                        );
                                                        setProfileAccentColor(
                                                            null,
                                                        );
                                                    } else {
                                                        setProfileAccentColor(
                                                            null,
                                                        );
                                                    }
                                                    setActiveColorPicker(null);
                                                }}
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-sm text-foreground">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {activeColorPicker !== null &&
                            createPortal(
                                <div
                                    className="z-top"
                                    ref={colorPickerRef}
                                    style={{
                                        position: 'fixed',
                                        left: colorPickerCoords.x,
                                        top: colorPickerCoords.y,
                                    }}
                                >
                                    <button
                                        aria-label="Close color picker"
                                        className="fixed inset-0"
                                        tabIndex={-1}
                                        type="button"
                                        onClick={(): void =>
                                            setActiveColorPicker(null)
                                        }
                                        onKeyDown={(e): void => {
                                            if (e.key === 'Escape')
                                                setActiveColorPicker(null);
                                        }}
                                    />
                                    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-background shadow-xl">
                                        <HexColorPicker
                                            color={
                                                activeColorPicker === 'primary'
                                                    ? (profilePrimaryColor ??
                                                      '#313338')
                                                    : (profileAccentColor ??
                                                      '#313338')
                                            }
                                            onChange={(c): void => {
                                                if (
                                                    activeColorPicker ===
                                                    'primary'
                                                ) {
                                                    setProfilePrimaryColor(c);
                                                } else {
                                                    setProfileAccentColor(c);
                                                }
                                                setHexDraft(c);
                                            }}
                                        />
                                        <div className="flex items-center gap-2 bg-bg-secondary px-3 py-2">
                                            <span className="font-mono text-xs text-muted-foreground select-none">
                                                #
                                            </span>
                                            <input
                                                aria-label="Hex color value"
                                                className="w-full bg-transparent font-mono text-xs text-foreground outline-none"
                                                maxLength={7}
                                                spellCheck={false}
                                                type="text"
                                                value={hexDraft.replace(
                                                    /^#/,
                                                    '',
                                                )}
                                                onChange={(e): void => {
                                                    const raw =
                                                        e.target.value.replace(
                                                            /[^0-9a-fA-F]/g,
                                                            '',
                                                        );
                                                    setHexDraft(`#${raw}`);
                                                    if (raw.length === 6) {
                                                        const full = `#${raw}`;
                                                        if (
                                                            activeColorPicker ===
                                                            'primary'
                                                        ) {
                                                            setProfilePrimaryColor(
                                                                full,
                                                            );
                                                        } else {
                                                            setProfileAccentColor(
                                                                full,
                                                            );
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>,
                                document.body,
                            )}
                        {accentWithoutPrimary && (
                            <p className="text-xs text-danger">
                                Accent color requires a primary color.
                            </p>
                        )}
                    </div>

                    <WebsiteConnectionsSettings />

                    {/* Password Section */}
                    <div className="border-t border-border-subtle pt-6">
                        <Heading className="mb-4" level={4}>
                            Password & Authentication
                        </Heading>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                                <div className="flex flex-col gap-1">
                                    <Text weight="bold">E-mail</Text>
                                    <Text size="xs" variant="muted">
                                        Change your e-mail address
                                    </Text>
                                </div>
                                <Button
                                    size="sm"
                                    variant="normal"
                                    onClick={(): void =>
                                        setIsLoginModalOpen(true)
                                    }
                                >
                                    Change E-mail
                                </Button>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                                <div className="flex flex-col gap-1">
                                    <Text weight="bold">Password</Text>
                                    <Text size="xs" variant="muted">
                                        Please use a strong password (and I
                                        enforce it)
                                    </Text>
                                </div>
                                <Button
                                    size="sm"
                                    variant="normal"
                                    onClick={(): void =>
                                        setIsPasswordModalOpen(true)
                                    }
                                >
                                    Change Password
                                </Button>
                            </div>
                            <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Text weight="bold">
                                            Two-Factor Authentication
                                        </Text>
                                        <Text size="xs" variant="muted">
                                            {user.totpEnabled
                                                ? '2FA is currently enabled.'
                                                : 'Add an extra security layer to your account.'}
                                        </Text>
                                    </div>
                                    {!user.totpEnabled && (
                                        <Button
                                            loading={isTwoFactorLoading}
                                            size="sm"
                                            variant="normal"
                                            onClick={(): undefined =>
                                                void handleStartTwoFactorSetup()
                                            }
                                        >
                                            Set Up 2FA
                                        </Button>
                                    )}
                                </div>

                                {!user.totpEnabled && twoFactorQrDataUrl && (
                                    <div className="space-y-3 rounded-md border border-border-subtle p-4">
                                        <div className="flex justify-center">
                                            <img
                                                alt="TOTP QR code"
                                                className="h-56 w-56 rounded-md bg-white p-2"
                                                src={twoFactorQrDataUrl}
                                            />
                                        </div>
                                        <Text size="xs" variant="muted">
                                            If scanning fails, copy this URI
                                            into your authenticator app:
                                        </Text>
                                        <Input
                                            readOnly
                                            type="text"
                                            value={twoFactorSetupUri}
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter first 6-digit code"
                                                type="text"
                                                value={twoFactorCode}
                                                onChange={(e): void =>
                                                    setTwoFactorCode(
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                            />
                                            <Button
                                                loading={
                                                    isTwoFactorConfirmLoading
                                                }
                                                variant="normal"
                                                onClick={(): undefined =>
                                                    void handleConfirmTwoFactorSetup()
                                                }
                                            >
                                                Confirm
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {user.totpEnabled && (
                                    <div className="space-y-3 rounded-md border border-border-subtle p-4">
                                        <Text size="xs" variant="muted">
                                            Enter an authenticator code to
                                            regenerate backup codes.
                                        </Text>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="6-digit code"
                                                type="text"
                                                value={twoFactorCode}
                                                onChange={(e): void =>
                                                    setTwoFactorCode(
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                            />
                                            <Button
                                                loading={
                                                    isTwoFactorConfirmLoading
                                                }
                                                size="sm"
                                                variant="normal"
                                                onClick={(): undefined =>
                                                    void handleRegenerateBackupCodes()
                                                }
                                            >
                                                Regenerate
                                            </Button>
                                        </div>
                                        <div className="border-t border-border-subtle pt-3">
                                            <Text
                                                className="mb-2"
                                                size="xs"
                                                variant="muted"
                                            >
                                                Disable 2FA (requires
                                                confirmation)
                                            </Text>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder={
                                                        showDisableBackupInput
                                                            ? 'Backup code (XXXX-XXXX)'
                                                            : '6-digit code'
                                                    }
                                                    type="text"
                                                    value={
                                                        showDisableBackupInput
                                                            ? twoFactorBackupCode
                                                            : twoFactorCode
                                                    }
                                                    onChange={(e): void => {
                                                        if (
                                                            showDisableBackupInput
                                                        ) {
                                                            setTwoFactorBackupCode(
                                                                e.target.value
                                                                    .toUpperCase()
                                                                    .replace(
                                                                        /\s+/g,
                                                                        '',
                                                                    ),
                                                            );
                                                        } else {
                                                            setTwoFactorCode(
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    '',
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        className="text-xs text-primary hover:underline"
                                                        type="button"
                                                        onClick={(): void =>
                                                            setShowDisableBackupInput(
                                                                (
                                                                    prev,
                                                                ): boolean =>
                                                                    !prev,
                                                            )
                                                        }
                                                    >
                                                        {showDisableBackupInput
                                                            ? 'Use authenticator code'
                                                            : 'Use backup code'}
                                                    </button>
                                                    <Button
                                                        loading={
                                                            isTwoFactorConfirmLoading
                                                        }
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={(): undefined =>
                                                            void handleDisableTwoFactor()
                                                        }
                                                    >
                                                        Disable 2FA
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <SettingsFloatingBar
                        isFixed={false}
                        isPending={isPending}
                        isVisible={hasChanges}
                        onReset={(): void => {
                            setDisplayName(originalDisplayName);
                            setUsername(originalUsername);
                            setPronouns(originalPronouns);
                            setBio(originalBio);
                            setProfilePrimaryColor(originalProfilePrimaryColor);
                            setProfileAccentColor(originalProfileAccentColor);
                        }}
                        onSave={handleSave}
                    />
                </div>
            </div>

            <ChangeLoginModal
                isOpen={isLoginModalOpen}
                onClose={(): void => setIsLoginModalOpen(false)}
            />

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={(): void => setIsPasswordModalOpen(false)}
            />

            <ImageCropModal
                imageFile={cropFile}
                isOpen={isCropModalOpen}
                type={cropType}
                onClose={(): void => setIsCropModalOpen(false)}
                onConfirm={handleCropConfirm}
            />

            <Modal
                isOpen={isBackupModalOpen}
                title="Backup Codes"
                onClose={(): void => {
                    setIsBackupModalOpen(false);
                    setBackupCodes([]);
                }}
            >
                <div className="space-y-4">
                    <Text size="sm" variant="muted">
                        Save these codes now. They are shown only once.
                    </Text>
                    <div className="grid grid-cols-2 gap-2 rounded-md border border-border-subtle p-3 font-mono text-sm">
                        {backupCodes.map((code) => (
                            <div key={code}>{code}</div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="normal"
                            onClick={(): void => {
                                setIsBackupModalOpen(false);
                                setBackupCodes([]);
                            }}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
