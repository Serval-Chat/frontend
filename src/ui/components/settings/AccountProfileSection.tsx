import { useMemo, useReducer } from 'react';

import { useFriends } from '@/api/friends/friends.queries';
import {
    useUpdateBio,
    useUpdateDisplayName,
    useUpdatePronouns,
    useUpdateUsername,
} from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';
import { mergeReducer } from '@/utils/mergeReducer';

import { BioEditor } from './BioEditor';
import { SecuritySettings } from './SecuritySettings';
import { WebsiteConnectionsSettings } from './WebsiteConnectionsSettings';

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
                    presenceStatus={selfStatus}
                    user={previewUser}
                    onAvatarClick={(): void => {
                        avatarInputRef.current?.click();
                    }}
                    onBannerClick={(): void => {
                        bannerInputRef.current?.click();
                    }}
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
                        onChange={(e): void => {
                            patch({ displayName: e.target.value });
                        }}
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
                        onChange={(e): void => {
                            patch({ username: e.target.value });
                        }}
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
                        onChange={(e): void => {
                            patch({ pronouns: e.target.value });
                        }}
                    />
                </div>

                <BioEditor
                    friends={friendUsers}
                    initialText={user.bio ?? ''}
                    serverEmojis={allServerEmojis}
                    value={bio}
                    onChange={(rawText): void => {
                        patch({ bio: rawText });
                    }}
                />

                <WebsiteConnectionsSettings />

                <SecuritySettings user={user} />

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
