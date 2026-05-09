import React, { useState } from 'react';

import { Check, Copy, Maximize } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { customSyntaxTheme } from '@/styles/syntax-theme';

import { Button } from './Button';
import { CodeModal } from './CodeModal';

interface CodeBlockProps {
    content: string;
    language?: string;
    inline?: boolean;
}

/**
 * @description Renders a code block in a modal
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
    content,
    language,
    inline = false,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCopy = (e: React.MouseEvent): void => {
        e.stopPropagation();
        void navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
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
                className="group relative my-2 cursor-pointer overflow-hidden rounded-lg border border-border-subtle bg-background shadow-sm"
                role="button"
                tabIndex={0}
                onClick={handleContainerClick}
                onKeyDown={(e) => {
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
                    <SyntaxHighlighter
                        showLineNumbers
                        wrapLines
                        wrapLongLines
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.5rem',
                            backgroundColor: 'transparent',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                        }}
                        language={(language || 'text').toLowerCase()}
                        lineNumberStyle={{
                            minWidth: '3.5em',
                            paddingRight: '1em',
                            textAlign: 'right',
                            userSelect: 'none',
                            opacity: 0.5,
                            borderRight: '1px solid var(--color-border-subtle)',
                            marginRight: '1em',
                            height: 'auto',
                            display: 'inline-block',
                        }}
                        lineProps={{
                            style: {
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                display: 'flex',
                                width: '100%',
                            },
                        }}
                        linenumberclassname="code-block-line-number"
                        linetagname="div"
                        style={customSyntaxTheme}
                    >
                        {content}
                    </SyntaxHighlighter>
                </div>
            </div>

            <CodeModal
                content={content}
                isOpen={isModalOpen}
                language={language}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};
