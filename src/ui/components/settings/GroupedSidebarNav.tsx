import React from 'react';

import { X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';

export interface GroupedNavSection {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number | string }>;
    category: string;
    danger?: boolean;
}

interface GroupedSidebarNavProps {
    title: string;
    sections: GroupedNavSection[];
    activeSection: string;
    setActiveSection: (sectionId: string) => void;
    onClose: () => void;
    footer?: React.ReactNode;
}

const groupByCategory = (
    sections: GroupedNavSection[],
): { category: string; items: GroupedNavSection[] }[] => {
    const groups: { category: string; items: GroupedNavSection[] }[] = [];

    for (const section of sections) {
        const lastGroup = groups.at(-1);
        if (lastGroup?.category === section.category) {
            lastGroup.items.push(section);
        } else {
            groups.push({ category: section.category, items: [section] });
        }
    }

    return groups;
};

export const GroupedSidebarNav = ({
    title,
    sections,
    activeSection,
    setActiveSection,
    onClose,
    footer,
}: GroupedSidebarNavProps) => {
    const groups = groupByCategory(sections);

    return (
        <div className="flex h-full w-full shrink-0 flex-col overflow-hidden border-r border-[var(--sidebar-border,var(--border-subtle))] bg-[var(--sidebar-bg,var(--secondary-bg))] md:w-[200px]">
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between border-b border-[var(--sidebar-border,var(--border-subtle))] px-2 pb-3 md:hidden">
                    <Heading className="m-0" level={2} variant="section">
                        {title}
                    </Heading>
                    <IconButton
                        className="border border-border-subtle text-muted-foreground hover:bg-danger-muted hover:text-danger"
                        icon={X}
                        iconSize={20}
                        onClick={onClose}
                    />
                </div>

                {groups.map((group, groupIndex) => (
                    <div className="flex flex-col gap-1" key={group.category}>
                        <span
                            className={cn(
                                'px-1 text-[0.625rem] font-medium tracking-wider text-[var(--sidebar-item-text,var(--muted-foreground))] uppercase',
                                groupIndex > 0 &&
                                    'mt-1 border-t border-[var(--sidebar-border,var(--border-subtle))] pt-2',
                            )}
                        >
                            {group.category}
                        </span>
                        {group.items.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;

                            return (
                                <Button
                                    fullWidth
                                    className={`px-3 py-2.5 text-sm transition-all duration-200
                                            ${
                                                isActive
                                                    ? 'border-transparent bg-[var(--sidebar-item-active-bg,var(--bg-subtle))] font-semibold text-[var(--sidebar-item-active-text,var(--foreground))]'
                                                    : section.danger
                                                      ? 'text-danger hover:bg-danger-muted hover:text-danger'
                                                      : 'text-[var(--sidebar-item-text,var(--muted-foreground))] hover:bg-[var(--sidebar-item-hover-bg,var(--bg-subtle))] hover:text-[var(--sidebar-item-hover-text,var(--foreground))]'
                                            }`}
                                    justify="start"
                                    key={section.id}
                                    variant={isActive ? 'normal' : 'ghost'}
                                    onClick={(): void => {
                                        setActiveSection(section.id);
                                    }}
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

            {footer}
        </div>
    );
};
