import React from 'react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { customSyntaxTheme } from '@/styles/syntax-theme';

import { Modal } from './Modal';

interface CodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    language?: string;
}

/**
 * @description Modal for code
 */
export const CodeModal: React.FC<CodeModalProps> = ({
    isOpen,
    onClose,
    content,
    language = 'text',
}) => (
    <Modal
        noPadding
        className="max-w-4xl"
        isOpen={isOpen}
        title={language.toUpperCase()}
        onClose={onClose}
    >
        <div className="bg-background h-full">
            <SyntaxHighlighter
                showLineNumbers
                customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    backgroundColor: 'transparent',
                }}
                language={language.toLowerCase()}
                lineNumberStyle={{
                    minWidth: '2.5em',
                    paddingRight: '1em',
                    color: '#858585',
                    textAlign: 'right',
                    userSelect: 'none',
                }}
                style={customSyntaxTheme}
            >
                {content}
            </SyntaxHighlighter>
        </div>
    </Modal>
);
