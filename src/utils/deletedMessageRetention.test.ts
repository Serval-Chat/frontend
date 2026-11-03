import { describe, expect, it } from 'vitest';

import {
    DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES,
    DELETED_MESSAGE_RETENTION_OPTIONS,
    formatDeletedMessageRetention,
    getDeletedMessageRetentionAtSliderIndex,
    getDeletedMessageRetentionSliderIndex,
    isDeletedMessageWithinRetention,
    sanitizeDeletedMessageRetentionMinutes,
} from '@/utils/deletedMessageRetention';

describe('deleted message retention helpers', (): void => {
    it('sanitizes malformed and out-of-range values', (): void => {
        expect(sanitizeDeletedMessageRetentionMinutes(Number.NaN)).toBe(
            DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES,
        );
        expect(sanitizeDeletedMessageRetentionMinutes('30')).toBe(
            DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES,
        );
        expect(sanitizeDeletedMessageRetentionMinutes(1)).toBe(5);
        expect(sanitizeDeletedMessageRetentionMinutes(5000)).toBe(4320);
        expect(sanitizeDeletedMessageRetentionMinutes(15.9)).toBe(20);
        expect(sanitizeDeletedMessageRetentionMinutes(45)).toBe(30);
    });

    it('maps slider stops to the ten supported durations', (): void => {
        expect(DELETED_MESSAGE_RETENTION_OPTIONS).toEqual([
            5, 10, 20, 30, 60, 120, 360, 720, 1440, 4320,
        ]);
        DELETED_MESSAGE_RETENTION_OPTIONS.forEach((minutes, index) => {
            expect(getDeletedMessageRetentionAtSliderIndex(index)).toBe(
                minutes,
            );
            expect(getDeletedMessageRetentionSliderIndex(minutes)).toBe(index);
        });
    });

    it('checks message expiry against a sanitized minute window', (): void => {
        const now = Date.parse('2026-11-02T12:00:00.000Z');

        expect(
            isDeletedMessageWithinRetention(
                new Date(now - 5 * 60_000 + 1),
                5,
                now,
            ),
        ).toBe(true);
        expect(
            isDeletedMessageWithinRetention(new Date(now - 5 * 60_000), 5, now),
        ).toBe(false);
        expect(isDeletedMessageWithinRetention('invalid', 5, now)).toBe(false);
    });

    it('formats exact minute, hour, and day values', (): void => {
        expect(formatDeletedMessageRetention(5)).toBe('5 minutes');
        expect(formatDeletedMessageRetention(60)).toBe('1 hour');
        expect(formatDeletedMessageRetention(4320)).toBe('3 days');
    });
});
