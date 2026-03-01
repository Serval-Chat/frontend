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
        <div className="w-[240px] bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)] p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
            <div>
                <Text
                    className="px-3 mb-2 text-[var(--color-muted-foreground)] uppercase tracking-wider"
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
                                    'justify-start w-full px-3 py-2 text-sm transition-all duration-200',
                                    isActive
                                        ? 'bg-[var(--color-bg-subtle)] text-[var(--color-foreground)] font-semibold border-transparent'
                                        : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-foreground)]',
                                    section.disabled &&
                                        'opacity-50 cursor-not-allowed',
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
