import type { SlashCommand } from '@/api/interactions/interactions.api';

import { parseSlashInput } from './lexical/slashCommands';

export interface SlashPreview {
    commandName: string;
    status: string;
    usage?: string;
}

interface SlashChipState {
    commandName: string;
    commandId?: string;
    argValues: string[];
}

const buildUsage = (options: SlashCommand['options']): string =>
    options.length > 0
        ? options
              .map((option): string =>
                  option.required ? `<${option.name}>` : `[${option.name}]`,
              )
              .join(' ')
        : 'No arguments';

/**
 * computes the inline "/command - status - usage" preview shown under the
 * composer, from either a committed slash chip or the raw typed input.
 * Extracted from MessageInput to keep that component render-focused.
 */
export const getSlashPreview = (
    currentInputText: string,
    serverCommands: SlashCommand[],
    slashChipState: SlashChipState | null,
): SlashPreview | null => {
    if (slashChipState) {
        let command = slashChipState.commandId
            ? serverCommands.find(
                  (c): boolean => c.id === slashChipState.commandId,
              )
            : undefined;
        if (!command) {
            command = serverCommands.find(
                (c): boolean => c.name === slashChipState.commandName,
            );
        }
        if (!command) return null;

        const options = command.options ?? [];
        const requiredCount = options.filter(
            (o): boolean | undefined => o.required,
        ).length;
        const providedCount = slashChipState.argValues.filter(
            (v): boolean => (v ?? '').trim() !== '',
        ).length;
        const nextOption = options[providedCount];
        const usage = buildUsage(options);

        if (requiredCount > providedCount) {
            return {
                commandName: command.name,
                status: `Missing required arguments (${providedCount}/${requiredCount}). Next: ${nextOption?.name ?? 'argument'}`,
                usage,
            };
        }

        return {
            commandName: command.name,
            status:
                options.length > 0
                    ? `Arguments ready (${Math.min(providedCount, options.length)}/${options.length})`
                    : 'Ready to execute',
            usage,
        };
    }

    const parsed = parseSlashInput(currentInputText);
    if (!parsed) return null;
    const command = serverCommands.find(
        (c): boolean => c.name === parsed.commandName,
    );
    if (!command) {
        return {
            commandName: parsed.commandName,
            status: `Unknown command /${parsed.commandName}`,
        };
    }

    const options = command.options ?? [];
    const requiredCount = options.filter(
        (option): boolean | undefined => option.required,
    ).length;
    const providedCount = parsed.args.filter(
        (arg): boolean => arg.trim() !== '',
    ).length;
    const nextOption = options[Math.min(providedCount, options.length - 1)];
    const usage = buildUsage(options);

    if (requiredCount > providedCount) {
        return {
            commandName: command.name,
            status: `Missing required arguments (${providedCount}/${requiredCount}). Next: ${nextOption?.name ?? 'argument'}`,
            usage,
        };
    }

    return {
        commandName: command.name,
        status:
            options.length > 0
                ? `Arguments ready (${Math.min(providedCount, options.length)}/${options.length})`
                : 'Ready to execute',
        usage,
    };
};
