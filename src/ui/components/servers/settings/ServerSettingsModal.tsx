import React, { useState } from 'react';

import {
    Ban,
    ChevronLeft,
    Handshake,
    ScrollText,
    Settings,
    Shield,
    Smile,
    Sticker,
    UserPlus,
    X,
    Zap,
} from 'lucide-react';

import type { RolePermissions } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsSidebarLayout } from '@/ui/components/common/settings/SettingsSidebarLayout';
import { cn } from '@/utils/cn';

const AuditLogSettings = React.lazy(() =>
    import('./auditLog/AuditLogSettings').then((m) => ({
        default: m.AuditLogSettings,
    })),
);

const ServerBansSettings = React.lazy(() =>
    import('./ServerBansSettings').then((m) => ({
        default: m.ServerBansSettings,
    })),
);

const ServerBehaviourSettings = React.lazy(() =>
    import('./ServerBehaviourSettings').then((m) => ({
        default: m.ServerBehaviourSettings,
    })),
);

const ServerEmojiSettings = React.lazy(() =>
    import('./ServerEmojiSettings').then((m) => ({
        default: m.ServerEmojiSettings,
    })),
);

const ServerInviteSettings = React.lazy(() =>
    import('./ServerInviteSettings').then((m) => ({
        default: m.ServerInviteSettings,
    })),
);

const ServerOverviewSettings = React.lazy(() =>
    import('./ServerOverviewSettings').then((m) => ({
        default: m.ServerOverviewSettings,
    })),
);

const ServerOnboardingSettings = React.lazy(() =>
    import('./ServerOnboardingSettings').then((m) => ({
        default: m.ServerOnboardingSettings,
    })),
);

const ServerRoleSettings = React.lazy(() =>
    import('./ServerRoleSettings').then((m) => ({
        default: m.ServerRoleSettings,
    })),
);

const ServerStickerSettings = React.lazy(() =>
    import('./ServerStickerSettings').then((m) => ({
        default: m.ServerStickerSettings,
    })),
);

interface ServerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
}

const ALL_SECTIONS: {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number | string }>;
    permission: keyof RolePermissions;
}[] = [
    {
        id: 'overview',
        label: 'Overview',
        icon: Settings,
        permission: 'manageServer',
    },
    { id: 'roles', label: 'Roles', icon: Shield, permission: 'manageRoles' },
    {
        id: 'onboarding',
        label: 'Onboarding',
        icon: UserPlus,
        permission: 'manageServer',
    },
    { id: 'emojis', label: 'Emojis', icon: Smile, permission: 'manageServer' },
    {
        id: 'stickers',
        label: 'Stickers',
        icon: Sticker,
        permission: 'manageStickers',
    },
    {
        id: 'invites',
        label: 'Invites',
        icon: Handshake,
        permission: 'manageInvites',
    },
    {
        id: 'behaviour',
        label: 'Behaviour',
        icon: Zap,
        permission: 'manageServer',
    },
    { id: 'bans', label: 'Bans', icon: Ban, permission: 'banMembers' },
    {
        id: 'audit-log',
        label: 'Audit Log',
        icon: ScrollText,
        permission: 'manageServer',
    },
];

