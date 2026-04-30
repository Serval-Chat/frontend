import React, { useEffect, useRef } from 'react';

import { $getNodeByKey, KEY_ENTER_COMMAND, type LexicalEditor } from 'lexical';

import { cn } from '@/utils/cn';

import {
    $isSlashArgChipNode,
    SLASH_ARG_INPUT_ATTR,
    focusSlashArgInput,
} from './SlashArgChipNode';

export interface SlashArgChipProps {
    argName: string;
    argIndex: number;
    required: boolean;
    value: string;
    isLast: boolean;
    nodeKey: string;
    editor: LexicalEditor;
}

export const SlashArgChipComponent: React.FC<SlashArgChipProps> = ({
    argName,
    argIndex,
    required,
    value,
    isLast,
    nodeKey,
    editor,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (argIndex === 0) {
            const id = setTimeout(() => inputRef.current?.focus(), 30);
            return () => clearTimeout(id);
        }
    }, [argIndex]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newValue = e.target.value;
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isSlashArgChipNode(node)) {
                node.setValue(newValue);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
                if (argIndex > 0) {
                    focusSlashArgInput(editor, argIndex - 1);
                } else {
                    editor.getRootElement()?.focus();
                }
            } else if (!isLast) {
                focusSlashArgInput(editor, argIndex + 1);
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            if (!isLast) {
                focusSlashArgInput(editor, argIndex + 1);
            } else {
                const root = editor.getRootElement();
                if (root) root.focus();
                editor.dispatchCommand(KEY_ENTER_COMMAND, e.nativeEvent);
            }
            return;
        }

        if (e.key === 'ArrowRight' && isLast) {
            const input = inputRef.current;
            if (input && input.selectionStart === input.value.length) {
                e.preventDefault();
                e.stopPropagation();
                const root = editor.getRootElement();
                if (root) {
                    root.focus();
                }
            }
        }
    };

    const placeholder = required ? `<${argName}>` : `[${argName}]`;

    return (
        <span
            className={cn(
                'slash-arg-chip mx-0.5 inline-grid rounded-md px-1.5 py-0.5 align-middle text-sm ring-1 select-none',
                'bg-muted/40 ring-border-subtle',
            )}
            contentEditable={false}
            style={{ userSelect: 'none', verticalAlign: 'middle' }}
        >
            <span
                className="flex items-center gap-0.5"
                style={{ gridArea: '1/1' }}
            >
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {argName}
                    {required && <span className="text-danger">*</span>}
                    :&nbsp;
                </span>
                <span className="relative inline-grid">
                    <span
                        aria-hidden
                        className="invisible max-w-[200px] min-w-[4ch] overflow-hidden text-sm whitespace-pre"
                        style={{ gridArea: '1/1/2/2' }}
                    >
                        {value || placeholder}
                    </span>
                    <input
                        ref={inputRef}
                        {...{ [SLASH_ARG_INPUT_ATTR]: argIndex }}
                        className="w-full max-w-[200px] min-w-[4ch] bg-transparent text-sm text-foreground caret-primary outline-none placeholder:text-muted-foreground/50"
                        placeholder={placeholder}
                        style={{ gridArea: '1/1/2/2' }}
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                    />
                </span>
            </span>
        </span>
    );
};
