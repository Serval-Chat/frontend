import type { SlashCommand } from '@/api/interactions/interactions.api';
import type { InteractionValue } from '@/types/interactions';

export interface ParsedSlashInput {
    commandName: string;
    commandId?: string;
    args: string[];
}

export interface ValidatedSlashCommand {
    command: string;
    commandId?: string;
    options: { name: string; value: InteractionValue }[];
}

const STRING_TYPES = new Set([1, 2, 3, 7, 8, 9, 11]);
const NUMBER_TYPES = new Set([4, 10]);
const BOOLEAN_TYPES = new Set([5]);
const USER_TYPES = new Set([6]);

export function parseSlashInput(input: string): ParsedSlashInput | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;

    const raw = trimmed.slice(1).trim();
    if (!raw) return null;

    const tokens = tokenize(raw);
    if (tokens.length === 0) return null;

    return {
        commandName: tokens[0].toLowerCase(),
        args: tokens.slice(1),
    };
}

export function validateSlashCommand(
    parsed: ParsedSlashInput,
    commands: SlashCommand[],
): { ok: true; value: ValidatedSlashCommand } | { ok: false; error: string } {
    let command: SlashCommand | undefined;
    if (parsed.commandId) {
        command = commands.find((c): boolean => c.id === parsed.commandId);
    }
    if (!command) {
        command = commands.find((c): boolean => c.name === parsed.commandName);
    }
    if (!command) {
        return {
            ok: false,
            error: `Command "/${parsed.commandName}" not found.`,
        };
    }

    const definitions = command.options ?? [];
    const requiredCount = definitions.filter(
        (option): boolean | undefined => option.required,
    ).length;
    if (parsed.args.length < requiredCount) {
        return {
            ok: false,
            error: `Missing required options for "/${command.name}".`,
        };
    }

    const namedArgs = new Map<string, string>();
    const positionalArgs: string[] = [];
    for (const arg of parsed.args) {
        const namedMatch = arg.match(/^([a-zA-Z0-9_-]+)\s*[:=](.*)$/);
        if (namedMatch) {
            const name = namedMatch[1].toLowerCase();
            const value = namedMatch[2].trim();
            namedArgs.set(name, value);
        } else {
            positionalArgs.push(arg);
        }
    }

    const options: { name: string; value: InteractionValue }[] = [];
    let positionalIndex = 0;

    for (let i = 0; i < definitions.length; i += 1) {
        const definition = definitions[i];
        const namedValue = namedArgs.get(definition.name.toLowerCase());
        const rawArg =
            namedValue !== undefined
                ? namedValue
                : positionalArgs[positionalIndex];

        if (namedValue === undefined && rawArg !== undefined) {
            positionalIndex += 1;
        }

        if ((rawArg === undefined || rawArg === '') && definition.required) {
            return {
                ok: false,
                error: `Option "${definition.name}" is required.`,
            };
        }

        if (rawArg === undefined || rawArg === '') {
            continue;
        }

        const coerced = coerceOptionValue(rawArg, definition.type);
        if (coerced === null) {
            return {
                ok: false,
                error: `Option "${definition.name}" has invalid value.`,
            };
        }

        options.push({ name: definition.name, value: coerced });
    }

    return {
        ok: true,
        value: { command: command.name, commandId: command.id, options },
    };
}

function coerceOptionValue(
    value: string,
    optionType: number,
): InteractionValue | null {
    if (BOOLEAN_TYPES.has(optionType)) {
        const normalized = value.toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
        return null;
    }

    if (NUMBER_TYPES.has(optionType)) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (USER_TYPES.has(optionType)) {
        return normalizeUserId(value);
    }

    if (STRING_TYPES.has(optionType)) {
        return value;
    }

    return value;
}

function normalizeUserId(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const lexicalMention = trimmed.match(/^<userid:'([^']+)'>$/);
    if (lexicalMention) {
        return lexicalMention[1];
    }

    const discordMention = trimmed.match(/^<@!?([^>]+)>$/);
    if (discordMention) {
        return discordMention[1];
    }

    return trimmed;
}

function tokenize(input: string): string[] {
    const result: string[] = [];
    let current = '';
    let quote: '"' | "'" | null = null;

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];

        if (quote) {
            if (char === '\\' && i + 1 < input.length) {
                current += input[i + 1];
                i += 1;
                continue;
            }
            if (char === quote) {
                quote = null;
                continue;
            }
            current += char;
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        if (/\s/.test(char)) {
            if (current) {
                result.push(current);
                current = '';
            }
            continue;
        }

        current += char;
    }

    if (current) {
        result.push(current);
    }

    return result;
}
