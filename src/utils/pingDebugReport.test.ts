import { describe, expect, it } from 'vitest';

import type { PingNotification } from '@/api/pings/pings.types';
import type { Channel } from '@/api/servers/servers.types';

import {
    buildPingDebugReport,
    buildUnreadDebugRows,
    formatAge,
    formatTimeAgo,
    isChannelUnread,
} from './pingDebugReport';

const NOW = Date.parse('2026-09-26T12:00:00.000Z');

const mention = (overrides: Partial<PingNotification> = {}): PingNotification =>
    ({
        id: '0362009044010926080',
        type: 'mention',
        sender: 'cat',
        senderId: '0265935371727011840',
        serverId: 'srv-1',
        channelId: 'ch-1',
        timestamp: Date.parse('2026-09-26T11:59:00.000Z'),
        message: {
            messageId: '0362009044010926081',
            text: 'hello there',
            createdAt: '2026-09-26T11:59:00.000Z',
        },
        ...overrides,
    }) as PingNotification;

const exportPing = (
    overrides: Partial<PingNotification> = {},
): PingNotification =>
    ({
        id: '0362009044010926090',
        type: 'export_status',
        sender: 'exporter',
        senderId: '0265935371727011841',
        serverId: 'srv-1',
        channelId: 'ch-2',
        timestamp: Date.parse('2026-09-26T11:58:00.000Z'),
        message: {
            id: '0362009044010926091',
            text: 'Export finished',
            type: 'success',
        },
        ...overrides,
    }) as PingNotification;

describe('buildPingDebugReport', () => {
    it('keeps only pings from the requested server, excluding DM and foreign-server pings', () => {
        const report = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [
                mention(),
                mention({
                    id: '0362009044010926099',
                    serverId: undefined,
                    channelId: undefined,
                }),
                mention({
                    id: '0362009044010926098',
                    serverId: 'srv-2',
                    channelId: 'ch-9',
                }),
            ],
            badgeCount: 1,
            now: NOW,
        });

        expect(report.rows).toHaveLength(1);
        expect(report.rows[0]?.id).toBe('0362009044010926080');
        expect(report.listCount).toBe(1);
        expect(report.totalCount).toBe(3);
    });

    it('sorts rows newest first', () => {
        const older = mention({
            id: '0362009044010926082',
            timestamp: Date.parse('2026-09-26T11:00:00.000Z'),
        });
        const newer = mention({
            id: '0362009044010926083',
            timestamp: Date.parse('2026-09-26T11:59:30.000Z'),
        });

        const report = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [older, mention(), newer],
            badgeCount: 3,
            now: NOW,
        });

        expect(report.rows.map((r): string => r.id)).toEqual([
            '0362009044010926083',
            '0362009044010926080',
            '0362009044010926082',
        ]);
    });

    it('formats mention and export details differently', () => {
        const report = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [mention(), exportPing()],
            badgeCount: 2,
            now: NOW,
        });

        const byId = new Map(
            report.rows.map((r): [string, string] => [r.id, r.detail]),
        );
        expect(byId.get('0362009044010926080')).toBe('hello there');
        expect(byId.get('0362009044010926090')).toBe(
            '[success] Export finished',
        );
    });

    it('computes age from the injected now and clamps future timestamps to zero', () => {
        const report = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [
                mention(),
                mention({
                    id: '0362009044010926095',
                    timestamp: NOW + 60_000,
                }),
            ],
            badgeCount: 2,
            now: NOW,
        });

        const ages = new Map(
            report.rows.map((r): [string, number] => [r.id, r.ageMs]),
        );
        expect(ages.get('0362009044010926080')).toBe(60_000);
        expect(ages.get('0362009044010926095')).toBe(0);
    });

    it('flags a mismatch when the badge disagrees with the list length', () => {
        const mismatched = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [mention()],
            badgeCount: 4,
            now: NOW,
        });
        const matched = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [mention()],
            badgeCount: 1,
            now: NOW,
        });

        expect(mismatched.mismatch).toBe(true);
        expect(matched.mismatch).toBe(false);
    });

    it('handles an empty cache: zero rows, badge still reported', () => {
        const report = buildPingDebugReport({
            serverId: 'srv-1',
            pings: [],
            badgeCount: 2,
            now: NOW,
        });

        expect(report.rows).toEqual([]);
        expect(report.listCount).toBe(0);
        expect(report.totalCount).toBe(0);
        expect(report.mismatch).toBe(true);
    });
});

