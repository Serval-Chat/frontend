import { BOT_PERMISSION_KEYS } from '@/types/bot';
import type { BotPermissionKey, BotPermissions } from '@/types/bot';

export const BOT_PERMISSION_BITS: Record<BotPermissionKey, number> = {
    readMessages: Math.trunc(1),
    sendMessages: 1 << 1,
    manageMessages: 1 << 2,
    readUsers: 1 << 3,
    joinServers: 1 << 4,
    manageServer: 1 << 5,
    manageChannels: 1 << 6,
    manageMembers: 1 << 7,
    readReactions: 1 << 8,
    addReactions: 1 << 9,
    viewChannels: 1 << 10,
    connect: 1 << 11,
    deleteMessagesOfOthers: 1 << 12,
    manageRoles: 1 << 13,
    banMembers: 1 << 14,
    kickMembers: 1 << 15,
    manageInvites: 1 << 16,
    administrator: 1 << 17,
    manageWebhooks: 1 << 18,
    pingRolesAndEveryone: 1 << 19,
    manageReactions: 1 << 20,
    exportChannelMessages: 1 << 21,
    bypassSlowmode: 1 << 22,
    pinMessages: 1 << 23,
    seeDeletedMessages: 1 << 24,
    moderateMembers: 1 << 25,
    manageStickers: 1 << 26,
};

export const BOT_PERMISSION_LABELS: Record<BotPermissionKey, string> = {
    readMessages: 'Read messages',
    sendMessages: 'Send messages',
    manageMessages: 'Manage messages',
    readUsers: 'Access user profiles',
    joinServers: 'Join servers',
    manageServer: 'Manage server',
    manageChannels: 'Manage channels',
    manageMembers: 'Manage members',
    readReactions: 'View reactions',
    addReactions: 'Add reactions',
    viewChannels: 'View channels',
    connect: 'Connect to voice',
    deleteMessagesOfOthers: 'Delete messages of others',
    manageRoles: 'Manage roles',
    banMembers: 'Ban members',
    kickMembers: 'Kick members',
    manageInvites: 'Manage invites',
    administrator: 'Administrator',
    manageWebhooks: 'Manage webhooks',
    pingRolesAndEveryone: 'Mention @everyone',
    manageReactions: 'Manage reactions',
    exportChannelMessages: 'Export channel messages',
    bypassSlowmode: 'Bypass slowmode',
    pinMessages: 'Pin messages',
    seeDeletedMessages: 'See deleted messages',
    moderateMembers: 'Moderate members',
    manageStickers: 'Manage stickers',
};

export const BOT_PERMISSION_GROUPS: {
    title: string;
    keys: readonly BotPermissionKey[];
}[] = [
    {
        title: 'Bot Access',
        keys: ['joinServers', 'readUsers', 'readMessages', 'readReactions'],
    },
    {
        title: 'Channel Access',
        keys: [
            'viewChannels',
            'connect',
            'sendMessages',
            'addReactions',
            'manageReactions',
            'bypassSlowmode',
        ],
    },
    {
        title: 'Messages',
        keys: [
            'manageMessages',
            'deleteMessagesOfOthers',
            'pinMessages',
            'seeDeletedMessages',
            'exportChannelMessages',
        ],
    },
    {
        title: 'Server Management',
        keys: [
            'administrator',
            'manageServer',
            'manageChannels',
            'manageRoles',
            'manageMembers',
            'moderateMembers',
            'kickMembers',
            'banMembers',
            'manageInvites',
            'manageWebhooks',
            'pingRolesAndEveryone',
            'manageStickers',
        ],
    },
];

/**
 * Converts BotPermissions object to a bitmask integer
 */
export function permissionsToBitmask(permissions: BotPermissions): number {
    let bitmask = 0;
    for (const [key, bit] of Object.entries(BOT_PERMISSION_BITS)) {
        if (permissions[key as BotPermissionKey] === true) {
            bitmask |= bit;
        }
    }
    return bitmask;
}

/**
 * Converts a bitmask integer to a BotPermissions object
 */
export function bitmaskToPermissions(bitmask: number): BotPermissions {
    const permissions: BotPermissions = {};
    for (const key of BOT_PERMISSION_KEYS) {
        permissions[key] = (bitmask & BOT_PERMISSION_BITS[key]) !== 0;
    }
    return permissions;
}
