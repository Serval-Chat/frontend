import React, { useState } from 'react';

import {
    useMe,
    useUpdateBio,
    useUpdateDisplayName,
    useUpdatePronouns,
    useUpdateUsername,
} from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { TextArea } from '@/ui/components/common/TextArea';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';

export const AccountSettings: React.FC = () => {
    const { data: user } = useMe();
    const { mutate: updateBio, isPending: isUpdatingBio } = useUpdateBio();
    const { mutate: updatePronouns, isPending: isUpdatingPronouns } =
        useUpdatePronouns();
    const { mutate: updateDisplayName, isPending: isUpdatingDisplayName } =
        useUpdateDisplayName();
    const { mutate: updateUsername, isPending: isUpdatingUsername } =
        useUpdateUsername();

    const isPending =
        isUpdatingBio ||
        isUpdatingPronouns ||
        isUpdatingDisplayName ||
        isUpdatingUsername;

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [originalDisplayName, setOriginalDisplayName] = useState(
        user?.displayName || ''
    );

    const [username, setUsername] = useState(user?.username || '');
    const [originalUsername, setOriginalUsername] = useState(
        user?.username || ''
    );

    const [pronouns, setPronouns] = useState(user?.pronouns || '');
    const [originalPronouns, setOriginalPronouns] = useState(
        user?.pronouns || ''
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
            <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-6">
                My Account
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Preview Section */}
                <div className="flex-shrink-0">
                    <h4 className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase mb-3">
                        Preview
                    </h4>
                    <UserProfileCard
                        presenceStatus="online"
                        user={previewUser}
                        onAvatarClick={() => {
                            /* TODO: Avatar Edit Modal */
                        }}
                        onBannerClick={() => {
                            /* TODO: Banner Edit Modal */
                        }}
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
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                            Changing your username might require a fresh login.
                        </p>
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
                        <p className="text-xs text-[var(--color-muted-foreground)] text-right">
                            {bio.length}/190
                        </p>
                    </div>

                    {/* Password Section  */}
                    <div className="pt-6 border-t border-[var(--color-border-subtle)]">
                        <h4 className="text-md font-bold text-[var(--color-foreground)] mb-4">
                            Password & Authentication
                        </h4>
                        <div className="bg-[var(--color-bg-subtle)] p-4 rounded text-center text-[var(--color-muted-foreground)]">
                            Password change functionality someday
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {hasChanges && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-subtle)] flex justify-end gap-3 items-center z-fixed md:absolute md:rounded-b-lg">
                            <span className="text-sm text-[var(--color-foreground)] mr-auto">
                                Careful - you have unsaved changes!
                            </span>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setDisplayName(originalDisplayName);
                                    setUsername(originalUsername);
                                    setPronouns(originalPronouns);
                                    setBio(originalBio);
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                loading={isPending}
                                variant="success"
                                onClick={handleSave}
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
