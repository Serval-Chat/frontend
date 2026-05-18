import { describe, expect, it } from 'vitest';

import { parseSlashInput, validateSlashCommand } from './slashCommands';

describe('slashCommands parser', () => {
    it('parses command and quoted arguments', () => {
        const parsed = parseSlashInput('/poke "hello world" true');
        expect(parsed).toEqual({
            commandName: 'poke',
            args: ['hello world', 'true'],
        });
    });

    it('returns null for non-slash text', () => {
        expect(parseSlashInput('hello world')).toBeNull();
    });
});

describe('slashCommands validator', () => {
    const commands = [
        {
            id: 'cmd1',
            name: 'poke',
            description: 'poke someone',
            options: [
                {
                    type: 3,
                    name: 'target',
                    description: 'target',
                    required: true,
                },
                {
                    type: 5,
                    name: 'silent',
                    description: 'silent',
                    required: false,
                },
                {
                    type: 4,
                    name: 'count',
                    description: 'count',
                    required: false,
                },
            ],
        },
    ];

    it('validates and coerces values', () => {
        const result = validateSlashCommand(
            { commandName: 'poke', args: ['alice', 'false', '2'] },
            commands,
        );
        expect(result).toEqual({
            ok: true,
            value: {
                command: 'poke',
                commandId: 'cmd1',
                options: [
                    { name: 'target', value: 'alice' },
                    { name: 'silent', value: false },
                    { name: 'count', value: 2 },
                ],
            },
        });
    });

    it('supports named option assignment with equals', () => {
        const result = validateSlashCommand(
            {
                commandName: 'poke',
                args: ['silent=true', 'target=bob', 'count=3'],
            },
            commands,
        );
        expect(result).toEqual({
            ok: true,
            value: {
                command: 'poke',
                commandId: 'cmd1',
                options: [
                    { name: 'target', value: 'bob' },
                    { name: 'silent', value: true },
                    { name: 'count', value: 3 },
                ],
            },
        });
    });

    it('supports named option assignment with colon', () => {
        const result = validateSlashCommand(
            {
                commandName: 'poke',
                args: ['target:alice', 'silent:false'],
            },
            commands,
        );
        expect(result).toEqual({
            ok: true,
            value: {
                command: 'poke',
                commandId: 'cmd1',
                options: [
                    { name: 'target', value: 'alice' },
                    { name: 'silent', value: false },
                ],
            },
        });
    });

    it('rejects missing required options', () => {
        const result = validateSlashCommand(
            { commandName: 'poke', args: [] },
            commands,
        );
        expect(result).toEqual({
            ok: false,
            error: 'Missing required options for "/poke".',
        });
    });

    it('rejects invalid boolean coercion', () => {
        const result = validateSlashCommand(
            { commandName: 'poke', args: ['alice', 'maybe'] },
            commands,
        );
        expect(result).toEqual({
            ok: false,
            error: 'Option "silent" has invalid value.',
        });
    });

    it('normalizes lexical mention to user id for user options', () => {
        const userCommand = [
            {
                id: 'cmd2',
                name: 'inspect',
                description: 'inspect user',
                options: [
                    {
                        type: 6,
                        name: 'target',
                        description: 'target',
                        required: true,
                    },
                ],
            },
        ];
        const result = validateSlashCommand(
            {
                commandName: 'inspect',
                args: ["<userid:'507f1f77bcf86cd799439011'>"],
            },
            userCommand,
        );
        expect(result).toEqual({
            ok: true,
            value: {
                command: 'inspect',
                commandId: 'cmd2',
                options: [
                    { name: 'target', value: '507f1f77bcf86cd799439011' },
                ],
            },
        });
    });

    it('normalizes discord mention to user id for user options', () => {
        const userCommand = [
            {
                id: 'cmd2',
                name: 'inspect',
                description: 'inspect user',
                options: [
                    {
                        type: 6,
                        name: 'target',
                        description: 'target',
                        required: true,
                    },
                ],
            },
        ];
        const result = validateSlashCommand(
            { commandName: 'inspect', args: ['<@123456789>'] },
            userCommand,
        );
        expect(result).toEqual({
            ok: true,
            value: {
                command: 'inspect',
                commandId: 'cmd2',
                options: [{ name: 'target', value: '123456789' }],
            },
        });
    });

    it('prefers matching command by commandId when multiple have the same name', () => {
        const multipleCommands = [
            {
                id: 'cmdA',
                name: 'about',
                description: 'First Bot About',
                options: [],
            },
            {
                id: 'cmdB',
                name: 'about',
                description: 'Second Bot About',
                options: [],
            },
        ];
        const result = validateSlashCommand(
            { commandName: 'about', commandId: 'cmdB', args: [] },
            multipleCommands,
        );
        expect(result).toEqual({
            ok: true,
            value: {
                command: 'about',
                commandId: 'cmdB',
                options: [],
            },
        });
    });
});
