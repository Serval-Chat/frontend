import React, { memo, useEffect, useState } from 'react';

import { customSyntaxTheme } from '@/styles/syntax-theme';
import SyntaxWorker from '@/workers/syntax.worker?worker';

import { Modal } from './Modal';

interface CodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    language?: string;
}

interface AstNode {
    type: string;
    value?: string;
    tagName?: string;
    properties?: { className?: string[] };
    children?: AstNode[];
}

const AstRenderer: React.FC<{ nodes: AstNode[] }> = memo(({ nodes }) => (
    <>
        {nodes.map((node, i) => {
            if (node.type === 'text') {
                return node.value;
            }
            if (node.type === 'element' && node.tagName) {
                const Tag = node.tagName as keyof React.JSX.IntrinsicElements;
                const className = node.properties?.className?.join(' ');

                let style = {};
                if (node.properties?.className) {
                    for (const cls of node.properties.className) {
                        if (customSyntaxTheme[cls]) {
                            style = { ...style, ...customSyntaxTheme[cls] };
                        }
                        const short = cls.replace('token ', '');
                        if (customSyntaxTheme[short]) {
                            style = {
                                ...style,
                                ...customSyntaxTheme[short],
                            };
                        }
                    }
                }

                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <Tag className={className} key={i} style={style}>
                        <AstRenderer nodes={node.children || []} />
                    </Tag>
                );
            }
            return null;
        })}
    </>
));

export const CodeModal: React.FC<CodeModalProps> = memo(
    ({ isOpen, onClose, content, language = 'text' }) => {
        const [highlightedLines, setHighlightedLines] = useState<
            AstNode[][] | null
        >(null);

        useEffect(() => {
            if (isOpen) {
                const worker = new SyntaxWorker();

                worker.onmessage = (e) => {
                    setHighlightedLines(e.data);
                    worker.terminate();
                };

                worker.postMessage({
                    content,
                    language: language.toLowerCase(),
                });

                return () => {
                    worker.terminate();
                };
            }
        }, [isOpen, content, language]);

        const codeLines =
            highlightedLines ||
            content.split('\n').map((line) => [{ type: 'text', value: line }]);

        return (
            <Modal
                fullScreen
                noPadding
                isOpen={isOpen}
                title={language.toUpperCase()}
                onClose={onClose}
            >
                <div className="bg-background h-full flex flex-col overflow-auto custom-scrollbar">
                    <div className="flex-1 font-mono text-sm leading-6 py-4">
                        {codeLines.map((lineNodes, i) => (
                            <div
                                className="group flex hover:bg-white/5 transition-colors"
                                // eslint-disable-next-line react/no-array-index-key
                                key={i}
                            >
                                <div
                                    className="w-16 flex-shrink-0 select-none text-right pr-4 text-muted-foreground/50 border-r border-border-subtle/20 bg-bg-secondary/30 sticky left-0 z-[var(--z-content)]"
                                    style={{ textAlign: 'right' }}
                                >
                                    {i + 1}
                                </div>

                                <div
                                    className="flex-1 px-4 whitespace-pre-wrap break-all min-w-0"
                                    style={{
                                        ...customSyntaxTheme[
                                            'code[class*="language-"]'
                                        ],
                                        backgroundColor: 'transparent',
                                    }}
                                >
                                    <AstRenderer nodes={lineNodes} />
                                    {lineNodes.length === 0 && '\u200b'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        );
    },
);