describe('formatAge', () => {
    it('steps through seconds, minutes, hours and days', () => {
        expect(formatAge(0)).toBe('0s');
        expect(formatAge(999)).toBe('0s');
        expect(formatAge(45_000)).toBe('45s');
        expect(formatAge(3 * 60_000)).toBe('3m');
        expect(formatAge(60 * 60_000)).toBe('1h');
        expect(formatAge(3 * 24 * 60 * 60_000)).toBe('3d');
    });
});

describe('formatTimeAgo', () => {
    it('formats a timestamp against the injected now', () => {
        expect(formatTimeAgo(NOW - 90_000, NOW)).toBe('1m ago');
        expect(formatTimeAgo(new Date(NOW - 5_000).toISOString(), NOW)).toBe(
            '5s ago',
        );
    });

    it('returns never for missing or zero timestamps', () => {
        expect(formatTimeAgo(null, NOW)).toBe('never');
        expect(formatTimeAgo(undefined, NOW)).toBe('never');
        expect(formatTimeAgo(0, NOW)).toBe('never');
        expect(formatTimeAgo('', NOW)).toBe('never');
    });
});

const channel = (overrides: Partial<Channel> = {}): Channel => ({
    id: 'ch-1',
    name: 'general',
    serverId: 'srv-1',
    type: 'text',
    position: 0,
    lastMessageAt: '2026-09-26T11:59:00.000Z',
    lastReadAt: '2026-09-26T11:00:00.000Z',
    ...overrides,
});

describe('isChannelUnread', () => {
    it('is unread when the last message is newer than the last read', () => {
        expect(isChannelUnread(channel())).toBe(true);
    });

    it('is read when the last read is newer than the last message', () => {
        expect(
            isChannelUnread(
                channel({ lastReadAt: '2026-09-26T11:59:30.000Z' }),
            ),
        ).toBe(false);
    });

    it('is unread when the channel was never read', () => {
        expect(isChannelUnread(channel({ lastReadAt: null }))).toBe(true);
    });

    it('is read when the channel has no messages', () => {
        expect(isChannelUnread(channel({ lastMessageAt: null }))).toBe(false);
    });

    it('is never unread for link channels', () => {
        expect(
            isChannelUnread(channel({ type: 'link', lastReadAt: null })),
        ).toBe(false);
    });
});

describe('buildUnreadDebugRows', () => {
    it('excludes link channels and sorts unread channels first', () => {
        const rows = buildUnreadDebugRows([
            channel({
                id: 'ch-1',
                name: 'read-one',
                lastReadAt: '2026-09-26T11:59:30.000Z',
            }),
            channel({ id: 'ch-2', name: 'unread-one', lastReadAt: null }),
            channel({
                id: 'ch-3',
                name: 'link-channel',
                type: 'link',
                lastReadAt: null,
            }),
            channel({
                id: 'ch-4',
                name: 'read-two',
                lastReadAt: '2026-09-26T11:59:30.000Z',
            }),
        ]);

        expect(rows.map((r): string => r.name)).toEqual([
            'unread-one',
            'read-one',
            'read-two',
        ]);
        expect(rows.map((r): string => r.id)).not.toContain('ch-3');
        expect(rows[0]?.unread).toBe(true);
        expect(rows[1]?.unread).toBe(false);
    });

    it('keeps raw timestamps for age rendering', () => {
        const rows = buildUnreadDebugRows([channel()]);

        expect(rows[0]?.lastMessageAt).toBe('2026-09-26T11:59:00.000Z');
        expect(rows[0]?.lastReadAt).toBe('2026-09-26T11:00:00.000Z');
    });
});
