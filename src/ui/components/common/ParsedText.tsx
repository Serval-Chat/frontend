/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { ChannelLink } from '@/ui/components/chat/ChannelLink';
import { FileEmbed } from '@/ui/components/chat/FileEmbed';
import { GifPlayer } from '@/ui/components/chat/GifPlayer';
import { InviteLink } from '@/ui/components/chat/InviteLink';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import type { ASTNode, ChecklistNode } from '@/utils/textParser/types';

import { Admonition } from './Admonition';
import { ChecklistGroup } from './ChecklistGroup';
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

const CodeBlock = React.lazy(() =>
    import('./CodeBlock').then((m) => ({ default: m.CodeBlock })),
);

const LatexRenderer = React.lazy(() =>
    import('./LatexRenderer').then((m) => ({ default: m.LatexRenderer })),
);

const MermaidChart = React.lazy(() =>
    import('./MermaidChart').then((m) => ({ default: m.MermaidChart })),
);

interface ParsedTextProps {
    nodes: ASTNode[];
    className?: string;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    condenseFiles?: boolean;
    condenseInvites?: boolean;
    largeEmojis?: boolean;
    wrap?: TextProps['wrap'];
    isNested?: boolean;
    variant?: TextProps['variant'];
    serverId?: string;
}

const countAttachments = (n: ASTNode): number => {
    let count = n.type === 'file' || n.type === 'klipy' ? 1 : 0;
    if ('content' in n && Array.isArray(n.content)) {
        count += n.content.reduce(
            (acc, curr) => acc + countAttachments(curr),
            0,
        );
    }
    if ('text' in n && Array.isArray(n.text)) {
        count += n.text.reduce((acc, curr) => acc + countAttachments(curr), 0);
    }
    return count;
};

const hasVisibleContentRecursively = (
    n: ASTNode,
    condenseFiles?: boolean,
): boolean => {
    if (n.type === 'file' || n.type === 'klipy') return !condenseFiles;
    if (n.type === 'text') return n.content.trim().length > 0;
    if ('content' in n && Array.isArray(n.content)) {
        return n.content.some((curr) =>
            hasVisibleContentRecursively(curr, condenseFiles),
        );
    }
    if ('text' in n && Array.isArray(n.text)) {
        return n.text.some((curr) =>
            hasVisibleContentRecursively(curr, condenseFiles),
        );
    }
    return true;
};

/**
 * @description Renders parsed text
 */
