import { BOT_PERMISSION_KEYS } from '@/types/bot';
import type { BotPermissions } from '@/types/bot';

import {
    BOT_PERMISSION_BITS,
    bitmaskToPermissions,
    permissionsToBitmask,
} from './botPermissions';

describe('botPermissions utility', (): void => {
    const makePermissions = (value: boolean): BotPermissions =>
        Object.fromEntries(
            BOT_PERMISSION_KEYS.map(
                (
                    key,
                ): [
                    (
                        | 'readMessages'
                        | 'sendMessages'
                        | 'manageMessages'
                        | 'readUsers'
                        | 'joinServers'
                        | 'manageServer'
                        | 'manageChannels'
                        | 'manageMembers'
                        | 'readReactions'
                        | 'addReactions'
                        | 'viewChannels'
                        | 'connect'
                        | 'deleteMessagesOfOthers'
                        | 'manageRoles'
                        | 'banMembers'
                        | 'kickMembers'
                        | 'manageInvites'
                        | 'administrator'
                        | 'manageWebhooks'
                        | 'pingRolesAndEveryone'
                        | 'manageReactions'
                        | 'exportChannelMessages'
                        | 'bypassSlowmode'
                        | 'pinMessages'
                        | 'seeDeletedMessages'
                        | 'moderateMembers'
                        | 'manageStickers'
                    ),
                    boolean,
                ] => [key, value],
            ),
        ) as BotPermissions;

    const allOn = makePermissions(true);

    const allOff = makePermissions(false);

    const partial: BotPermissions = {
        ...allOff,
        readMessages: true,
        sendMessages: true,
        manageServer: true,
        manageRoles: true,
        exportChannelMessages: true,
    };

    test('permissionsToBitmask should convert all true to correct bitmask', (): void => {
        const expected = Object.values(BOT_PERMISSION_BITS).reduce(
            (a, b): number => a | b,
            0,
        );
        expect(permissionsToBitmask(allOn)).toBe(expected);
    });

    test('permissionsToBitmask should convert all false to 0', (): void => {
        expect(permissionsToBitmask(allOff)).toBe(0);
    });

    test('permissionsToBitmask should convert partial permissions correctly', (): void => {
        const expected =
            BOT_PERMISSION_BITS.readMessages |
            BOT_PERMISSION_BITS.sendMessages |
            BOT_PERMISSION_BITS.manageServer |
            BOT_PERMISSION_BITS.manageRoles |
            BOT_PERMISSION_BITS.exportChannelMessages;
        expect(permissionsToBitmask(partial)).toBe(expected);
    });

    test('bitmaskToPermissions should convert 0 to all false', (): void => {
        expect(bitmaskToPermissions(0)).toEqual(allOff);
    });

    test('bitmaskToPermissions should convert partial bitmask correctly', (): void => {
        const mask =
            BOT_PERMISSION_BITS.readMessages |
            BOT_PERMISSION_BITS.sendMessages |
            BOT_PERMISSION_BITS.manageServer |
            BOT_PERMISSION_BITS.manageRoles |
            BOT_PERMISSION_BITS.exportChannelMessages;
        expect(bitmaskToPermissions(mask)).toEqual(partial);
    });

    test('should be reversible', (): void => {
        const mask = permissionsToBitmask(partial);
        expect(bitmaskToPermissions(mask)).toEqual(partial);

        const restoredMask = permissionsToBitmask(bitmaskToPermissions(mask));
        expect(restoredMask).toBe(mask);
    });
});
