import React, { useEffect, useMemo, useState } from 'react';

import { Check, Copy, Maximize } from 'lucide-react';

import SyntaxWorker from '@/workers/syntax.worker?worker';

import { Button } from './Button';
import { type AstNode, AstRenderer, CodeModal } from './CodeModal';

interface CodeBlockProps {
    content: string;
    language?: string;
    inline?: boolean;
}

/**
 * @description Renders a code block in a modal
 */
export const CodeBlock = ({
    content,
    language,
    inline = false,
}: CodeBlockProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [highlightedResult, setHighlightedResult] = useState<{
        content: string;
        language: string;
        lines: AstNode[][];
    } | null>(null);
    const lines = useMemo((): string[] => content.split('\n'), [content]);
    const languageKey = (language || 'text').toLowerCase();

    useEffect((): (() => void) | undefined => {
        if (inline) return;

        const worker = new SyntaxWorker();

        worker.onmessage = (e): void => {
            setHighlightedResult({
                content,
                language: languageKey,
                lines: e.data,
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
        setTimeout((): void => setIsCopied(false), 2000);
    };

    const handleOpenFullScreen = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const handleContainerClick = (): void => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }
        setIsModalOpen(true);
    };

    if (inline) {
        return (
            <code className="rounded bg-bg-secondary px-1 py-0.5 font-mono text-sm">
                {content}
            </code>
        );
    }

    return (
        <>
            <div
                aria-label="View code block"
                className="group relative my-2 cursor-pointer overflow-hidden rounded-lg border border-border-subtle bg-background shadow-sm"
                role="button"
                tabIndex={0}
                onClick={handleContainerClick}
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsModalOpen(true);
                    }
                }}
            >
                <div className="flex items-center justify-between border-b border-border-subtle bg-bg-subtle px-3 py-2">
                    <span className="text-[10px] font-black tracking-wider text-primary uppercase">
                        {language || 'text'}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            className="flex items-center gap-3 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition-all hover:bg-primary/10 hover:text-primary"
                            size="sm"
                            title="Full Screen"
                            variant="ghost"
                            onClick={handleOpenFullScreen}
                        >
                            <Maximize size={14} />
                            <span className="text-[10px] font-bold">
                                FULL SCREEN
                            </span>
                        </Button>
                        <div className="mx-1 h-3 w-[1px] bg-border-subtle" />
                        <Button
                            className="flex items-center gap-3 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition-all hover:bg-primary/10 hover:text-primary"
                            size="sm"
                            variant="ghost"
                            onClick={handleCopy}
                        >
                            {isCopied ? (
                                <Check className="text-success" size={14} />
                            ) : (
                                <Copy size={14} />
                            )}
                            <span className="text-[10px] font-bold">
                                {isCopied ? 'COPIED' : 'COPY CODE'}
                            </span>
                        </Button>
                    </div>
                </div>
                <div className="custom-scrollbar overflow-hidden bg-bg-secondary/50 p-0 font-mono text-sm">
                    <pre className="m-0 overflow-x-auto bg-transparent p-4 text-sm leading-6 whitespace-pre-wrap">
                        {(highlightedLines || lines).map((line, index) => (
                            <div
                                className="flex"
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${index}-${line.length}`}
                            >
                                <span className="code-block-line-number mr-4 min-w-12 border-r border-border-subtle pr-3 text-right text-muted-foreground/50 select-none">
                                    {index + 1}
                                </span>
                                <code className="min-w-0 flex-1 break-all text-foreground">
                                    {Array.isArray(line) ? (
                                        <>
                                            <AstRenderer nodes={line} />
                                            {line.length === 0 && '\u200b'}
                                        </>
                                    ) : (
                                        line || '\u200b'
                                    )}
                                </code>
                            </div>
                        ))}
                    </pre>
                </div>
            </div>

            <CodeModal
                content={content}
                isOpen={isModalOpen}
                language={language}
                onClose={(): void => setIsModalOpen(false)}
            />
        </>
    );
};
