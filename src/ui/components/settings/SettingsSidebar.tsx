import React from 'react';

import { Eye, Palette, Shield, ShieldAlert, User } from 'lucide-react';

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
        { id: 'accessibility', label: 'Accessibility', icon: Eye },
        { id: 'blocking', label: 'Blocking', icon: Shield },
        { id: 'standing', label: 'Standing', icon: ShieldAlert },
        { id: 'developer', label: 'Developer', icon: ShieldAlert },
    ];

    return (
        <div className="flex w-full shrink-0 flex-col gap-1 overflow-y-auto border-r border-border-subtle bg-[var(--secondary-bg)] p-3 md:w-[200px]">
            {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                    <Button
                        className={`w-full justify-start px-3 py-2.5 text-sm transition-all duration-200
                            ${
                                isActive
                                    ? 'border-transparent bg-bg-subtle font-semibold text-foreground'
                                    : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground'
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
