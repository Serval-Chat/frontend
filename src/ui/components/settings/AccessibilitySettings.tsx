import React, { useState } from 'react';

import { Eye } from 'lucide-react';

import { useMe, useUpdateSettings } from '@/api/users/users.queries';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';

export const AccessibilitySettings: React.FC = () => {
    const { data: user, isLoading } = useMe();
    const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();

    const [localDisableFonts, setLocalDisableFonts] = useState<boolean | null>(
        null,
    );
    const [localDisableColors, setLocalDisableColors] = useState<
        boolean | null
    >(null);
    const [localDisableGlow, setLocalDisableGlow] = useState<boolean | null>(
        null,
    );

    const disableCustomFonts =
        localDisableFonts !== null
            ? localDisableFonts
            : user?.settings?.disableCustomUsernameFonts || false;

    const disableCustomColors =
        localDisableColors !== null
            ? localDisableColors
            : user?.settings?.disableCustomUsernameColors || false;

    const disableCustomGlow =
        localDisableGlow !== null
            ? localDisableGlow
            : user?.settings?.disableCustomUsernameGlow || false;

    const hasChanges =
        (localDisableFonts !== null &&
            localDisableFonts !==
                (user?.settings?.disableCustomUsernameFonts || false)) ||
        (localDisableColors !== null &&
            localDisableColors !==
                (user?.settings?.disableCustomUsernameColors || false)) ||
        (localDisableGlow !== null &&
            localDisableGlow !==
                (user?.settings?.disableCustomUsernameGlow || false));

    const handleSave = (): void => {
        updateSettings(
            {
                disableCustomUsernameFonts: disableCustomFonts,
                disableCustomUsernameColors: disableCustomColors,
                disableCustomUsernameGlow: disableCustomGlow,
            },
            {
                onSuccess: () => {
                    setLocalDisableFonts(null);
                    setLocalDisableColors(null);
                    setLocalDisableGlow(null);
                },
            },
        );
    };

    const handleReset = (): void => {
        setLocalDisableFonts(null);
        setLocalDisableColors(null);
        setLocalDisableGlow(null);
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
                                    onCheckedChange={setLocalDisableFonts}
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
                                    onCheckedChange={setLocalDisableColors}
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
                                    onCheckedChange={setLocalDisableGlow}
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
