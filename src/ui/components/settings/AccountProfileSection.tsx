import { useReducer } from 'react';

import {
    useUpdateBio,
    useUpdateDisplayName,
    useUpdatePronouns,
    useUpdateUsername,
} from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';
import { mergeReducer } from '@/utils/mergeReducer';

interface AccountProfileSectionProps {
    user: User;
    avatarInputRef: React.RefObject<HTMLInputElement | null>;
    bannerInputRef: React.RefObject<HTMLInputElement | null>;
}

interface ProfileFieldsState {
    displayName: string;
    originalDisplayName: string;
    username: string;
    originalUsername: string;
    pronouns: string;
    originalPronouns: string;
    bio: string;
    originalBio: string;
}

export const AccountProfileSection = ({
    user,
    avatarInputRef,
    bannerInputRef,
}: AccountProfileSectionProps): React.ReactNode => {
    const { status: selfStatus } = useSelfStatus();
    const { mutate: updateBio, isPending: isUpdatingBio } = useUpdateBio();
    const { mutate: updatePronouns, isPending: isUpdatingPronouns } =
        useUpdatePronouns();
    const { mutate: updateDisplayName, isPending: isUpdatingDisplayName } =
        useUpdateDisplayName();
    const { mutate: updateUsername, isPending: isUpdatingUsername } =
        useUpdateUsername();

    const [fields, patch] = useReducer(mergeReducer<ProfileFieldsState>, {
        displayName: user.displayName ?? '',
        originalDisplayName: user.displayName ?? '',
        username: user.username,
        originalUsername: user.username,
        pronouns: user.pronouns ?? '',
        originalPronouns: user.pronouns ?? '',
        bio: user.bio ?? '',
        originalBio: user.bio ?? '',
    });
    const {
        displayName,
        originalDisplayName,
        username,
        originalUsername,
        pronouns,
        originalPronouns,
        bio,
        originalBio,
    } = fields;

    const isPending =
        isUpdatingBio ||
        isUpdatingPronouns ||
        isUpdatingDisplayName ||
        isUpdatingUsername;

    const hasChanges =
        displayName !== originalDisplayName ||
        username !== originalUsername ||
        pronouns !== originalPronouns ||
        bio !== originalBio;

    const handleSave = (): void => {
        if (displayName !== originalDisplayName) {
            updateDisplayName(displayName, {
                onSuccess: (): void => {
                    patch({ originalDisplayName: displayName });
                },
            });
        }
        if (pronouns !== originalPronouns) {
            updatePronouns(pronouns, {
                onSuccess: (): void => {
                    patch({ originalPronouns: pronouns });
                },
            });
        }
        if (bio !== originalBio) {
            updateBio(bio, {
                onSuccess: (): void => {
                    patch({ originalBio: bio });
                },
            });
        }
        if (username !== originalUsername) {
            updateUsername(username, {
                onSuccess: (): void => {
                    patch({ originalUsername: username });
                },
            });
        }
    };

    const previewUser = {
        ...user,
        displayName: displayName === '' ? user.displayName : displayName,
        username: username === '' ? user.username : username,
        pronouns: pronouns === '' ? user.pronouns : pronouns,
        bio: bio === '' ? user.bio : bio,
    };

    return (
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
                    bioValue={bio}
                    displayNameValue={displayName}
                    presenceStatus={selfStatus}
                    pronounsValue={pronouns}
                    user={previewUser}
                    usernameValue={username}
                    onAvatarClick={(): void => {
                        avatarInputRef.current?.click();
                    }}
                    onBannerClick={(): void => {
                        bannerInputRef.current?.click();
                    }}
                    onBioChange={(value): void => {
                        patch({ bio: value });
                    }}
                    onDisplayNameChange={(value): void => {
                        patch({ displayName: value });
                    }}
                    onPronounsChange={(value): void => {
                        patch({ pronouns: value });
                    }}
                    onUsernameChange={(value): void => {
                        patch({ username: value });
                    }}
                />
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-6">
                <SettingsFloatingBar
                    isFixed={false}
                    isPending={isPending}
                    isVisible={hasChanges}
                    onReset={(): void => {
                        patch({
                            displayName: originalDisplayName,
                            username: originalUsername,
                            pronouns: originalPronouns,
                            bio: originalBio,
                        });
                    }}
                    onSave={handleSave}
                />
            </div>
        </div>
    );
};
