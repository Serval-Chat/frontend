import React from 'react';

import { Palette, ShieldAlert, User } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';

interface SettingsSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
    activeSection,
    setActiveSection,
}) => {
    const sections = [
        { id: 'account', label: 'My Account', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'standing', label: 'Standing', icon: ShieldAlert },
    ];

    return (
        <div className="w-[200px] bg-[var(--secondary-bg)] border-r border-[var(--color-border-subtle)] p-3 overflow-y-auto shrink-0 flex flex-col gap-1">
            {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                    <Button
                        className={`justify-start w-full px-3 py-2.5 text-sm transition-all duration-200
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
    );
};
