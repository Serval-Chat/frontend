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
            <code className="rounded bg-bg-secondary px-1 py-0.5 font-mono text-sm">
                {content}
            </code>
        );
    }

    return (
        <>
            <div
                className="group relative my-2 cursor-pointer overflow-hidden rounded-lg border border-border-subtle bg-background shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                role="button"
                tabIndex={0}
                onClick={() => setIsModalOpen(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsModalOpen(true);
                    }
                }}
            >
                <div className="flex items-center justify-between border-b border-border-subtle bg-bg-subtle px-3 py-2 transition-colors group-hover:bg-bg-secondary">
                    <span className="text-[10px] font-black tracking-wider text-primary uppercase">
                        {language || 'text'}
                    </span>
                    <Button
                        className="flex items-center gap-2 rounded-md border-none p-1.5 text-muted-foreground shadow-none transition-all hover:bg-primary/10 hover:text-primary"
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
                <div className="custom-scrollbar overflow-x-auto bg-black/10 p-0 font-mono text-sm">
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
