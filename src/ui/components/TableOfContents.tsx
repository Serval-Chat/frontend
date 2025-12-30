import React, { useState } from 'react';
import { useAutoHighlight } from '../../hooks/useAutoHighlight';

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
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-4 h-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        {isOpen ? '▾' : '▸'}
                    </button>
                )}
                {!hasChildren && <span className="w-4 h-4 shrink-0" />}
                <a
                    href={`#${section.id}`}
                    className="hover:text-blue-500 hover:underline transition-colors duration-150"
                >
                    {section.title}
                </a>
            </div>

            {hasChildren && isOpen && (
                <ul className="ml-5 mt-1 space-y-1">
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
    const traverse = (section: TOCSection) => {
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
        <nav>
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <ul className="space-y-2">
                {sections.map((section) => (
                    <TOCItem key={section.id} section={section} />
                ))}
            </ul>
        </nav>
    );
};
