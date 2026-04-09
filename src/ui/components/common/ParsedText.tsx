/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { ChannelLink } from '@/ui/components/chat/ChannelLink';
import { FileEmbed } from '@/ui/components/chat/FileEmbed';
import { GifPlayer } from '@/ui/components/chat/GifPlayer';
import { InviteLink } from '@/ui/components/chat/InviteLink';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import type { ASTNode } from '@/utils/textParser/types';

import { Admonition } from './Admonition';
import { CodeBlock } from './CodeBlock';
import { Divider } from './Divider';
import { Heading } from './Heading';
import { Link } from './Link';
import { Mention } from './Mention';
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

const MermaidChart = React.lazy(() =>
    import('./MermaidChart').then((m) => ({ default: m.MermaidChart })),
);
const LatexRenderer = React.lazy(() =>
    import('./LatexRenderer').then((m) => ({ default: m.LatexRenderer })),
);

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
    const countAttachments = (n: ASTNode): number => {
        let count = n.type === 'file' || n.type === 'klipy' ? 1 : 0;
        if ('content' in n && Array.isArray(n.content)) {
            count += n.content.reduce(
                (acc, curr) => acc + countAttachments(curr),
                0,
            );
        }
        if ('text' in n && Array.isArray(n.text)) {
            count += n.text.reduce(
                (acc, curr) => acc + countAttachments(curr),
                0,
            );
        }
        return count;
    };

    const hasVisibleContentRecursively = (n: ASTNode): boolean => {
        if (n.type === 'file' || n.type === 'klipy') return !condenseFiles;
        if (n.type === 'text') return n.content.trim().length > 0;
        if ('content' in n && Array.isArray(n.content)) {
            return n.content.some(hasVisibleContentRecursively);
        }
        if ('text' in n && Array.isArray(n.text)) {
            return n.text.some(hasVisibleContentRecursively);
        }
        return true;
    };

    const fileNodesCount = nodes.reduce(
        (acc, curr) => acc + countAttachments(curr),
        0,
    );
    const displayNodes = condenseFiles
        ? nodes.filter((n) => n.type !== 'file' && n.type !== 'klipy')
        : nodes;

    const hasVisibleContent = nodes.some(hasVisibleContentRecursively);

    const nestedProps = {
        condenseFiles,
        largeEmojis,
        isNested: true,
        size,
        wrap,
    };

    return (
        <span className={className}>
            <React.Suspense fallback={null}>
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.text}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                <MermaidChart
                                    content={node.content}
                                    key={idx}
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
                            return (
                                <RoleMention key={idx} roleId={node.roleId} />
                            );

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
                                    <Text
                                        size={size}
                                        variant="muted"
                                        wrap={wrap}
                                    >
                                        •
                                    </Text>
                                    <Box className="min-w-0 flex-1">
                                        {typeof node.content === 'string' ? (
                                            <Text
                                                key={idx}
                                                size={size}
                                                wrap={wrap}
                                            >
                                                {node.content}
                                            </Text>
                                        ) : (
                                            <ParsedText
                                                {...nestedProps}
                                                nodes={node.content}
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
                                    <Text
                                        size={size}
                                        variant="muted"
                                        wrap={wrap}
                                    >
                                        {node.number}.
                                    </Text>
                                    <Box className="flex-1">
                                        {typeof node.content === 'string' ? (
                                            <Text
                                                key={idx}
                                                size={size}
                                                wrap={wrap}
                                            >
                                                {node.content}
                                            </Text>
                                        ) : (
                                            <ParsedText
                                                {...nestedProps}
                                                nodes={node.content}
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
                                                                {...nestedProps}
                                                                nodes={header}
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
                                                                {...nestedProps}
                                                                nodes={cell}
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
                                <LatexRenderer
                                    content={node.content}
                                    key={idx}
                                />
                            );

                        case 'thematic_break':
                            return (
                                <Divider fullWidth className="my-2" key={idx} />
                            );

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
                                            {...nestedProps}
                                            nodes={node.content}
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
                                            {...nestedProps}
                                            nodes={node.content}
                                        />
                                    ) : null}
                                </Admonition>
                            );

                        case 'klipy':
                            return (
                                <GifPlayer
                                    key={idx}
                                    klipyId={node.klipyId}
                                    url={node.url}
                                />
                            );

                        default:
                            return null;
                    }
                })}
            </React.Suspense>
            {condenseFiles &&
                fileNodesCount > 0 &&
                !hasVisibleContent &&
                !isNested && (
                    <span className="ml-1 text-[11px] italic opacity-80">
                        Attachments: {fileNodesCount}
                    </span>
                )}
        </span>
    );
};
