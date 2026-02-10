import React from 'react';

import { Ban, Handshake, Settings, Shield, Smile, Zap } from 'lucide-react';

import type { RolePermissions } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';

interface ServerSettingsSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    serverId: string;
}

export const ServerSettingsSidebar: React.FC<ServerSettingsSidebarProps> = ({
    activeSection,
    setActiveSection,
    serverId,
}) => {
    const { hasPermission, isOwner } = usePermissions(serverId);

    const allSections: {
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
        {
            id: 'roles',
            label: 'Roles',
            icon: Shield,
            permission: 'manageRoles',
        },
        {
            id: 'emojis',
            label: 'Emojis',
            icon: Smile,
            permission: 'manageServer',
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
        {
            id: 'bans',
            label: 'Bans',
            icon: Ban,
            permission: 'banMembers',
        },
    ];

    const sections = allSections.filter(
        (section) => isOwner || hasPermission(section.permission),
    );

    return (
        <div className="w-[240px] bg-[var(--secondary-bg)] border-r border-[var(--color-border-subtle)] p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
            <div>
                <Text
                    className="px-3 mb-2 text-[var(--color-muted-foreground)] uppercase tracking-wider"
                    size="xs"
                    weight="bold"
                >
                    Server Settings
                </Text>
                <div className="flex flex-col gap-1">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;

                        return (
                            <Button
                                className={`justify-start w-full px-3 py-2 text-sm transition-all duration-200
                                    ${
                                        isActive
                                            ? 'bg-[var(--color-bg-subtle)] text-[var(--color-foreground)] font-semibold border-transparent'
                                            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-foreground)]'
                                    }`}
                                key={section.id}
                                variant={isActive ? 'normal' : 'ghost'}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <span className="flex items-center gap-2.5">
                                    <Icon size={18} />
                                    {section.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
