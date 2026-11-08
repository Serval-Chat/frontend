import {
    $getRoot,
    $isParagraphNode,
    type LexicalEditor,
    type LexicalNode,
    createCommand,
} from 'lexical';

import type { SlashCommand } from '@/api/interactions/interactions.api';

// type-only: SlashArgChipNode.ts and SlashCommandChipNode.ts each import their
// Component counterpart (for decorate()), and the Components import the type
// guards below. Importing the node classes as values here would complete the
// cycle; `getType()` string checks let this stay type-only instead.
import type { SlashArgChipNode } from './SlashArgChipNode';
import type { SlashCommandChipNode } from './SlashCommandChipNode';
import { validateSlashCommand } from './slashCommands';

export const SLASH_ARG_INPUT_ATTR = 'data-slash-arg-idx';

export function focusSlashArgInput(editor: LexicalEditor, index: number): void {
    const root = editor.getRootElement();
    if (!root) return;
    const input = root.querySelector<HTMLInputElement>(
        `[${SLASH_ARG_INPUT_ATTR}="${index}"]`,
    );
    if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
    }
}

export function $isSlashArgChipNode(
    node: LexicalNode | null | undefined,
): node is SlashArgChipNode {
    return node?.getType() === 'slash-arg-chip';
}

/**
 * dispatch this command to cancel the active slash command and clear all chips.
 * The handler is registered in LexicalSlashCommandPlugin to avoid circular deps.
 */
export const CANCEL_SLASH_COMMAND = createCommand<void>('CANCEL_SLASH_COMMAND');

export function $isSlashCommandChipNode(
    node: LexicalNode | null | undefined,
): node is SlashCommandChipNode {
    return node?.getType() === 'slash-command-chip';
}

/**
 * Must be called inside `editor.update()`.
 * Removes all slash-command and slash-arg chip nodes from the editor.
 */
export function clearSlashChips(): void {
    const root = $getRoot();
    for (const child of root.getChildren()) {
        if (!$isParagraphNode(child)) continue;
        for (const node of child.getChildren()) {
            if ($isSlashCommandChipNode(node) || $isSlashArgChipNode(node)) {
                node.remove();
            }
        }
    }
}

/**
 * Must be called inside `editor.getEditorState().read(...)`.
 * Returns the current slash-chip state, or null if no command chip is present.
 */
export function $getSlashChipState(): {
    commandName: string;
    commandId?: string;
    argValues: string[];
} | null {
    const root = $getRoot();
    let commandName: string | null = null;
    let commandId: string | undefined = undefined;
    const argValues: string[] = [];

    for (const child of root.getChildren()) {
        if (!$isParagraphNode(child)) continue;
        for (const node of child.getChildren()) {
            if ($isSlashCommandChipNode(node)) {
                commandName = node.getCommandName();
                commandId = node.getCommandId();
            } else if ($isSlashArgChipNode(node)) {
                argValues[node.getArgIndex()] = node.getValue();
            }
        }
    }

    if (commandName === null) return null;
    return { commandName, commandId, argValues };
}

/**
 * Reads chip values from the editor and runs validation.
 * Returns null when the editor is not in chip mode (no SlashCommandChipNode present).
 */
export function getSlashChipPayload(
    editor: LexicalEditor,
    commands: SlashCommand[],
): ReturnType<typeof validateSlashCommand> | null {
    const chipState = editor.getEditorState().read($getSlashChipState);
    if (!chipState) return null;

    return validateSlashCommand(
        {
            commandName: chipState.commandName,
            commandId: chipState.commandId,
            args: chipState.argValues,
        },
        commands,
    );
}
