import React from 'react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

export interface SettingsSidebarSection {
    id: string;
    label: string;
    icon: React.ElementType<{ size?: number | string }>;
    disabled?: boolean;
    hidden?: boolean;
}

interface SettingsSidebarLayoutProps {
    headerText: string;
    sections: SettingsSidebarSection[];
    activeSection: string;
    setActiveSection: (sectionId: string) => void;
}

export const SettingsSidebarLayout: React.FC<SettingsSidebarLayoutProps> = ({
    headerText,
    sections,
    activeSection,
    setActiveSection,
}) => {
    const visibleSections = sections.filter((s) => !s.hidden);

    return (
        <div className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto border-r border-border-subtle bg-bg-secondary p-4 md:w-[240px]">
            <div>
                <Text
                    className="mb-2 px-3 tracking-wider text-muted-foreground uppercase"
                    size="xs"
                    weight="bold"
                >
                    {headerText}
                </Text>
                <div className="flex flex-col gap-1">
                    {visibleSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;

                        return (
                            <Button
                                className={cn(
                                    'w-full justify-start px-3 py-2 text-sm transition-all duration-200',
                                    isActive
                                        ? 'border-transparent bg-bg-subtle font-semibold text-foreground'
                                        : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground',
                                    section.disabled &&
                                        'cursor-not-allowed opacity-50',
                                )}
                                disabled={section.disabled}
                                key={section.id}
                                variant={isActive ? 'normal' : 'ghost'}
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
