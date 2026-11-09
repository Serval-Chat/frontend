import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Check, Copy, Download, ExternalLink, Maximize } from 'lucide-react';

import { buildGodboltUrl, getGodboltLanguageId } from '@/lib/godbolt';
import { addToCache, getCachedHighlight } from '@/lib/syntax-highlighter';
import { Button } from '@/ui/primitives/Button';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import SyntaxWorker from '@/workers/syntax.worker?worker';

import { type AstNode, AstRenderer, CodeModal } from './CodeModal';

interface CodeBlockProps {
    content: string;
    language?: string;
    inline?: boolean;
    filename?: string;
    onDownload?: () => void;
    maxLines?: number;
}

/**
 * @description Renders a code block in a modal
 */
export const CodeBlock = ({
    content,
    language,
    inline = false,
    filename,
    onDownload,
    maxLines,
}: CodeBlockProps) => {
    const languageKey = (language || 'text').toLowerCase();
    const [isCopied, setIsCopied] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [highlightedResult, setHighlightedResult] = useState<{
        content: string;
        language: string;
        lines: AstNode[][];
    } | null>(() => {
        if (inline) return null;
        const cached = getCachedHighlight(content, languageKey);
        if (cached) {
            return {
                content,
                language: languageKey,
                lines: cached,
            };
        }
        return null;
    });
    const lines = useMemo((): string[] => content.split('\n'), [content]);

    const godboltLanguageId = useMemo(
        () => getGodboltLanguageId(language ?? ''),
        [language],
    );

    const handleOpenGodbolt = useCallback(
        (e: React.MouseEvent): void => {
            e.stopPropagation();
            if (!godboltLanguageId) return;
            window.open(
                buildGodboltUrl(content, godboltLanguageId),
                '_blank',
                'noopener,noreferrer',
            );
        },
        [content, godboltLanguageId],
    );

    useEffect((): (() => void) | undefined => {
        if (inline) return;

        const cached = getCachedHighlight(content, languageKey);
        if (cached) {
            return;
        }

        const worker = new SyntaxWorker();

        worker.onmessage = (e): void => {
            const lines: AstNode[][] = e.data;
            addToCache(content, languageKey, lines);
            setHighlightedResult({
                content,
                language: languageKey,
                lines,
            });
            worker.terminate();
        };

        worker.postMessage({
            content,
            language: languageKey,
        });

        return (): void => {
            worker.terminate();
        };
    }, [content, inline, languageKey]);

    const highlightedLines =
        highlightedResult?.content === content &&
        highlightedResult.language === languageKey
            ? highlightedResult.lines
            : null;

    const handleCopy = (e: React.MouseEvent): void => {
        e.stopPropagation();
        void navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout((): void => {
            setIsCopied(false);
        }, 2000);
    };

    const handleOpenFullScreen = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const handleContainerClick = (): void => {
        const selection = globalThis.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        setIsModalOpen(true);
    };

    const displayLines = highlightedLines || lines;
    const isTruncatable =
        maxLines !== undefined && displayLines.length > maxLines;
    const visibleLines =
        isTruncatable && !isExpanded
            ? displayLines.slice(0, maxLines)
            : displayLines;

    if (inline) {
        return (
            <code className="rounded bg-bg-secondary px-1 py-0.5 font-mono text-sm">
                {content}
            </code>
        );
    }

    return (
        <>
            <div className="group relative my-2 overflow-hidden rounded-lg border border-border-subtle bg-background shadow-sm">
                <div className="flex items-center justify-between border-b border-border-subtle bg-bg-subtle px-3 py-2">
                    {filename ? (
                        <Text
                            className="truncate text-foreground/80"
                            size="xs"
                            weight="bold"
                        >
                            {filename}
                        </Text>
                    ) : (
                        <Text
                            className="text-[10px]"
                            tracking="wider"
                            transform="uppercase"
                            variant="primary"
                            weight="black"
                        >
                            {language || 'text'}
                        </Text>
                    )}
                    <div className="flex items-center gap-1">
                        {godboltLanguageId !== null && (
                            <>
                                <Button
                                    className="flex items-center gap-3 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition hover:bg-[hsl(25,95%,53%)]/10 hover:text-[hsl(25,95%,53%)]"
                                    size="sm"
                                    title="Try in Godbolt"
                                    variant="ghost"
                                    onClick={handleOpenGodbolt}
                                >
                                    <ExternalLink size={14} />
                                    <Text className="text-[10px]" weight="bold">
                                        TRY IN GODBOLT
                                    </Text>
                                </Button>
                                <div className="mx-1 h-3 w-[1px] bg-border-subtle" />
                            </>
                        )}
                        <Button
                            className="flex items-center gap-3 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition hover:bg-primary/10 hover:text-primary"
                            size="sm"
                            title="Full Screen"
                            variant="ghost"
                            onClick={handleOpenFullScreen}
                        >
                            <Maximize size={14} />
                            <Text className="text-[10px]" weight="bold">
                                FULL SCREEN
                            </Text>
                        </Button>
                        <div className="mx-1 h-3 w-[1px] bg-border-subtle" />
                        <Button
                            className="flex items-center gap-3 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition hover:bg-primary/10 hover:text-primary"
                            size="sm"
                            variant="ghost"
                            onClick={handleCopy}
                        >
                            {isCopied ? (
                                <Check className="text-success" size={14} />
                            ) : (
                                <Copy size={14} />
                            )}
                            <Text className="text-[10px]" weight="bold">
                                {isCopied ? 'COPIED' : 'COPY CODE'}
                            </Text>
                        </Button>
                        {onDownload ? (
                            <>
                                <div className="mx-1 h-3 w-[1px] bg-border-subtle" />
                                <Button
                                    className="flex items-center gap-3 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition hover:bg-primary/10 hover:text-primary"
                                    size="sm"
                                    title="Download"
                                    variant="ghost"
                                    onClick={(e): void => {
                                        e.stopPropagation();
                                        onDownload();
                                    }}
                                >
                                    <Download size={14} />
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>
                <Pressable
                    className="custom-scrollbar block w-full cursor-pointer overflow-hidden border-0 bg-bg-secondary/50 p-0 text-left font-mono text-sm"
                    onClick={handleContainerClick}
                >
                    <pre className="m-0 overflow-x-auto bg-transparent text-sm leading-6 whitespace-pre-wrap">
                        {visibleLines.map((line, index) => (
                            <div
                                className="flex"
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${index}-${line.length}`}
                            >
                                <Text
                                    align="right"
                                    className="code-block-line-number mr-4 min-w-12 border-r border-border-subtle pr-3 text-muted-foreground/50 select-none"
                                >
                                    {index + 1}
                                </Text>
                                <code className="min-w-0 flex-1 break-all text-foreground">
                                    {Array.isArray(line) ? (
                                        <>
                                            <AstRenderer nodes={line} />
                                            {line.length === 0
                                                ? '\u200B'
                                                : null}
                                        </>
                                    ) : (
                                        line || '\u200B'
                                    )}
                                </code>
                            </div>
                        ))}
                    </pre>
                </Pressable>
                {isTruncatable ? (
                    <div className="flex justify-center border-t border-border-subtle bg-bg-subtle px-3 py-2">
                        <Button
                            className="border-none bg-transparent text-[11px] font-bold text-primary shadow-none transition-colors hover:text-primary-hover"
                            size="sm"
                            variant="ghost"
                            onClick={(e): void => {
                                e.stopPropagation();
                                setIsExpanded((prev) => !prev);
                            }}
                        >
                            {isExpanded
                                ? 'Show fewer lines'
                                : `Show ${displayLines.length - (maxLines ?? 0)} more lines`}
                        </Button>
                    </div>
                ) : null}
            </div>

            {isModalOpen ? (
                <CodeModal
                    isOpen
                    content={content}
                    language={language}
                    onClose={(): void => {
                        setIsModalOpen(false);
                    }}
                />
            ) : null}
        </>
    );
};
