import { describe, expect, it, vi } from 'vitest';

import { tryExecuteSlashCommand } from './lexical/slashCommandExecution';

describe('tryExecuteSlashCommand', () => {
    const commands = [
        {
            id: 'cmd-1',
            name: 'poke',
            description: 'poke user',
            options: [
                {
                    type: 3,
                    name: 'target',
                    description: 'target',
                    required: true,
                },
            ],
        },
    ];

    it('executes known slash command in server context', async () => {
        const showToast = vi.fn();
        const createInteraction = vi.fn().mockResolvedValue({ success: true });
        const onSuccess = vi.fn();

        const result = await tryExecuteSlashCommand({
            text: '/poke alice',
            filesCount: 0,
            selectedServerId: 'server-1',
            selectedChannelId: 'channel-1',
            isServerRoute: true,
            serverCommands: commands,
            showToast,
            createInteraction,
            onSuccess,
        });

        expect(result).toEqual({ handled: true, success: true });
        expect(createInteraction).toHaveBeenCalledWith({
            command: 'poke',
            options: [{ name: 'target', value: 'alice' }],
            serverId: 'server-1',
            channelId: 'channel-1',
        });
        expect(onSuccess).toHaveBeenCalled();
    });

    it('blocks command usage in DMs', async () => {
        const showToast = vi.fn();

        const result = await tryExecuteSlashCommand({
            text: '/poke alice',
            filesCount: 0,
            selectedServerId: null,
            selectedChannelId: null,
            isServerRoute: false,
            serverCommands: commands,
            showToast,
            createInteraction: vi.fn(),
            onSuccess: vi.fn(),
        });

        expect(result).toEqual({ handled: true, success: false });
        expect(showToast).toHaveBeenCalledWith(
            'Slash commands can only be used in server channels.',
            'error',
        );
    });

    it('blocks unknown commands', async () => {
        const showToast = vi.fn();

        const result = await tryExecuteSlashCommand({
            text: '/unknown whatever',
            filesCount: 0,
            selectedServerId: 'server-1',
            selectedChannelId: 'channel-1',
            isServerRoute: true,
            serverCommands: commands,
            showToast,
            createInteraction: vi.fn(),
            onSuccess: vi.fn(),
        });

        expect(result).toEqual({ handled: true, success: false });
        expect(showToast).toHaveBeenCalledWith(
            'Command "/unknown" not found.',
            'error',
        );
    });

    it('blocks missing required options', async () => {
        const showToast = vi.fn();

        const result = await tryExecuteSlashCommand({
            text: '/poke',
            filesCount: 0,
            selectedServerId: 'server-1',
            selectedChannelId: 'channel-1',
            isServerRoute: true,
            serverCommands: commands,
            showToast,
            createInteraction: vi.fn(),
            onSuccess: vi.fn(),
        });

        expect(result).toEqual({ handled: true, success: false });
        expect(showToast).toHaveBeenCalledWith(
            'Missing required options for "/poke".',
            'error',
        );
    });

    it('blocks invalid option coercion', async () => {
        const showToast = vi.fn();
        const boolCommands = [
            {
                id: 'cmd-2',
                name: 'toggle',
                description: 'toggle setting',
                options: [
                    {
                        type: 5,
                        name: 'enabled',
                        description: 'enabled',
                        required: true,
                    },
                ],
            },
        ];

        const result = await tryExecuteSlashCommand({
            text: '/toggle maybe',
            filesCount: 0,
            selectedServerId: 'server-1',
            selectedChannelId: 'channel-1',
            isServerRoute: true,
            serverCommands: boolCommands,
            showToast,
            createInteraction: vi.fn(),
            onSuccess: vi.fn(),
        });

        expect(result).toEqual({ handled: true, success: false });
        expect(showToast).toHaveBeenCalledWith(
            'Option "enabled" has invalid value.',
            'error',
        );
    });
});
