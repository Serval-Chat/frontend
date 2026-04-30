import type { BotPermissions } from '@/types/bot';

export const BOT_PERMISSION_BITS: Record<keyof BotPermissions, number> = {
    readMessages: 1 << 0,
    sendMessages: 1 << 1,
    manageMessages: 1 << 2,
    readUsers: 1 << 3,
    joinServers: 1 << 4,
    manageServer: 1 << 5,
    manageChannels: 1 << 6,
    manageMembers: 1 << 7,
    readReactions: 1 << 8,
    addReactions: 1 << 9,
};

/**
 * Converts BotPermissions object to a bitmask integer
 */
export function permissionsToBitmask(permissions: BotPermissions): number {
    let bitmask = 0;
    for (const [key, bit] of Object.entries(BOT_PERMISSION_BITS)) {
        if (permissions[key as keyof BotPermissions]) {
            bitmask |= bit;
        }
    }
    return bitmask;
}

/**
 * Converts a bitmask integer to a BotPermissions object
 */
export function bitmaskToPermissions(bitmask: number): BotPermissions {
    const permissions = {} as BotPermissions;
    for (const [key, bit] of Object.entries(BOT_PERMISSION_BITS)) {
        permissions[key as keyof BotPermissions] = (bitmask & bit) !== 0;
    }
    return permissions;
}