export const ServerSettingsModal = ({
    isOpen,
    onClose,
    serverId,
}: ServerSettingsModalProps) => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
    const { hasPermission, isOwner } = usePermissions(serverId);

    const sections = React.useMemo(
        () =>
            ALL_SECTIONS.map((s) => ({
                ...s,
                hidden: !isOwner && !hasPermission(s.permission),
            })),
        [hasPermission, isOwner],
    );

    const defaultSection = React.useMemo(() => {
        const firstVisibleSection = sections.find((s) => !s.hidden);
        return firstVisibleSection?.id ?? 'overview';
    }, [sections]);

    const [activeSection, setActiveSection] = useState<string>(defaultSection);

    // Update active section when it becomes hidden due to permission changes
    const activeSectionIsHidden = React.useMemo(
        () => sections.find((s) => s.id === activeSection)?.hidden ?? false,
        [sections, activeSection],
    );

    React.useEffect(() => {
        if (isOpen && activeSectionIsHidden) {
            // Defer state update to avoid setting state during render
            const timer = setTimeout(() => {
                setActiveSection(defaultSection);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, activeSectionIsHidden, defaultSection]);

    const handleSetSection = (sectionId: string): void => {
        setIsMobileSidebarOpen(false);
        setActiveSection(sectionId);
    };

    return (
        <Modal
            fullScreen
            noPadding
            className="bg-background"
            isOpen={isOpen}
            showCloseButton={false}
            onClose={onClose}
        >
            <div className="relative flex h-full w-full">
                {/* Navigation Sidebar */}
                <div
                    className={cn(
                        'h-full shrink-0',
                        isMobileSidebarOpen
                            ? 'w-full md:w-auto'
                            : 'hidden md:block',
                    )}
                >
                    <SettingsSidebarLayout
                        activeSection={activeSection}
                        headerText="Server Settings"
                        sections={sections}
                        setActiveSection={handleSetSection}
                    />
                </div>
                {/* Content Area */}
                <div
                    className={cn(
                        'relative flex h-full flex-1 flex-col overflow-hidden bg-background',
                        isMobileSidebarOpen ? 'hidden md:flex' : 'flex',
                    )}
                >
                    {/* Mobile Back Header */}
                    {!isMobileSidebarOpen && (
                        <div className="sticky top-0 z-40 flex shrink-0 items-center border-b border-border-subtle bg-background px-4 py-3 md:hidden">
                            <button
                                className="flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                                type="button"
                                onClick={(): void =>
                                    setIsMobileSidebarOpen(true)
                                }
                            >
                                <ChevronLeft size={20} />
                                Back
                            </button>
                        </div>
                    )}

                    {/* Close Button Top Right */}
                    <div
                        className={cn(
                            'absolute top-6 z-50 transition-all duration-300 md:top-8',
                            activeSection === 'roles'
                                ? 'right-6 md:right-80'
                                : 'right-6 md:right-12',
                        )}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <IconButton
                                className="rounded-full border-2 border-border-subtle p-2 text-muted-foreground transition-all duration-200 hover:bg-bg-subtle hover:text-foreground"
                                icon={X}
                                iconSize={24}
                                onClick={onClose}
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                Esc
                            </span>
                        </div>
                    </div>
                    <div
                        className={cn(
                            'scrollbar-thin scrollbar-thumb-bg-secondary scrollbar-track-transparent flex-1 overflow-y-auto',
                            activeSection !== 'roles' && 'p-12',
                        )}
                    >
                        <div
                            className={cn(
                                'mx-auto h-full',
                                activeSection === 'roles'
                                    ? 'max-w-none'
                                    : 'max-w-4xl',
                            )}
                        >
                            <React.Suspense fallback={null}>
                                {activeSection === 'overview' && (
                                    <ServerOverviewSettings
                                        serverId={serverId}
                                    />
                                )}
                                {activeSection === 'roles' && (
                                    <ServerRoleSettings serverId={serverId} />
                                )}
                                {activeSection === 'onboarding' && (
                                    <ServerOnboardingSettings
                                        serverId={serverId}
                                    />
                                )}
                                {activeSection === 'emojis' && (
                                    <ServerEmojiSettings serverId={serverId} />
                                )}
                                {activeSection === 'stickers' && (
                                    <ServerStickerSettings
                                        serverId={serverId}
                                    />
                                )}
                                {activeSection === 'invites' && (
                                    <ServerInviteSettings serverId={serverId} />
                                )}
                                {activeSection === 'behaviour' && (
                                    <ServerBehaviourSettings
                                        serverId={serverId}
                                    />
                                )}
                                {activeSection === 'bans' && (
                                    <ServerBansSettings serverId={serverId} />
                                )}
                                {activeSection === 'audit-log' && (
                                    <AuditLogSettings serverId={serverId} />
                                )}
                            </React.Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
