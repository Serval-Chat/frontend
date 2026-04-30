import { $getRoot, $isParagraphNode, type LexicalEditor } from 'lexical';

import type { SlashCommand } from '@/api/interactions/interactions.api';

import { $isSlashArgChipNode } from './SlashArgChipNode';
import { $isSlashCommandChipNode } from './SlashCommandChipNode';
import { validateSlashCommand } from './slashCommands';

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
    argValues: string[];
} | null {
    const root = $getRoot();
    let commandName: string | null = null;
    const argValues: string[] = [];

    for (const child of root.getChildren()) {
        if (!$isParagraphNode(child)) continue;
        for (const node of child.getChildren()) {
            if ($isSlashCommandChipNode(node)) {
                commandName = node.getCommandName();
            } else if ($isSlashArgChipNode(node)) {
                argValues[node.getArgIndex()] = node.getValue();
            }
        }
    }

    if (commandName === null) return null;
    return { commandName, argValues };
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
        { commandName: chipState.commandName, args: chipState.argValues },
        commands,
    );
}
