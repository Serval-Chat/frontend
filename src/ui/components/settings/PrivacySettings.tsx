import { useMe, useUpdatePrivacySettings } from '@/api/users/users.queries';
import type { PrivacySettings as PrivacySettingsType } from '@/api/users/users.types';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Toggle } from '@/ui/components/common/Toggle';

interface PrivacyToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const PrivacyToggleRow = ({
    label,
    description,
    checked,
    disabled,
    onCheckedChange,
}: PrivacyToggleRowProps) => (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
        <div className="flex flex-col gap-0.5">
            <Text weight="bold">{label}</Text>
            <Text size="xs" variant="muted">
                {description}
            </Text>
        </div>
        <Toggle
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
        />
    </div>
);

export const PrivacySettings = () => {
    const { data: user } = useMe();
    const { mutate: updatePrivacy, isPending } = useUpdatePrivacySettings();
    const { showToast } = useToast();

    if (!user) return null;

    const ps = user.privacySettings ?? {
        privateProfile: false,
        hideDisplayName: false,
        hidePronouns: false,
        hideConnections: false,
        hideBio: false,
        hideStatus: false,
    };

    const handleToggle = (
        key: keyof PrivacySettingsType,
        value: boolean,
    ): void => {
        updatePrivacy(
            { [key]: value },
            {
                onError: (): void => {
                    showToast('Failed to update privacy settings.', 'error');
                },
            },
        );
    };

    return (
        <div className="max-w-2xl">
            <Heading className="mb-1" level={3}>
                Privacy
            </Heading>
            <Text className="mb-6" size="sm" variant="muted">
                Control what others can see on your profile.
            </Text>

            <div className="space-y-3">
                <div className="mb-2">
                    <Text
                        className="mb-3 text-sm font-bold uppercase"
                        variant="muted"
                    >
                        Profile Visibility
                    </Text>
                    <PrivacyToggleRow
                        checked={ps.privateProfile}
                        description="Only people you follow or are friends with can view your full profile."
                        disabled={isPending}
                        label="Private Profile"
                        onCheckedChange={(v): void =>
                            handleToggle('privateProfile', v)
                        }
                    />
                </div>

                <div>
                    <Text
                        className="mb-3 text-sm font-bold uppercase"
                        variant="muted"
                    >
                        Hide Specific Fields
                    </Text>
                    <div className="space-y-2">
                        <PrivacyToggleRow
                            checked={ps.hideDisplayName}
                            description="Your display name will not be shown to others."
                            disabled={isPending}
                            label="Make Display Name Private"
                            onCheckedChange={(v): void =>
                                handleToggle('hideDisplayName', v)
                            }
                        />
                        <PrivacyToggleRow
                            checked={ps.hidePronouns}
                            description="Your pronouns will not be shown to others."
                            disabled={isPending}
                            label="Make Pronouns Private"
                            onCheckedChange={(v): void =>
                                handleToggle('hidePronouns', v)
                            }
                        />
                        <PrivacyToggleRow
                            checked={ps.hideBio}
                            description="Your bio will not be shown to others."
                            disabled={isPending}
                            label="Make Bio Private"
                            onCheckedChange={(v): void =>
                                handleToggle('hideBio', v)
                            }
                        />
                        <PrivacyToggleRow
                            checked={ps.hideStatus}
                            description="Your custom status will not be shown to others."
                            disabled={isPending}
                            label="Make Status Private"
                            onCheckedChange={(v): void =>
                                handleToggle('hideStatus', v)
                            }
                        />
                        <PrivacyToggleRow
                            checked={ps.hideConnections}
                            description="Your linked websites and connections will not be shown to others."
                            disabled={isPending}
                            label="Make Connections Private"
                            onCheckedChange={(v): void =>
                                handleToggle('hideConnections', v)
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
