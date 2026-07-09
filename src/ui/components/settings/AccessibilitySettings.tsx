import { useReducer } from 'react';

import { Eye } from 'lucide-react';

import { useMe, useUpdateSettings } from '@/api/users/users.queries';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';

// the 5 local overrides all reset together (on Save success and on Reset),
// so they're one reducer instead of 5 separately-set useState calls.
interface LocalOverrides {
    disableFonts: boolean | null;
    disableColors: boolean | null;
    disableGlow: boolean | null;
    limitedAnimations: boolean | null;
    showUsersPronouns: boolean | null;
}

const initialOverrides: LocalOverrides = {
    disableFonts: null,
    disableColors: null,
    disableGlow: null,
    limitedAnimations: null,
    showUsersPronouns: null,
};

type LocalOverridesAction =
    | { type: 'set'; field: keyof LocalOverrides; value: boolean }
    | { type: 'reset' };

function localOverridesReducer(
    state: LocalOverrides,
    action: LocalOverridesAction,
): LocalOverrides {
    switch (action.type) {
        case 'set': {
            return { ...state, [action.field]: action.value };
        }
        case 'reset': {
            return initialOverrides;
        }
        default: {
            return state;
        }
    }
}

export const AccessibilitySettings = () => {
    const { data: user, isLoading } = useMe();
    const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();

    const [local, dispatchLocal] = useReducer(
        localOverridesReducer,
        initialOverrides,
    );

    const disableCustomFonts =
        local.disableFonts ??
        user?.settings?.disableCustomUsernameFonts ??
        false;

    const disableCustomColors =
        local.disableColors ??
        user?.settings?.disableCustomUsernameColors ??
        false;

    const disableCustomGlow =
        local.disableGlow ?? user?.settings?.disableCustomUsernameGlow ?? false;

    const limitedAnimations =
        local.limitedAnimations ?? user?.settings?.limitedAnimations ?? false;

    const showUsersPronouns =
        local.showUsersPronouns ?? user?.settings?.showUsersPronouns ?? false;

    const hasChanges =
        (local.disableFonts !== null &&
            local.disableFonts !==
                (user?.settings?.disableCustomUsernameFonts ?? false)) ||
        (local.disableColors !== null &&
            local.disableColors !==
                (user?.settings?.disableCustomUsernameColors ?? false)) ||
        (local.disableGlow !== null &&
            local.disableGlow !==
                (user?.settings?.disableCustomUsernameGlow ?? false)) ||
        (local.limitedAnimations !== null &&
            local.limitedAnimations !==
                (user?.settings?.limitedAnimations ?? false)) ||
        (local.showUsersPronouns !== null &&
            local.showUsersPronouns !==
                (user?.settings?.showUsersPronouns ?? false));

    const handleSave = (): void => {
        updateSettings(
            {
                disableCustomUsernameFonts: disableCustomFonts,
                disableCustomUsernameColors: disableCustomColors,
                disableCustomUsernameGlow: disableCustomGlow,
                limitedAnimations,
                showUsersPronouns,
            },
            {
                onSuccess: (): void => {
                    dispatchLocal({ type: 'reset' });
                },
            },
        );
    };

    const handleReset = (): void => {
        dispatchLocal({ type: 'reset' });
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Text variant="muted">Loading settings...</Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-24 lg:flex-row lg:items-start lg:gap-12 lg:pb-0">
            {/* Left Column: Form Controls */}
            <div className="flex-1 space-y-8">
                <div>
                    <Heading className="mb-2" level={3}>
                        Accessibility
                    </Heading>
                    <Text className="mb-6" variant="muted">
                        Customize how you experience Serchat to better suit your
                        needs.
                    </Text>

                    {/* Appearance Overrides */}
                    <div>
                        <Heading className="mb-4" level={4} variant="sub">
                            Appearance Overrides
                        </Heading>
                        <div className="space-y-3">
                            {/* Disable Custom Username Fonts */}
                            <div className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Eye
                                            className="text-muted-foreground"
                                            size={16}
                                        />
                                        <Text weight="medium">
                                            Disable Custom Username Fonts
                                        </Text>
                                    </div>
                                    <Text size="sm" variant="muted">
                                        Ignore custom font families set by other
                                        users on their usernames. This will
                                        reset them to the default system font
                                        for improved readability.
                                    </Text>
                                </div>
                                <Toggle
                                    checked={disableCustomFonts}
                                    onCheckedChange={(value): void => {
                                        dispatchLocal({
                                            type: 'set',
                                            field: 'disableFonts',
                                            value,
                                        });
                                    }}
                                />
                            </div>

                            {/* Disable Custom Username Colors */}
                            <div className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Eye
                                            className="text-muted-foreground"
                                            size={16}
                                        />
                                        <Text weight="medium">
                                            Disable Custom Username Colors
                                        </Text>
                                    </div>
                                    <Text size="sm" variant="muted">
                                        Ignore custom colors and gradients set
                                        by other users on their usernames. This
                                        will reset them to the default text
                                        color.
                                    </Text>
                                </div>
                                <Toggle
                                    checked={disableCustomColors}
                                    onCheckedChange={(value): void => {
                                        dispatchLocal({
                                            type: 'set',
                                            field: 'disableColors',
                                            value,
                                        });
                                    }}
                                />
                            </div>

                            {/* Disable Custom Username Glow */}
                            <div className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Eye
                                            className="text-muted-foreground"
                                            size={16}
                                        />
                                        <Text weight="medium">
                                            Disable Custom Username Glow
                                        </Text>
                                    </div>
                                    <Text size="sm" variant="muted">
                                        Ignore glow effects set by other users
                                        on their usernames.
                                    </Text>
                                </div>
                                <Toggle
                                    checked={disableCustomGlow}
                                    onCheckedChange={(value): void => {
                                        dispatchLocal({
                                            type: 'set',
                                            field: 'disableGlow',
                                            value,
                                        });
                                    }}
                                />
                            </div>

                            <div className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Eye
                                            className="text-muted-foreground"
                                            size={16}
                                        />
                                        <Text weight="medium">
                                            Limited Animations
                                        </Text>
                                    </div>
                                    <Text size="sm" variant="muted">
                                        Reduce interface motion and stop
                                        animated media such as GIF profile
                                        pictures, banners, and GIF embeds from
                                        playing automatically.
                                    </Text>
                                </div>
                                <Toggle
                                    checked={limitedAnimations}
                                    onCheckedChange={(value): void => {
                                        dispatchLocal({
                                            type: 'set',
                                            field: 'limitedAnimations',
                                            value,
                                        });
                                    }}
                                />
                            </div>

                            {/* Show User Pronouns */}
                            <div className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Eye
                                            className="text-muted-foreground"
                                            size={16}
                                        />
                                        <Text weight="medium">
                                            Show User Pronouns Next to Their
                                            Message
                                        </Text>
                                    </div>
                                    <Text size="sm" variant="muted">
                                        Display a user's pronouns in parentheses
                                        next to their name in the message
                                        header.
                                    </Text>
                                </div>
                                <Toggle
                                    checked={showUsersPronouns}
                                    onCheckedChange={(value): void => {
                                        dispatchLocal({
                                            type: 'set',
                                            field: 'showUsersPronouns',
                                            value,
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Save Bar */}
            <SettingsFloatingBar
                isPending={isSaving}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />
        </div>
    );
};
