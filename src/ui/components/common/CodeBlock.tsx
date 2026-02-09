import React, { useState } from 'react';

import { Check, Copy } from 'lucide-react';
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

    if (inline) {
        return (
            <code className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] font-mono text-sm">
                {content}
            </code>
        );
    }

    return (
        <>
            <div
                className="group relative my-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] overflow-hidden cursor-pointer hover:border-[var(--color-primary/40)] transition-all duration-200 shadow-sm hover:shadow-md"
                role="button"
                tabIndex={0}
                onClick={() => setIsModalOpen(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsModalOpen(true);
                    }
                }}
            >
                <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border-subtle)] group-hover:bg-[var(--color-bg-secondary)] transition-colors">
                    <span className="text-[10px] uppercase font-black tracking-wider text-[var(--color-primary)]">
                        {language || 'text'}
                    </span>
                    <Button
                        className="p-1.5 rounded-md hover:bg-[var(--color-primary/10)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-all flex items-center gap-2 border-none shadow-none"
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                    >
                        {isCopied ? (
                            <Check
                                className="text-[var(--color-success)]"
                                size={14}
                            />
                        ) : (
                            <Copy size={14} />
                        )}
                        <span className="text-[10px] font-bold">
                            {isCopied ? 'COPIED' : 'COPY CODE'}
                        </span>
                    </Button>
                </div>
                <div className="p-0 font-mono text-sm overflow-x-auto custom-scrollbar bg-black/10">
                    <SyntaxHighlighter
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            backgroundColor: 'transparent',
                        }}
                        language={(language || 'text').toLowerCase()}
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
