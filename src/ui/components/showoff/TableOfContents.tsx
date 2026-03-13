/**
 * @description Table of contents component
 */
import React, { useState } from 'react';

import { useAutoHighlight } from '@/hooks/useAutoHighlight';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { cn } from '@/utils/cn';

export interface TOCSection {
    id: string;
    title: string;
    children?: TOCSection[];
}

export interface TOCProps {
    sections: TOCSection[];
}

const TOCItem: React.FC<{ section: TOCSection }> = ({ section }) => {
    const [isOpen, setIsOpen] = useState(true); // collapsible state

    const hasChildren = section.children && section.children.length > 0;

    return (
        <li>
            <div className="flex items-center space-x-2">
                {hasChildren && (
                    <Button
                        className={cn(
                            'flex h-4 w-4 min-w-0 items-center justify-center border-none bg-transparent p-0 text-sm text-muted-foreground shadow-none hover:text-muted-foreground-hover',
                        )}
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? '▾' : '▸'}
                    </Button>
                )}
                {!hasChildren && <span className="h-4 w-4 shrink-0" />}
                <a
                    className={cn(
                        'font-sans transition-colors duration-150 hover:text-primary hover:underline',
                    )}
                    href={`#${section.id}`}
                >
                    {section.title}
                </a>
            </div>

            {hasChildren && isOpen && (
                <ul className="mt-xs ml-lg space-y-xs">
                    {section.children!.map((child) => (
                        <TOCItem key={child.id} section={child} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const collectAllIds = (sections: TOCSection[]): string[] => {
    const ids: string[] = [];
    const traverse = (section: TOCSection): void => {
        ids.push(section.id);
        if (section.children) {
            section.children.forEach(traverse);
        }
    };
    sections.forEach(traverse);
    return ids;
};

export const TableOfContents: React.FC<TOCProps> = ({ sections }) => {
    const allIds = collectAllIds(sections);
    useAutoHighlight(allIds);

    return (
        <nav className="font-sans">
            <Heading level={2} variant="sub">
                Table of Contents
            </Heading>
            <ul className="space-y-sm">
                {sections.map((section) => (
                    <TOCItem key={section.id} section={section} />
                ))}
            </ul>
        </nav>
    );
};
