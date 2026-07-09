import React from 'react';

import type { LexicalEditor } from 'lexical';

import { CANCEL_SLASH_COMMAND } from './slashChipHelpers';

export interface SlashCommandChipProps {
    commandName: string;
    editor: LexicalEditor;
}

export const SlashCommandChipComponent = ({
    commandName,
    editor,
}: SlashCommandChipProps) => {
    const handleCancel = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        editor.dispatchCommand(CANCEL_SLASH_COMMAND, undefined);
    };

    return (
        <span
            className="slash-command-chip mx-0.5 inline-flex items-center gap-1 rounded-md bg-primary/20 px-1.5 py-0.5 align-middle text-sm font-semibold text-primary ring-1 ring-primary/40 select-none"
            contentEditable={false}
            style={{ userSelect: 'none', verticalAlign: 'middle' }}
        >
            <span>/{commandName}</span>
            <button
                aria-label="Cancel slash command"
                className="flex h-3.5 w-3.5 items-center justify-center rounded-sm text-primary/70 transition-colors hover:bg-primary/30 hover:text-primary"
                type="button"
                onClick={handleCancel}
            >
                <svg
                    fill="none"
                    height="8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    viewBox="0 0 8 8"
                    width="8"
                >
                    <path d="M1 1l6 6M7 1L1 7" />
                </svg>
            </button>
        </span>
    );
};