export const ParsedText = React.memo<ParsedTextProps>(
    ({
        nodes,
        className,
        size,
        condenseFiles,
        condenseInvites,
        largeEmojis,
        wrap,
        isNested,
        variant,
        serverId,
    }) => {
        const fileNodesCount = React.useMemo(
            () => nodes.reduce((acc, curr) => acc + countAttachments(curr), 0),
            [nodes],
        );

        const displayNodes = React.useMemo(
            () =>
                condenseFiles
                    ? nodes.filter(
                          (n) => n.type !== 'file' && n.type !== 'klipy',
                      )
                    : nodes,
            [nodes, condenseFiles],
        );

        const groupedNodes = React.useMemo(() => {
            type GroupedNode =
                | ASTNode
                | { type: '_cl_group'; items: ChecklistNode[] };
            const groups: GroupedNode[] = [];
            for (const node of displayNodes) {
                if (node.type === 'checklist') {
                    const last = groups[groups.length - 1];
                    if (last !== undefined && last.type === '_cl_group') {
                        last.items.push(node);
                    } else {
                        groups.push({ type: '_cl_group', items: [node] });
                    }
                } else {
                    groups.push(node);
                }
            }
            return groups;
        }, [displayNodes]);

        const hasVisibleContent = React.useMemo(
            () =>
                nodes.some((n) =>
                    hasVisibleContentRecursively(n, condenseFiles),
                ),
            [nodes, condenseFiles],
        );

        const nestedProps = React.useMemo(
            () => ({
                condenseFiles,
                condenseInvites,
                largeEmojis,
                isNested: true,
                size,
                wrap,
                variant,
                serverId,
            }),
            [
                condenseFiles,
                condenseInvites,
                largeEmojis,
                size,
                wrap,
                variant,
                serverId,
            ],
        );

        return (
            <span className={className}>
                {groupedNodes.map((item, idx) => {
                    if (item.type === '_cl_group') {
                        const { items } = item as {
                            type: '_cl_group';
                            items: ChecklistNode[];
                        };
                        return (
                            <ChecklistGroup
                                key={idx}
                                nodes={items}
                                renderContent={(node) =>
                                    typeof node.content === 'string' ? (
                                        <span>{node.content}</span>
                                    ) : (
                                        <ParsedText
                                            {...nestedProps}
                                            nodes={node.content}
                                        />
                                    )
                                }
                            />
                        );
                    }
                    const node = item as ASTNode;
                    switch (node.type) {
                        case 'text':
                            return (
                                <Text
                                    data-source={JSON.stringify(node.content)}
                                    key={idx}
                                    size={size}
                                    variant={variant}
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
                                    variant={variant}
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
                                    variant={variant}
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
                                    variant={variant}
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
                                    variant={variant}
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

                        case 'curly_underline':
                            return (
                                <Text
                                    className="curly-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'jagged_underline':
                            return (
                                <Text
                                    className="jagged-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'double_underline':
                            return (
                                <Text
                                    className="double-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'double_curly_underline':
                            return (
                                <Text
                                    className="double-curly-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'dashed_underline':
                            return (
                                <Text
                                    className="dashed-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'dotted_underline':
                            return (
                                <Text
                                    className="dotted-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'rhythm_underline':
                            return (
                                <Text
                                    className="rhythm-underline"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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

                        case 'superscript':
                            return (
                                <sup key={idx}>
                                    {typeof node.content === 'string' ? (
                                        node.content
                                    ) : (
                                        <ParsedText
                                            {...nestedProps}
                                            nodes={node.content}
                                        />
                                    )}
                                </sup>
                            );

                        case 'subscript':
                            return (
                                <sub key={idx}>
                                    {typeof node.content === 'string' ? (
                                        node.content
                                    ) : (
                                        <ParsedText
                                            {...nestedProps}
                                            nodes={node.content}
                                        />
                                    )}
                                </sub>
                            );

                        case 'stacked_script':
                            return (
                                <span className="stacked-script" key={idx}>
                                    <sup className="stacked-sup">
                                        {typeof node.sup === 'string' ? (
                                            node.sup
                                        ) : (
                                            <ParsedText
                                                {...nestedProps}
                                                nodes={node.sup}
                                            />
                                        )}
                                    </sup>
                                    <sub className="stacked-sub">
                                        {typeof node.sub === 'string' ? (
                                            node.sub
                                        ) : (
                                            <ParsedText
                                                {...nestedProps}
                                                nodes={node.sub}
                                            />
                                        )}
                                    </sub>
                                </span>
                            );

                        case 'strikethrough':
                            return (
                                <Text
                                    decoration="strike"
                                    key={idx}
                                    size={size}
                                    variant={variant}
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
                                    variant={variant || 'muted'}
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
                                <React.Suspense
                                    fallback={
                                        <span className="opacity-50">...</span>
                                    }
                                    key={idx}
                                >
                                    <CodeBlock inline content={node.content} />
                                </React.Suspense>
                            );

                        case 'code_block':
                            return (
                                <React.Suspense
                                    fallback={
                                        <div className="p-4 opacity-50">
                                            Loading code block...
                                        </div>
                                    }
                                    key={idx}
                                >
                                    <CodeBlock
                                        content={node.content}
                                        language={node.language}
                                    />
                                </React.Suspense>
                            );

                        case 'mermaid':
                            return (
                                <React.Suspense
                                    fallback={
                                        <div className="p-4 opacity-50">
                                            Loading chart...
                                        </div>
                                    }
                                    key={idx}
                                >
                                    <MermaidChart content={node.content} />
                                </React.Suspense>
                            );

                        case 'invite':
                            if (condenseInvites) {
                                return (
                                    <Link href={node.url} key={idx} size={size}>
                                        {node.url}
                                    </Link>
                                );
                            }
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
                            return (
                                <Mention
                                    key={idx}
                                    serverId={serverId}
                                    userId={node.userId}
                                />
                            );

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
                                        variant="inverse"
                                    >
                                        @everyone
                                    </Text>
                                </Box>
                            );

                        case 'checklist':
                            return null;

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
                                        variant={variant || 'muted'}
                                        wrap={wrap}
                                    >
                                        •
                                    </Text>
                                    <Box className="min-w-0 flex-1">
                                        {typeof node.content === 'string' ? (
                                            <Text
                                                key={idx}
                                                size={size}
                                                variant={variant}
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
                                        variant={variant || 'muted'}
                                        wrap={wrap}
                                    >
                                        {node.number}.
                                    </Text>
                                    <Box className="flex-1">
                                        {typeof node.content === 'string' ? (
                                            <Text
                                                key={idx}
                                                size={size}
                                                variant={variant}
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
                                <React.Suspense
                                    fallback={
                                        <span className="opacity-50">
                                            Loading math...
                                        </span>
                                    }
                                    key={idx}
                                >
                                    <LatexRenderer
                                        displayMode
                                        content={node.content}
                                    />
                                </React.Suspense>
                            );

                        case 'inline_latex':
                            return (
                                <React.Suspense
                                    fallback={
                                        <span className="opacity-50">
                                            Loading math...
                                        </span>
                                    }
                                    key={idx}
                                >
                                    <LatexRenderer content={node.content} />
                                </React.Suspense>
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
                                        <Text
                                            size={size}
                                            variant={variant}
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
                                        <Text
                                            size={size}
                                            variant={variant}
                                            wrap={wrap}
                                        >
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
    },
);

ParsedText.displayName = 'ParsedText';
