import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
} from 'lexical';
import type { TextNode } from 'lexical';

import type { SlashCommand } from '@/api/interactions/interactions.api';
import type { ServerMember } from '@/api/servers/servers.types';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import {
    $createSlashArgChipNode,
    focusSlashArgInput,
} from './SlashArgChipNode';
import {
    $createSlashCommandChipNode,
    CANCEL_SLASH_COMMAND,
} from './SlashCommandChipNode';
import { clearSlashChips } from './slashChipHelpers';

class SlashCommandOption extends MenuOption {
    type: 'command' | 'user';
    command?: SlashCommand;
    user?: ServerMember['user'];

    constructor(
        data:
            | { type: 'command'; command: SlashCommand }
            | {
                  type: 'user';
                  user: ServerMember['user'];
              },
    ) {
        super(
            data.type === 'command'
                ? `slash-cmd-${data.command.id}`
                : `slash-user-${data.user._id}`,
        );
        this.type = data.type;
        if (data.type === 'command') {
            this.command = data.command;
        } else {
            this.user = data.user;
        }
    }
}

interface MenuWrapperProps {
    selectedIndex: number | null;
    setHighlightedIndex: (index: number) => void;
    options: SlashCommandOption[];
    selectOptionAndCleanUp: (option: SlashCommandOption) => void;
}

const MenuWrapper = ({
    selectedIndex,
    setHighlightedIndex,
    options,
    selectOptionAndCleanUp,
}: MenuWrapperProps): React.ReactNode => {
    React.useEffect(() => {
        if (selectedIndex === null && options.length > 0) {
            setHighlightedIndex(0);
        }
    }, [options.length, selectedIndex, setHighlightedIndex]);

    return (
        <Box className="absolute right-0 bottom-full left-0 z-[var(--z-index-popover)] mx-4 mb-2 overflow-hidden rounded-lg border border-border-subtle bg-background shadow-lg backdrop-blur-md">
            <Box className="scrollbar-thin max-h-72 overflow-y-auto p-1">
                {options.map((option, index) => (
                    <Box
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 transition-colors',
                            index === (selectedIndex ?? 0)
                                ? 'text-primary-foreground bg-primary/15'
                                : 'hover:bg-white/5',
                        )}
                        key={option.key}
                        onClick={() => selectOptionAndCleanUp(option)}
                    >
                        <span
                            className={cn(
                                'truncate text-sm font-bold',
                                index === (selectedIndex ?? 0)
                                    ? 'text-primary'
                                    : 'text-foreground',
                            )}
                        >
                            {option.type === 'command'
                                ? `/${option.command?.name ?? ''}`
                                : option.user?.displayName ||
                                  option.user?.username}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {option.type === 'command'
                                ? option.command?.description
                                : `@${option.user?.username ?? ''}`}
                        </span>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

interface LexicalSlashCommandPluginProps {
    commands: SlashCommand[];
    members?: ServerMember[];
    enabled: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

export const LexicalSlashCommandPlugin: React.FC<
    LexicalSlashCommandPluginProps
> = ({ commands, enabled, onOpenChange }) => {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    useEffect(
        () =>
            editor.registerCommand(
                CANCEL_SLASH_COMMAND,
                () => {
                    editor.update(() => clearSlashChips());
                    return true;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
        [editor],
    );

    const options = useMemo(() => {
        if (!enabled || queryString === null) return [];
        if (!queryString.startsWith('cmd:')) return [];

        const query = queryString.slice(4).toLowerCase();
        return commands
            .filter((command) => command.name.toLowerCase().includes(query))
            .slice(0, 10)
            .map(
                (command) =>
                    new SlashCommandOption({ type: 'command', command }),
            );
    }, [commands, enabled, queryString]);

    const isOpen = enabled && queryString !== null && options.length > 0;

    React.useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    const matchTrigger = useCallback(
        (text: string) => {
            if (!enabled) return null;

            const commandMatch = text.match(/^\/([a-zA-Z0-9_-]{0,50})$/);
            if (commandMatch) {
                return {
                    leadOffset: 0,
                    matchingString: `cmd:${commandMatch[1]}`,
                    replaceableString: text,
                };
            }

            return null;
        },
        [enabled],
    );

    const onSelectOption = useCallback(
        (
            selectedOption: SlashCommandOption,
            nodeToRemove: TextNode | null,
            closeMenu: () => void,
        ) => {
            editor.update(() => {
                if (nodeToRemove) {
                    nodeToRemove.remove();
                }
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                if (
                    selectedOption.type !== 'command' ||
                    !selectedOption.command
                ) {
                    return;
                }

                const cmdOptions = selectedOption.command.options ?? [];
                const nodes = [
                    $createSlashCommandChipNode(
                        selectedOption.command.name,
                        selectedOption.command.id,
                    ),
                    ...cmdOptions.map((opt, i) =>
                        $createSlashArgChipNode(
                            opt.name,
                            i,
                            opt.required ?? false,
                            i === cmdOptions.length - 1,
                        ),
                    ),
                ];

                selection.insertNodes(nodes);

                if (cmdOptions.length > 0) {
                    setTimeout(() => focusSlashArgInput(editor, 0), 60);
                }

                closeMenu();
            });
        },
        [editor],
    );

    return (
        <LexicalTypeaheadMenuPlugin<SlashCommandOption>
            menuRenderFn={(
                _anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
            ) => {
                const menuOpen = options.length > 0;
                if (!menuOpen) return null;

                return (
                    <MenuWrapper
                        options={options}
                        selectOptionAndCleanUp={selectOptionAndCleanUp}
                        selectedIndex={selectedIndex}
                        setHighlightedIndex={setHighlightedIndex}
                    />
                );
            }}
            options={options}
            triggerFn={matchTrigger}
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
        />
    );
};
