import { useState } from 'react';

import {
    Bell,
    Eye,
    Globe,
    Keyboard,
    KeyRound,
    Lock,
    Monitor,
    Palette,
    Shield,
    ShieldAlert,
    Sparkles,
    User,
} from 'lucide-react';

import { useMe } from '@/api/users/users.queries';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';

import { GroupedSidebarNav, type GroupedNavSection } from './GroupedSidebarNav';
import { ProfileSettingsModal } from './ProfileSettingsModal';

interface SettingsSidebarProps {
    activeSection: string;
    onClose: () => void;
    setActiveSection: (section: string) => void;
}

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
    { id: 'standing', label: 'Standing', icon: ShieldAlert, category: 'Account' },
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
];

export const SettingsSidebar = ({
    activeSection,
    onClose,
    setActiveSection,
}: SettingsSidebarProps) => {
    const { data: me } = useMe();
    const { status: selfStatus } = useSelfStatus();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    return (
        <GroupedSidebarNav
            activeSection={activeSection}
            footer={
                me ? (
                    <>
                        <button
                            className="flex shrink-0 items-center gap-2 border-t border-[var(--sidebar-border,var(--border-subtle))] p-3 text-left transition-colors hover:bg-[var(--sidebar-item-hover-bg,var(--bg-subtle))]"
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
                                        me.settings?.disableCustomUsernameColors
                                    }
                                    disableCustomFonts={
                                        me.settings?.disableCustomUsernameFonts
                                    }
                                    disableGlow={
                                        me.settings?.disableCustomUsernameGlow
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
                    </>
                ) : null
            }
            sections={SETTINGS_SECTIONS}
            setActiveSection={setActiveSection}
            title="Settings"
            onClose={onClose}
        />
    );
};
