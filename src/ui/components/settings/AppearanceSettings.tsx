import { useMe } from '@/api/users/users.queries';
import type { User, UsernameFont } from '@/api/users/users.types';
import { useAppearanceForm } from '@/hooks/settings/useAppearanceForm';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Toggle } from '@/ui/components/common/Toggle';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';

import { CustomThemesSection } from './CustomThemesSection';
import { GlobalFontSection } from './GlobalFontSection';
import { ProfileColorsSection } from './ProfileColorsSection';
import { ThemeSwitcher } from './ThemeSwitcher';
import { UsernameGradientSection } from './UsernameGradientSection';

const FONT_OPTIONS = [
    {
        id: 'default',
        label: 'Default (Noto Sans)',
        style: { fontFamily: 'default' },
    },
    { id: 'Audiowide', label: 'Audiowide', style: { fontFamily: 'Audiowide' } },
    {
        id: 'Bebas Neue',
        label: 'Bebas Neue',
        style: { fontFamily: 'Bebas Neue' },
    },
    {
        id: 'Betania Patmos',
        label: 'Betania Patmos',
        style: { fontFamily: 'Betania Patmos' },
    },
    {
        id: 'Google Sans Code',
        label: 'Google Sans Code',
        style: { fontFamily: 'Google Sans Code' },
    },
    { id: 'Noto Sans', label: 'Noto Sans', style: { fontFamily: 'Noto Sans' } },
    { id: 'Pacifico', label: 'Pacifico', style: { fontFamily: 'Pacifico' } },
    {
        id: 'Playpen Sans Deva',
        label: 'Playpen Sans Deva',
        style: { fontFamily: 'Playpen Sans Deva' },
    },
    {
        id: 'Rampart One',
        label: 'Rampart One',
        style: { fontFamily: 'Rampart One' },
    },
    { id: 'Roboto', label: 'Roboto', style: { fontFamily: 'Roboto' } },
    { id: 'Workbench', label: 'Workbench', style: { fontFamily: 'Workbench' } },
];

