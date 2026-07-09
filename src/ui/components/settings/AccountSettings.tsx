import React, { useRef, useState } from 'react';

import {
    useMe,
    useUpdateBanner,
    useUpdateProfilePicture,
} from '@/api/users/users.queries';
import { Heading } from '@/ui/components/common/Heading';

import { AccountProfileSection } from './AccountProfileSection';
import { ImageCropModal } from './ImageCropModal';

export const AccountSettings = () => {
    const { data: user } = useMe();
    const { mutate: updateProfilePicture } = useUpdateProfilePicture();
    const { mutate: updateBanner } = useUpdateBanner();

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const handleAvatarChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const target = e.target;
        const file = target.files?.[0];
        if (file) {
            setCropFile(file);
            setCropType('avatar');
            setIsCropModalOpen(true);
            // Reset input so the same file can be selected again
            target.value = '';
        }
    };

    const handleBannerChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const target = e.target;
        const file = target.files?.[0];
        if (file) {
            setCropFile(file);
            setCropType('banner');
            setIsCropModalOpen(true);
            // Reset input so the same file can be selected again
            target.value = '';
        }
    };

    const handleCropConfirm = (processedFile: File): void => {
        if (cropType === 'avatar') {
            updateProfilePicture(processedFile);
        } else {
            updateBanner(processedFile);
        }
    };

    if (!user) return null;

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

            <AccountProfileSection
                avatarInputRef={avatarInputRef}
                bannerInputRef={bannerInputRef}
                user={user}
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
