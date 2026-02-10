import React, { useRef, useState } from 'react';

import {
    useMe,
    useUpdateBanner,
    useUpdateBio,
    useUpdateDisplayName,
    useUpdateProfilePicture,
    useUpdatePronouns,
    useUpdateUsername,
} from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';

import { ChangePasswordModal } from './ChangePasswordModal';
import { ImageCropModal } from './ImageCropModal';

export const AccountSettings: React.FC = () => {
    const { data: user } = useMe();
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

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const isPending =
        isUpdatingBio ||
        isUpdatingPronouns ||
        isUpdatingDisplayName ||
        isUpdatingUsername ||
        isUpdatingAvatar ||
        isUpdatingBanner;

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

    const handleSave = (): void => {
        if (displayName !== originalDisplayName) {
            updateDisplayName(displayName, {
                onSuccess: () => setOriginalDisplayName(displayName),
            });
        }
        if (pronouns !== originalPronouns) {
            updatePronouns(pronouns, {
                onSuccess: () => setOriginalPronouns(pronouns),
            });
        }
        if (bio !== originalBio) {
            updateBio(bio, {
                onSuccess: () => setOriginalBio(bio),
            });
        }
        if (username !== originalUsername) {
            updateUsername(username, {
                onSuccess: () => setOriginalUsername(username),
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
        bio !== originalBio;

    if (!user) return null;

    const previewUser = {
        ...user,
        displayName: displayName || user.displayName,
        username: username || user.username,
        pronouns: pronouns || user.pronouns,
        bio: bio || user.bio,
    };

    return (
        <div className="max-w-3xl">
            {/* Hidden file inputs */}
            <input
                accept="image/webp,image/gif"
                className="hidden"
                ref={avatarInputRef}
                type="file"
                onChange={handleAvatarChange}
            />
            <input
                accept="image/webp,image/gif"
                className="hidden"
                ref={bannerInputRef}
                type="file"
                onChange={handleBannerChange}
            />

            <Heading className="mb-6" level={3}>
                My Account
            </Heading>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Preview Section */}
                <div className="flex-shrink-0">
                    <Heading
                        className="mb-3 text-sm font-bold text-[var(--color-muted-foreground)] uppercase"
                        level={4}
                    >
                        Preview
                    </Heading>
                    <UserProfileCard
                        presenceStatus="online"
                        user={previewUser}
                        onAvatarClick={() => avatarInputRef.current?.click()}
                        onBannerClick={() => bannerInputRef.current?.click()}
                    />
                </div>

                {/* Form Section */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase"
                            htmlFor="displayName"
                        >
                            Display Name
                        </label>
                        <Input
                            id="displayName"
                            placeholder="Display Name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase"
                            htmlFor="username"
                        >
                            Username
                        </label>
                        <Input
                            id="username"
                            placeholder="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <Text as="p" size="xs" variant="muted">
                            Changing your username might require a fresh login.
                        </Text>
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase"
                            htmlFor="pronouns"
                        >
                            Pronouns
                        </label>
                        <Input
                            id="pronouns"
                            placeholder="He/Him, They/Them, etc."
                            type="text"
                            value={pronouns}
                            onChange={(e) => setPronouns(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase"
                            htmlFor="bio"
                        >
                            About Me
                        </label>
                        <TextArea
                            className="min-h-[100px] resize-y"
                            id="bio"
                            maxLength={190}
                            placeholder="Tell us about yourself..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                        <Text
                            as="p"
                            className="text-right"
                            size="xs"
                            variant="muted"
                        >
                            {bio.length}/190
                        </Text>
                    </div>

                    {/* Password Section */}
                    <div className="pt-6 border-t border-[var(--color-border-subtle)]">
                        <Heading className="mb-4" level={4}>
                            Password & Authentication
                        </Heading>
                        <div className="bg-[var(--color-bg-subtle)] p-6 rounded-lg border border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <Text weight="bold">Password</Text>
                                <Text size="xs" variant="muted">
                                    Please use a strong password (and I enforce
                                    it)
                                </Text>
                            </div>
                            <Button
                                size="sm"
                                variant="normal"
                                onClick={() => setIsPasswordModalOpen(true)}
                            >
                                Change Password
                            </Button>
                        </div>
                    </div>

                    <SettingsFloatingBar
                        isFixed={false}
                        isPending={isPending}
                        isVisible={hasChanges}
                        onReset={() => {
                            setDisplayName(originalDisplayName);
                            setUsername(originalUsername);
                            setPronouns(originalPronouns);
                            setBio(originalBio);
                        }}
                        onSave={handleSave}
                    />
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />

            <ImageCropModal
                imageFile={cropFile}
                isOpen={isCropModalOpen}
                type={cropType}
                onClose={() => setIsCropModalOpen(false)}
                onConfirm={handleCropConfirm}
            />
        </div>
    );
};
