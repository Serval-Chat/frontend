/* eslint-disable react/no-array-index-key */
import React from 'react';

import { FileEmbed } from '@/ui/components/chat/FileEmbed';
import { InviteLink } from '@/ui/components/chat/InviteLink';
import { Box } from '@/ui/components/layout/Box';
import type { ASTNode } from '@/utils/textParser/types';

import { CodeBlock } from './CodeBlock';
import { Heading } from './Heading';
import { Link } from './Link';
import { Mention } from './Mention';
import { ParsedEmoji } from './ParsedEmoji';
import { ParsedUnicodeEmoji } from './ParsedUnicodeEmoji';
import { RoleMention } from './RoleMention';
import { Spoiler } from './Spoiler';
import { Text, type TextProps } from './Text';

interface ParsedTextProps {
    nodes: ASTNode[];
    className?: string;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    condenseFiles?: boolean;
    largeEmojis?: boolean;
    wrap?: TextProps['wrap'];
}

/**
 * @description Renders parsed text
 */
export const ParsedText: React.FC<ParsedTextProps> = ({
    nodes,
    className,
    size,
    condenseFiles,
    largeEmojis,
    wrap,
}) => {
    const fileNodesCount = nodes.filter((n) => n.type === 'file').length;
    const displayNodes = condenseFiles
        ? nodes.filter((n) => n.type !== 'file')
        : nodes;

    const hasVisibleContent = displayNodes.some(
        (node) => node.type !== 'text' || node.content.trim().length > 0,
    );

    return (
        <span className={className}>
            {displayNodes.map((node, idx) => {
                switch (node.type) {
                    case 'text':
                        return (
                            <Text key={idx} size={size} wrap={wrap}>
                                {node.content}
                            </Text>
                        );

                    case 'bold':
                        return (
                            <Text
                                key={idx}
                                size={size}
                                weight="bold"
                                wrap={wrap}
                            >
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Text>
                        );

                    case 'italic':
                        return (
                            <Text
                                fontStyle="italic"
                                key={idx}
                                size={size}
                                wrap={wrap}
                            >
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Text>
                        );

                    case 'bold_italic':
                        return (
                            <Text
                                fontStyle="italic"
                                key={idx}
                                size={size}
                                weight="bold"
                                wrap={wrap}
                            >
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Text>
                        );

                    case 'emoji':
                        return (
                            <ParsedEmoji
                                emojiId={node.emojiId}
                                isLarge={largeEmojis}
                                key={idx}
                            />
                        );

                    case 'unicode_emoji':
                        return (
                            <ParsedUnicodeEmoji
                                content={node.content}
                                isLarge={largeEmojis}
                                key={idx}
                            />
                        );

                    case 'link':
                        return (
                            <Link href={node.url} key={idx}>
                                {typeof node.text === 'string' ? (
                                    node.text || node.url
                                ) : node.text ? (
                                    <ParsedText
                                        nodes={node.text}
                                        size={size}
                                        wrap={wrap}
                                    />
                                ) : (
                                    node.url
                                )}
                            </Link>
                        );

                    case 'h1':
                        return (
                            <Heading key={idx} level={1} variant="chat-h1">
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Heading>
                        );

                    case 'h2':
                        return (
                            <Heading key={idx} level={2} variant="chat-h2">
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Heading>
                        );

                    case 'h3':
                        return (
                            <Heading key={idx} level={3} variant="chat-h3">
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Heading>
                        );

                    case 'subtext':
                        return (
                            <Text
                                key={idx}
                                size="xs"
                                variant="muted"
                                wrap={wrap}
                            >
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Text>
                        );

                    case 'spoiler':
                        return (
                            <Spoiler key={idx}>
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Spoiler>
                        );

                    case 'inline_code':
                        return (
                            <CodeBlock
                                inline
                                content={node.content}
                                key={idx}
                            />
                        );

                    case 'code_block':
                        return (
                            <CodeBlock
                                content={node.content}
                                key={idx}
                                language={node.language}
                            />
                        );

                    case 'invite':
                        return (
                            <InviteLink
                                code={node.code}
                                key={idx}
                                url={node.url}
                            />
                        );

                    case 'file':
                        return <FileEmbed key={idx} url={node.url} />;

                    case 'mention':
                        return <Mention key={idx} userId={node.userId} />;

                    case 'role_mention':
                        return <RoleMention key={idx} roleId={node.roleId} />;

                    case 'everyone':
                        return (
                            <Box
                                as="span"
                                className="inline-flex items-baseline px-1.5 py-[4px] rounded transition-opacity cursor-pointer select-none font-medium text-white shadow-sm hover:opacity-90 bg-primary"
                                key={idx}
                            >
                                <Text
                                    as="span"
                                    className="leading-none drop-shadow-md"
                                    size="sm"
                                >
                                    @everyone
                                </Text>
                            </Box>
                        );

                    default:
                        return null;
                }
            })}
            {condenseFiles && fileNodesCount > 0 && !hasVisibleContent && (
                <span className="ml-1 text-[11px] italic opacity-80">
                    Attachments: {fileNodesCount}
                </span>
            )}
        </span>
    );
};