const AppearanceSettingsForm = ({ user }: { user: User }) => {
    const f = useAppearanceForm(user);

    return (
        <>
            <div className="max-w-6xl pb-20 transition-all duration-500 ease-in-out">
                <div className="mb-6 flex items-center justify-between">
                    <Heading level={3}>Appearance</Heading>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={f.handleResetToDefaults}
                    >
                        Reset all username styles
                    </Button>
                </div>

                <div className="flex flex-col items-start md:flex-row">
                    <div className="w-full min-w-0 flex-1 pb-8 transition-all duration-500 ease-in-out md:pr-8 md:pb-0">
                        <div className="grid grid-cols-1 gap-8">
                            <ProfileColorsSection
                                accentColor={f.profileAccentColor}
                                accentWithoutPrimary={f.accentWithoutPrimary}
                                activeColorPicker={f.activeColorPicker}
                                hexDraft={f.hexDraft}
                                pickerCoords={f.pickerCoords}
                                pickerRef={f.pickerRef}
                                primaryColor={f.profilePrimaryColor}
                                setAccentColor={f.setProfileAccentColor}
                                setActiveColorPicker={f.setActiveColorPicker}
                                setHexDraft={f.setHexDraft}
                                setPrimaryColor={f.setProfilePrimaryColor}
                                triggerRef={f.triggerRef}
                            />

                            <div className="rounded-lg bg-bg-subtle p-6 text-center">
                                <Heading
                                    className="mb-4 text-sm font-bold text-muted-foreground uppercase"
                                    level={4}
                                >
                                    Preview
                                </Heading>
                                <div className="flex items-center justify-center rounded border border-border-subtle bg-bg-secondary py-4">
                                    <StyledUserName
                                        className="text-3xl font-bold"
                                        disableCustomFonts={false}
                                        user={f.previewUser}
                                    >
                                        {user.displayName ?? user.username}
                                    </StyledUserName>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <UsernameGradientSection
                                    activeColorPicker={f.activeColorPicker}
                                    addGradientColor={f.addGradientColor}
                                    gradientAngle={f.gradientAngle}
                                    gradientColors={f.gradientColors}
                                    gradientEnabled={f.gradientEnabled}
                                    hexDraft={f.hexDraft}
                                    pickerCoords={f.pickerCoords}
                                    pickerRef={f.pickerRef}
                                    removeGradientColor={f.removeGradientColor}
                                    setActiveColorPicker={
                                        f.setActiveColorPicker
                                    }
                                    setGradientAngle={f.setGradientAngle}
                                    setGradientEnabled={f.setGradientEnabled}
                                    setHexDraft={f.setHexDraft}
                                    triggerRef={f.triggerRef}
                                    updateGradientColor={f.updateGradientColor}
                                />

                                <div className="space-y-4">
                                    <Heading level={4}>Theme</Heading>
                                    <ThemeSwitcher />
                                </div>

                                <CustomThemesSection
                                    customThemeCss={f.customThemeCss}
                                    customThemeFileInputRef={
                                        f.customThemeFileInputRef
                                    }
                                    customThemeFileName={f.customThemeFileName}
                                    customThemeName={f.customThemeName}
                                    customThemes={f.customThemes}
                                    editingThemeId={f.editingThemeId}
                                    setCustomThemeCss={f.setCustomThemeCss}
                                    setCustomThemeName={f.setCustomThemeName}
                                    setPendingDeleteThemeId={
                                        f.setPendingDeleteThemeId
                                    }
                                    setTheme={f.setTheme}
                                    theme={f.theme}
                                    onCustomThemeFileChange={
                                        f.handleCustomThemeFileChange
                                    }
                                    onEditCustomTheme={f.handleEditCustomTheme}
                                    onNewCustomTheme={f.handleNewCustomTheme}
                                    onSaveCustomTheme={f.handleSaveCustomTheme}
                                />

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Heading level={4}>
                                                24-Hour Time
                                            </Heading>
                                            <Toggle
                                                checked={f.use24HourTime}
                                                onCheckedChange={
                                                    f.setUse24HourTime
                                                }
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            Show message timestamps in 24-hour
                                            format.
                                        </span>
                                    </div>
                                </div>

                                <GlobalFontSection
                                    localCustomFontFamily={
                                        f.localCustomFontFamily
                                    }
                                    localCustomFontUrl={f.localCustomFontUrl}
                                    setLocalCustomFontFamily={
                                        f.setLocalCustomFontFamily
                                    }
                                    setLocalCustomFontUrl={
                                        f.setLocalCustomFontUrl
                                    }
                                />

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <Heading level={4}>
                                            Username Font
                                        </Heading>
                                        <span className="text-sm text-muted-foreground">
                                            Select a custom font for your
                                            username alias globally.
                                        </span>
                                        <div className="relative z-[var(--z-index-dropdown)] max-w-xs">
                                            <DropdownWithSearch
                                                allowClear={false}
                                                options={FONT_OPTIONS.map(
                                                    (fo) => ({
                                                        ...fo,
                                                        label: fo.label,
                                                        displayLabel: (
                                                            <span
                                                                style={fo.style}
                                                            >
                                                                {fo.label}
                                                            </span>
                                                        ),
                                                    }),
                                                )}
                                                placeholder="Select Font"
                                                searchPlaceholder="Search fonts..."
                                                value={
                                                    f.usernameFont === 'default'
                                                        ? null
                                                        : f.usernameFont
                                                }
                                                onChange={(val): void => {
                                                    f.setUsernameFont(
                                                        (val ??
                                                            'default') as UsernameFont,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Heading level={4}>
                                            Username Glow
                                        </Heading>
                                        <Toggle
                                            checked={f.glowEnabled}
                                            onCheckedChange={f.setGlowEnabled}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="w-full shrink-0 overflow-hidden transition-all duration-500 ease-in-out md:sticky md:top-4 md:w-auto"
                        style={{
                            width: '340px',
                            maxHeight: '1000px',
                            opacity: 1,
                            transform: 'translateY(0) scale(1)',
                            pointerEvents: 'auto',
                        }}
                    >
                        <div className="p-1">
                            <Heading
                                className="mb-4 text-sm font-bold text-muted-foreground uppercase"
                                level={4}
                            >
                                Full Profile Preview
                            </Heading>
                            <UserProfileCard
                                presenceStatus="online"
                                user={f.previewUser}
                            />
                        </div>
                    </div>
                </div>

                <SettingsFloatingBar
                    isFixed={false}
                    isPending={f.isPending}
                    isVisible={f.hasChanges}
                    onReset={f.handleReset}
                    onSave={f.handleSave}
                />
            </div>
            <Modal
                isOpen={!!f.pendingDeleteThemeId}
                title="Delete Custom Theme"
                onClose={(): void => {
                    f.setPendingDeleteThemeId(undefined);
                }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Delete{' '}
                        <span className="font-bold text-foreground">
                            {f.pendingDeleteTheme?.name ?? 'this custom theme'}
                        </span>
                        ? This removes the locally saved CSS from this browser.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(): void => {
                                f.setPendingDeleteThemeId(undefined);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={f.handleConfirmDeleteCustomTheme}
                        >
                            Delete Theme
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export const AppearanceSettings = () => {
    const { data: user } = useMe();
    if (!user) return null;
    return <AppearanceSettingsForm key={user.id} user={user} />;
};
