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
    category?: string;
}

interface SettingsSidebarLayoutProps {
    headerText?: string;
    sections: SettingsSidebarSection[];
    activeSection: string;
    setActiveSection: (sectionId: string) => void;
}

const groupByCategory = (
    sections: SettingsSidebarSection[],
): { category: string | null; items: SettingsSidebarSection[] }[] => {
    const groups: { category: string | null; items: SettingsSidebarSection[] }[] =
        [];

    for (const section of sections) {
        const category = section.category ?? null;
        const lastGroup = groups.at(-1);
        if (lastGroup?.category === category) {
            lastGroup.items.push(section);
        } else {
            groups.push({ category, items: [section] });
        }
    }

    return groups;
};

export const SettingsSidebarLayout = ({
    headerText,
    sections,
    activeSection,
    setActiveSection,
}: SettingsSidebarLayoutProps) => {
    const visibleSections = sections.filter((s): boolean => !s.hidden);
    const groups = groupByCategory(visibleSections);

    return (
        <div className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto border-r border-border-subtle bg-bg-secondary p-4 md:w-[240px]">
            <div>
                {headerText ? (
                    <Text
                        className="mb-2 px-3 tracking-wider text-muted-foreground uppercase"
                        size="xs"
                        weight="bold"
                    >
                        {headerText}
                    </Text>
                ) : null}
                <div className="flex flex-col gap-3">
                    {groups.map((group, groupIndex) => (
                        <div
                            className="flex flex-col gap-1"
                            key={group.category ?? `ungrouped-${groupIndex}`}
                        >
                            {group.category ? (
                                <Text
                                    className={cn(
                                        'px-1 tracking-wider text-muted-foreground uppercase',
                                        groupIndex > 0 &&
                                            'mt-1 border-t border-border-subtle pt-2',
                                    )}
                                    size="2xs"
                                    weight="medium"
                                >
                                    {group.category}
                                </Text>
                            ) : null}
                            {group.items.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;

                                return (
                                    <Button
                                        className={cn(
                                            'w-full px-3 py-2 text-sm transition-all duration-200',
                                            isActive
                                                ? 'border-transparent bg-bg-subtle font-semibold text-foreground'
                                                : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground',
                                            section.disabled &&
                                                'cursor-not-allowed opacity-50',
                                        )}
                                        disabled={section.disabled}
                                        justify="start"
                                        key={section.id}
                                        variant={isActive ? 'normal' : 'ghost'}
                                        onClick={(): false | void =>
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
                    ))}
                </div>
            </div>
        </div>
    );
};
