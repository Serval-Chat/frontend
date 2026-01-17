import React from 'react';

import type { ASTNode } from '@/utils/textParser/types';

import { ParsedEmoji } from './ParsedEmoji';

interface ParsedTextProps {
    nodes: ASTNode[];
    className?: string;
}

/**
 * @description Renders parsed text
 */
export const ParsedText: React.FC<ParsedTextProps> = ({ nodes, className }) => {
    return (
        <span className={className}>
            {nodes.map((node, idx) => {
                switch (node.type) {
                    case 'text':
                        return <span key={idx}>{node.content}</span>;

                    case 'bold':
                        return (
                            <strong key={idx} className="font-bold">
                                {node.content}
                            </strong>
                        );

                    case 'italic':
                        return (
                            <em key={idx} className="italic">
                                {node.content}
                            </em>
                        );

                    case 'bold_italic':
                        return (
                            <strong key={idx} className="font-bold">
                                <em className="italic">{node.content}</em>
                            </strong>
                        );

                    case 'emoji':
                        return <ParsedEmoji key={idx} emojiId={node.emojiId} />;

                    case 'link':
                        return (
                            <a
                                key={idx}
                                href={node.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {node.text || node.url}
                            </a>
                        );

                    default:
                        return null;
                }
            })}
        </span>
    );
};
