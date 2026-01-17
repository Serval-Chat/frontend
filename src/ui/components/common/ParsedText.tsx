/* eslint-disable react/no-array-index-key */
import React from 'react';

import type { ASTNode } from '@/utils/textParser/types';

import { CodeBlock } from './CodeBlock';
import { Heading } from './Heading';
import { Link } from './Link';
import { ParsedEmoji } from './ParsedEmoji';
import { Spoiler } from './Spoiler';
import { Text } from './Text';

interface ParsedTextProps {
    nodes: ASTNode[];
    className?: string;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

/**
 * @description Renders parsed text
 */
export const ParsedText: React.FC<ParsedTextProps> = ({
    nodes,
    className,
    size,
}) => (
    <span className={className}>
        {nodes.map((node, idx) => {
            switch (node.type) {
                case 'text':
                    return (
                        <Text key={idx} size={size}>
                            {node.content}
                        </Text>
                    );

                case 'bold':
                    return (
                        <Text key={idx} size={size} weight="bold">
                            {node.content}
                        </Text>
                    );

                case 'italic':
                    return (
                        <Text fontStyle="italic" key={idx} size={size}>
                            {node.content}
                        </Text>
                    );

                case 'bold_italic':
                    return (
                        <Text
                            fontStyle="italic"
                            key={idx}
                            size={size}
                            weight="bold"
                        >
                            {node.content}
                        </Text>
                    );

                case 'emoji':
                    return <ParsedEmoji emojiId={node.emojiId} key={idx} />;

                case 'link':
                    return (
                        <Link href={node.url} key={idx}>
                            {node.text || node.url}
                        </Link>
                    );

                case 'h1':
                    return (
                        <Heading key={idx} level={1} variant="chat-h1">
                            {node.content}
                        </Heading>
                    );

                case 'h2':
                    return (
                        <Heading key={idx} level={2} variant="chat-h2">
                            {node.content}
                        </Heading>
                    );

                case 'h3':
                    return (
                        <Heading key={idx} level={3} variant="chat-h3">
                            {node.content}
                        </Heading>
                    );

                case 'subtext':
                    return (
                        <Text key={idx} size="xs" variant="muted">
                            {node.content}
                        </Text>
                    );

                case 'spoiler':
                    return <Spoiler key={idx}>{node.content}</Spoiler>;

                case 'inline_code':
                    return (
                        <CodeBlock inline content={node.content} key={idx} />
                    );

                case 'code_block':
                    return (
                        <CodeBlock
                            content={node.content}
                            key={idx}
                            language={node.language}
                        />
                    );

                default:
                    return null;
            }
        })}
    </span>
);
