/* eslint-disable react/no-array-index-key */
import React from 'react';

import { ChannelLink } from '@/ui/components/chat/ChannelLink';
import { FileEmbed } from '@/ui/components/chat/FileEmbed';
import { InviteLink } from '@/ui/components/chat/InviteLink';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import type { ASTNode } from '@/utils/textParser/types';

import { Admonition } from './Admonition';
import { CodeBlock } from './CodeBlock';
import { Divider } from './Divider';
import { Heading } from './Heading';
import { LatexRenderer } from './LatexRenderer';
import { Link } from './Link';
import { Mention } from './Mention';
import { MermaidChart } from './MermaidChart';
import { ParsedEmoji } from './ParsedEmoji';
import { ParsedUnicodeEmoji } from './ParsedUnicodeEmoji';
import { RoleMention } from './RoleMention';
import { Spoiler } from './Spoiler';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './Table';
import { Text, type TextProps } from './Text';

interface ParsedTextProps {
    nodes: ASTNode[];
    className?: string;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    condenseFiles?: boolean;
    largeEmojis?: boolean;
    wrap?: TextProps['wrap'];
    isNested?: boolean;
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
    isNested,
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
                            <Text
                                data-source={JSON.stringify(node.content)}
                                key={idx}
                                size={size}
                                wrap={wrap}
                            >
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
                                        isNested
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
                                        isNested
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Text>
                        );

                    case 'underline':
                        return (
                            <Text
                                decoration="underline"
                                key={idx}
                                size={size}
                                wrap={wrap}
                            >
                                {typeof node.content === 'string' ? (
                                    node.content
                                ) : (
                                    <ParsedText
                                        isNested
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </Text>
                        );

                    case 'strikethrough':
                        return (
                            <Text
                                decoration="strike"
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
                            <Link href={node.url} key={idx} size={size}>
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

                    case 'mermaid':
                        return (
                            <MermaidChart content={node.content} key={idx} />
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

                    case 'channel_link':
                        return (
                            <ChannelLink
                                channelId={node.channelId}
                                key={idx}
                                messageId={node.messageId}
                                serverId={node.serverId}
                            />
                        );

                    case 'everyone':
                        return (
                            <Box
                                as="span"
                                className="inline-flex cursor-pointer items-baseline rounded bg-primary px-1.5 py-[4px] font-medium text-white shadow-sm transition-opacity select-none hover:opacity-90"
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
                    case 'unordered_list':
                        return (
                            <Box
                                className="flex items-baseline gap-2"
                                key={idx}
                                style={{
                                    paddingLeft: `${(node.depth ?? 0) * 1.5}rem`,
                                }}
                            >
                                <Text size={size} variant="muted" wrap={wrap}>
                                    •
                                </Text>
                                <Box className="min-w-0 flex-1">
                                    {typeof node.content === 'string' ? (
                                        <Text key={idx} size={size} wrap={wrap}>
                                            {node.content}
                                        </Text>
                                    ) : (
                                        <ParsedText
                                            nodes={node.content}
                                            size={size}
                                            wrap={wrap}
                                        />
                                    )}
                                </Box>
                            </Box>
                        );

                    case 'ordered_list':
                        return (
                            <Box
                                className="flex items-baseline gap-1.5"
                                key={idx}
                                style={{
                                    paddingLeft: `${(node.depth ?? 0) * 1.5}rem`,
                                }}
                            >
                                <Text size={size} variant="muted" wrap={wrap}>
                                    {node.number}.
                                </Text>
                                <Box className="flex-1">
                                    {typeof node.content === 'string' ? (
                                        <Text key={idx} size={size} wrap={wrap}>
                                            {node.content}
                                        </Text>
                                    ) : (
                                        <ParsedText
                                            nodes={node.content}
                                            size={size}
                                            wrap={wrap}
                                        />
                                    )}
                                </Box>
                            </Box>
                        );

                    case 'table':
                        return (
                            <Table fullWidth={false} key={idx}>
                                <TableHeader>
                                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                                        {node.headers.map(
                                            (header, headerIdx) => (
                                                <TableHead key={headerIdx}>
                                                    {typeof header ===
                                                    'string' ? (
                                                        header
                                                    ) : (
                                                        <ParsedText
                                                            nodes={header}
                                                            size={size}
                                                            wrap={wrap}
                                                        />
                                                    )}
                                                </TableHead>
                                            ),
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {node.rows.map((row, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                            {row.map((cell, cellIdx) => (
                                                <TableCell key={cellIdx}>
                                                    {typeof cell ===
                                                    'string' ? (
                                                        cell
                                                    ) : (
                                                        <ParsedText
                                                            nodes={cell}
                                                            size={size}
                                                            wrap={wrap}
                                                        />
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        );

                    case 'latex':
                        return (
                            <LatexRenderer
                                displayMode
                                content={node.content}
                                key={idx}
                            />
                        );

                    case 'inline_latex':
                        return (
                            <LatexRenderer content={node.content} key={idx} />
                        );

                    case 'thematic_break':
                        return <Divider fullWidth className="my-2" key={idx} />;

                    case 'blockquote':
                        return (
                            <div
                                className={cn(
                                    'border-l-4 border-border-subtle pl-4 italic',
                                    !isNested && 'my-2',
                                )}
                                key={idx}
                            >
                                {typeof node.content === 'string' ? (
                                    <Text size={size} wrap={wrap}>
                                        {node.content}
                                    </Text>
                                ) : (
                                    <ParsedText
                                        isNested
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                )}
                            </div>
                        );

                    case 'admonition':
                        return (
                            <Admonition
                                isNested={isNested}
                                key={idx}
                                node={node}
                            >
                                {typeof node.content === 'string' ? (
                                    <Text size={size} wrap={wrap}>
                                        {node.content}
                                    </Text>
                                ) : node.content.length > 0 ? (
                                    <ParsedText
                                        isNested
                                        nodes={node.content}
                                        size={size}
                                        wrap={wrap}
                                    />
                                ) : null}
                            </Admonition>
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
