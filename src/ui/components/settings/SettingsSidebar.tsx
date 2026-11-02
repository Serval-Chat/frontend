import { useState } from 'react';

import {
    Bell,
    Eye,
    Flag,
    Globe,
    KeyRound,
    Keyboard,
    Lock,
    LogOut,
    Monitor,
    Palette,
    Shield,
    ShieldAlert,
    Sparkles,
    User,
} from 'lucide-react';

import { useMe } from '@/api/users/users.queries';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import { useAppSelector } from '@/store/hooks';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';

import { type GroupedNavSection, GroupedSidebarNav } from './GroupedSidebarNav';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';

interface SettingsSidebarProps {
    activeSection: string;
    onClose: () => void;
    setActiveSection: (section: string) => void;
}

const SIGN_OUT_SECTION_ID = 'signout';

const SETTINGS_SECTIONS: GroupedNavSection[] = [
    { id: 'account', label: 'My Account', icon: User, category: 'Account' },
    {
        id: 'connections',
        label: 'Connections',
        icon: Globe,
        category: 'Account',
    },
    {
        id: 'security',
        label: 'Authentication',
        icon: KeyRound,
        category: 'Account',
    },
    { id: 'sessions', label: 'Sessions', icon: Monitor, category: 'Account' },
    {
        id: 'standing',
        label: 'Standing',
        icon: ShieldAlert,
        category: 'Account',
    },
    { id: 'reports', label: 'My Reports', icon: Flag, category: 'Account' },
    {
        id: 'privacy',
        label: 'Privacy',
        icon: Lock,
        category: 'Privacy & Safety',
    },
    {
        id: 'blocking',
        label: 'Blocking',
        icon: Shield,
        category: 'Privacy & Safety',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        category: 'Privacy & Safety',
    },
    {
        id: 'appearance',
        label: 'Appearance',
        icon: Palette,
        category: 'Appearance',
    },
    {
        id: 'decorations',
        label: 'Decoration Creator',
        icon: Sparkles,
        category: 'Appearance',
    },
    {
        id: 'accessibility',
        label: 'Accessibility',
        icon: Eye,
        category: 'Appearance',
    },
    { id: 'keybinds', label: 'Keybinds', icon: Keyboard, category: 'Advanced' },
    {
        id: 'developer',
        label: 'Developer',
        icon: ShieldAlert,
        category: 'Advanced',
    },
    {
        id: SIGN_OUT_SECTION_ID,
        label: 'Sign out',
        icon: LogOut,
        category: 'Sign out',
        danger: true,
    },
];

export const SettingsSidebar = ({
    activeSection,
    onClose,
    setActiveSection,
}: SettingsSidebarProps) => {
    const { data: me } = useMe();
    const { status: selfStatus } = useSelfStatus();
    const backendInstanceId = useAppSelector(
        (state): string | null => state.presence.backendInstanceId,
    );
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleSectionSelect = (sectionId: string): void => {
        if (sectionId === SIGN_OUT_SECTION_ID) {
            setIsLogoutModalOpen(true);
            return;
        }
        setActiveSection(sectionId);
    };

    return (
        <>
            <GroupedSidebarNav
                activeSection={activeSection}
                footer={
                    me ? (
                        <div className="border-t border-[var(--sidebar-border,var(--border-subtle))]">
                            {backendInstanceId ? (
                                <div className="px-3 pt-2 pb-1">
                                    <div className="text-[10px] font-medium text-[var(--sidebar-item-text,var(--muted-foreground))]">
                                        Instance
                                    </div>
                                    <div
                                        className="truncate font-mono text-xs text-[var(--sidebar-item-active-text,var(--foreground))]"
                                        title={`Instance: ${backendInstanceId}`}
                                    >
                                        {backendInstanceId}
                                    </div>
                                </div>
                            ) : null}
                            <button
                                className="flex shrink-0 items-center gap-2 p-3 text-left transition-colors hover:bg-[var(--sidebar-item-hover-bg,var(--bg-subtle))]"
                                type="button"
                                onClick={(): void => {
                                    setIsProfileModalOpen(true);
                                }}
                            >
                                <UserProfilePicture
                                    decorationId={me.decorationId}
                                    size="sm"
                                    src={me.profilePicture}
                                    status={selfStatus}
                                    username={me.username}
                                />
                                <div className="min-w-0 flex-1">
                                    <StyledUserName
                                        className="text-sm leading-tight font-semibold !text-[var(--sidebar-item-active-text,var(--foreground))]"
                                        disableColors={
                                            me.settings
                                                ?.disableCustomUsernameColors
                                        }
                                        disableCustomFonts={
                                            me.settings
                                                ?.disableCustomUsernameFonts
                                        }
                                        disableGlow={
                                            me.settings
                                                ?.disableCustomUsernameGlow
                                        }
                                        user={me}
                                    >
                                        {me.displayName ?? me.username}
                                    </StyledUserName>
                                    <div className="truncate text-xs text-[var(--sidebar-item-text,var(--muted-foreground))]">
                                        @{me.username}
                                    </div>
                                </div>
                            </button>
                            <ProfileSettingsModal
                                isOpen={isProfileModalOpen}
                                onClose={(): void => {
                                    setIsProfileModalOpen(false);
                                }}
                            />
                        </div>
                    ) : null
                }
                sections={SETTINGS_SECTIONS}
                setActiveSection={handleSectionSelect}
                title="Settings"
                onClose={onClose}
            />
            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={(): void => {
                    setIsLogoutModalOpen(false);
                }}
            />
        </>
    );
};
