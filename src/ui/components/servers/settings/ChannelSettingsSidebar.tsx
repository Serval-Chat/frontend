import React from 'react';

import { Settings, Shield } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';

interface ChannelSettingsSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    channelName: string;
}

export const ChannelSettingsSidebar: React.FC<ChannelSettingsSidebarProps> = ({
    activeSection,
    setActiveSection,
    channelName,
}) => {
    const sections = [
        {
            id: 'overview',
            label: 'Overview',
            icon: Settings,
        },
        {
            id: 'permissions',
            label: 'Permissions',
            icon: Shield,
            disabled: true,
        },
    ];

    return (
        <div className="w-[240px] bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)] p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
            <div>
                <Text
                    className="px-3 mb-2"
                    size="xs"
                    tracking="wider"
                    transform="uppercase"
                    variant="muted"
                    weight="bold"
                >
                    #{channelName} Settings
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
                                            ? 'bg-[var(--color-bg-subtle)] text-[var(--color-foreground)] font-semibold'
                                            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-foreground)]'
                                    }
                                    ${section.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={section.disabled}
                                key={section.id}
                                variant="ghost"
                                onClick={() =>
                                    !section.disabled &&
                                    setActiveSection(section.id)
                                }
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
