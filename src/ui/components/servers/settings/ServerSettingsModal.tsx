import React, { useState } from 'react';

import {
    Ban,
    ChevronLeft,
    Handshake,
    Settings,
    Shield,
    Smile,
    X,
    Zap,
} from 'lucide-react';

import type { RolePermissions } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsSidebarLayout } from '@/ui/components/common/settings/SettingsSidebarLayout';
import { cn } from '@/utils/cn';

import { ServerBansSettings } from './ServerBansSettings';
import { ServerBehaviourSettings } from './ServerBehaviourSettings';
import { ServerEmojiSettings } from './ServerEmojiSettings';
import { ServerInviteSettings } from './ServerInviteSettings';
import { ServerOverviewSettings } from './ServerOverviewSettings';
import { ServerRoleSettings } from './ServerRoleSettings';

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
    { id: 'emojis', label: 'Emojis', icon: Smile, permission: 'manageServer' },
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
];

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
    isOpen,
    onClose,
    serverId,
}) => {
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
    const { hasPermission, isOwner } = usePermissions(serverId);

    const sections = ALL_SECTIONS.map((s) => ({
        ...s,
        hidden: !isOwner && !hasPermission(s.permission),
    }));

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
                                onClick={() => setIsMobileSidebarOpen(true)}
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
                            {activeSection === 'overview' && (
                                <ServerOverviewSettings serverId={serverId} />
                            )}
                            {activeSection === 'roles' && (
                                <ServerRoleSettings serverId={serverId} />
                            )}
                            {activeSection === 'emojis' && (
                                <ServerEmojiSettings serverId={serverId} />
                            )}
                            {activeSection === 'invites' && (
                                <ServerInviteSettings serverId={serverId} />
                            )}
                            {activeSection === 'behaviour' && (
                                <ServerBehaviourSettings serverId={serverId} />
                            )}
                            {activeSection === 'bans' && (
                                <ServerBansSettings serverId={serverId} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
